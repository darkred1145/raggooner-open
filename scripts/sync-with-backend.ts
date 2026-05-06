/**
 * Backend database synchronization for raggooner-open fork (TypeScript version).
 * * Syncs data from the upstream Raggooner API to local Firestore.
 * - Actively transforms legacy data schemas into the flattened format.
 * - Caches known players to instantly fetch missing profiles on the fly.
 * - INTERACTIVE: Asks for confirmation before overwriting conflicting local data.
 * - GHOST-WRITE PREVENTION: Silently ignores unchanged tournaments.
 * * Usage:
 * ts-node scripts/sync-with-backend.ts              (Fast sync: only checks active tournaments)
 * ts-node scripts/sync-with-backend.ts --discover   (Deep sync: verifies ALL tournaments, including finished ones)
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const API_BASE = 'https://us-central1-raggooneropen.cloudfunctions.net';
const STATE_FILE = path.join(__dirname, '.sync-state.json');
const APP_ID = 'raggooner-uma-2026';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to ask yes/no questions in the terminal
function askQuestion(query: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

interface SyncState {
  lastSync: string | null;
  tournaments: Record<string, any>;
  knownPlayers: string[];
}

// Parse args
const args = process.argv.slice(2);
let API_TOKEN = process.env.API_TOKEN;
let DRY_RUN = false;
let DISCOVER_NEW = false;
let FORCE = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--token') API_TOKEN = args[i + 1];
  if (args[i] === '--dry-run') DRY_RUN = true;
  if (args[i] === '--discover') DISCOVER_NEW = true;
  if (args[i] === '--force') FORCE = true;
}

if (!API_TOKEN) {
  console.error('❌ API_TOKEN not provided.');
  process.exit(1);
}

// Initialize Firebase Admin SDK
const serviceAccountFiles = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.startsWith('raggooner-uma-2026') && f.endsWith('.json'));
if (!serviceAccountFiles.length) {
  console.error('❌ Service account key not found in root directory');
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, '..', serviceAccountFiles[0]), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'raggooner-uma-2026'
});

const db = admin.app().firestore();

async function fetchAPI<T>(endpoint: string, params: Record<string, any> = {}, retries = 3): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, val]) => {
    if (val) url.searchParams.append(key, val);
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) return (await res.json()) as Promise<T>;

      if (res.status === 429) {
        const body = await res.json() as any;
        console.error('\n❌ HTTP 429: Daily quota exceeded!');
        console.error(`   Usage: ${body.currentUsage} / ${body.dailyLimit} reads`);
        throw new Error('FATAL_QUOTA_EXCEEDED');
      }

      if (res.status === 401 || res.status === 403) throw new Error(`FATAL_AUTH_ERROR: HTTP ${res.status}`);
      if (res.status === 404) throw new Error(`NOT_FOUND`);

      if (res.status >= 500 && attempt < retries) {
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }

      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    } catch (error: any) {
      if (attempt === retries || error.message.includes('FATAL_') || error.message.includes('NOT_FOUND')) throw error;
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error(`Failed to fetch ${endpoint} after ${retries} attempts.`);
}

function loadState(): SyncState {
  if (!fs.existsSync(STATE_FILE)) return { lastSync: null, tournaments: {}, knownPlayers: [] };
  try { 
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); 
    if (!state.knownPlayers) state.knownPlayers = [];
    return state;
  } 
  catch { return { lastSync: null, tournaments: {}, knownPlayers: [] }; }
}

function saveState(state: SyncState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function generatePassword(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

async function syncTournament(tournamentData: any, batch: admin.firestore.WriteBatch): Promise<boolean> {
  const docRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('tournaments').doc(tournamentData.id);
  const secretRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('secrets').doc(tournamentData.id);
  
  const existing = await docRef.get();
  const existingData: any = existing.exists ? (existing.data() || {}) : null;
  
  const freshData: any = {
    ...(existingData || {}),  
    ...tournamentData,    
    races: tournamentData.races || {},
    players: tournamentData.players || {},
    teams: tournamentData.teams || [],
  };

  // Transformation Logic
  freshData.stage = "finals";
  if (freshData.stages) delete freshData.stages;

  if (Array.isArray(freshData.teams)) {
    freshData.teams = freshData.teams.map((team: any) => {
      const updatedTeam = { ...team };
      updatedTeam.finalsPoints = team.stagePoints?.finals ?? updatedTeam.finalsPoints ?? 0;
      updatedTeam.group = team.stageGroups?.finals ?? updatedTeam.group ?? "A";
      updatedTeam.inFinals = Array.isArray(team.qualifiedStages) ? team.qualifiedStages.includes('finals') : (updatedTeam.inFinals ?? true);
      updatedTeam.points = updatedTeam.points ?? 0;

      delete updatedTeam.stagePoints;
      delete updatedTeam.stageGroups;
      delete updatedTeam.qualifiedStages;
      return updatedTeam;
    });
  }

  // --- INTERACTIVE COMPARISON & GHOST WRITE PREVENTION ---
  if (existingData) {
    const localRacingStr = JSON.stringify({ races: existingData.races || {}, teams: existingData.teams || [] });
    const upstreamRacingStr = JSON.stringify({ races: freshData.races || {}, teams: freshData.teams || [] });

    // 1. Strict diff for the interactive prompt (races and teams only)
    if (localRacingStr !== upstreamRacingStr) {
      if (DRY_RUN) {
        console.log(`\n   ⚠️ Local data for ${tournamentData.name} differs from upstream. (Would ask for overwrite permission)`);
      } else {
        console.log(`\n   ⚠️ Oh, it looks like your local data for ${tournamentData.name} (${tournamentData.id}) is different from the original site!`);
        const shouldOverwrite = FORCE || await askQuestion(`   ❓ Do you want to overwrite your local changes with the upstream data? (y/N): `);
        
        if (!shouldOverwrite) {
          console.log(`   ⏭️ Skipping overwrite for ${tournamentData.name}. Your local edits were kept.`);
          return false;
        }
      }
    } else {
      // 2. If racing data is identical, check if status, name, or players changed upstream
      const localMetaStr = JSON.stringify({ name: existingData.name, status: existingData.status, playerIds: existingData.playerIds || [] });
      const upstreamMetaStr = JSON.stringify({ name: freshData.name, status: freshData.status, playerIds: freshData.playerIds || [] });
      
      if (localMetaStr === upstreamMetaStr) {
        // Absolutely nothing meaningful changed. Abort the database write completely to prevent ghost syncing!
        return false; 
      }
    }
  }

  // If we made it here, something changed or the user confirmed an overwrite.
  freshData.syncedAt = new Date();
  batch.set(docRef, freshData);
  
  if (!tournamentData.password || tournamentData.password === '') {
    const newPassword = generatePassword();
    batch.set(secretRef, { password: newPassword }, { merge: true });
  }

  return true;
}

async function syncMissingPlayers(playerIds: string[], state: SyncState, batch: admin.firestore.WriteBatch): Promise<void> {
  if (!playerIds || !playerIds.length) return;

  for (const playerId of playerIds) {
    if (!state.knownPlayers.includes(playerId)) {
      console.log(`   👤 New player detected! Fetching profile for ${playerId}...`);
      try {
        const playerData = await fetchAPI<any>('/getPlayerById', { id: playerId });
        const docRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').doc(playerId);
        
        batch.set(docRef, { ...playerData, syncedAt: new Date() }, { merge: true });
        state.knownPlayers.push(playerId);
      } catch (err: any) {
        if (err.message.includes('NOT_FOUND')) console.warn(`      ⚠️ Player ${playerId} not found upstream.`);
      }
    }
  }
}

async function syncCompletedPlayers(tournamentData: any): Promise<void> {
  const playerIds: string[] = tournamentData.playerIds || [];
  if (!playerIds.length) return;

  console.log(`\n   💾 Fetching updated stats for ${playerIds.length} participating players...`);
  const batch = db.batch();
  
  for (const playerId of playerIds) {
    try {
      const playerData = await fetchAPI<any>('/getPlayerById', { id: playerId });
      const docRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').doc(playerId);
      batch.set(docRef, { ...playerData, syncedAt: new Date() }, { merge: true });
    } catch (err: any) {
      if (err.message.includes('NOT_FOUND')) console.warn(`      ⚠️ Player ${playerId} not found upstream.`);
    }
  }

  if (!DRY_RUN) {
    await batch.commit();
    console.log(`      ✅ Player stats synced successfully.`);
  }
}

async function main(): Promise<void> {
  console.log('🔄 Raggooner Backend Synchronization');
  console.log('=====================================');
  if (DRY_RUN) console.log('📋 DRY RUN MODE - No changes will be made');

  const state = loadState();
  const batch = db.batch();
  let syncCount = 0;

  try {
    if (DISCOVER_NEW) {
      console.log('🔍 DISCOVER MODE - Deep verifying ALL tournaments (active and finished)');
      const allTournaments = await fetchAPI<any>('/getAllTournaments');
      const tournamentsList = allTournaments.data || [];
      
      for (const t of tournamentsList) {
        // Smart fetch: If the master list doesn't include the deep racing data, fetch the exact document
        let fullData = t;
        if (!fullData.teams || !fullData.races) {
          fullData = await fetchAPI<any>('/getTournamentById', { id: t.id });
        }

        const isNew = !state.tournaments[t.id];
        const previousStatus = state.tournaments[t.id]?.status;

        if (isNew) console.log(`\n✨ Found New Tournament: ${t.name}`);
        
        const wasSynced = await syncTournament(fullData, batch);
        
        if (wasSynced) {
          await syncMissingPlayers(fullData.playerIds || [], state, batch);

          if (previousStatus !== 'completed' && fullData.status === 'completed') {
            console.log(`      ⚡ ${fullData.name} completed! Fetching final player data...`);
            await syncCompletedPlayers(fullData);
          } else if (!isNew) {
            console.log(`      ✅ Restored/Updated integrity for ${fullData.name}`);
          }

          state.tournaments[t.id] = { id: t.id, name: t.name, status: t.status };
          syncCount++;
        }
      }
    } else {
      console.log('⚡ FAST MODE - Only checking active tournaments to save quota');
      const activeIds = Object.values(state.tournaments).filter(t => t.status !== 'completed').map(t => t.id);
      
      if (activeIds.length > 0) {
        console.log(`\n🔍 Checking ${activeIds.length} active tournaments for updates...`);
        for (const id of activeIds) {
          try {
            const freshData = await fetchAPI<any>('/getTournamentById', { id });
            const previousStatus = state.tournaments[id].status;
            
            const wasSynced = await syncTournament(freshData, batch);
            
            if (wasSynced) {
              await syncMissingPlayers(freshData.playerIds || [], state, batch);
              state.tournaments[id].status = freshData.status;
              syncCount++;

              if (previousStatus !== 'completed' && freshData.status === 'completed') {
                console.log(`      ⚡ ${freshData.name} completed! Fetching final player data...`);
                await syncCompletedPlayers(freshData);
              } else {
                console.log(`      ✅ Synced active state for ${freshData.name}`);
              }
            }
          } catch (err: any) {
            if (err.message.includes('NOT_FOUND')) console.warn(`   ⚠️ Tournament ${id} missing upstream.`);
          }
        }
      } else {
        console.log('\n✅ No active tournaments to check. Run with --discover if you expect new tournaments.');
      }
    }

    if (syncCount > 0) {
      if (!DRY_RUN) {
        await batch.commit();
        state.lastSync = new Date().toISOString();
        saveState(state);
        console.log(`\n🎉 Successfully queued ${syncCount} operations. Writing to database...`);
      } else {
        console.log(`\n📋 Would sync ${syncCount} tournaments (dry-run).`);
      }
    } else {
      console.log('\n🎉 Up to date! No changes were needed.');
    }

    await db.terminate();
  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main();