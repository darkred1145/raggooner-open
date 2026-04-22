/**
 * Vercel Serverless Function — Queue Management
 *
 * Handles: joinQueue, leaveQueue, processQueue
 *
 * POST /api/queue
 * Body: { action, queueId, partyMembers, authToken, discordId }
 *
 * Environment variables:
 *   FIREBASE_SERVICE_ACCOUNT_BASE64 — base64-encoded service account JSON
 *   APP_ID — Firebase app ID (default: raggooner-uma-2026)
 */

import admin from 'firebase-admin';

const APP_ID = process.env.APP_ID || 'raggooner-uma-2026';

let dbInitialized = false;

async function getDb() {
  if (!dbInitialized) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
    );
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    dbInitialized = true;
  }
  return admin.firestore();
}

function getQueueRef(db, queueId) {
  return db
    .collection('artifacts').doc(APP_ID)
    .collection('public').doc('data')
    .collection('queues').doc(queueId);
}

async function getPlayerId(db, uid, discordId) {
  if (uid) {
    const snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('firebaseUid', '==', uid).limit(1).get();
    if (!snap.empty) return { playerId: snap.docs[0].id, playerData: snap.docs[0].data() };
  }
  if (discordId) {
    const snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('discordId', '==', discordId).limit(1).get();
    if (!snap.empty) return { playerId: snap.docs[0].id, playerData: snap.docs[0].data() };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleJoinQueue(db, { uid, queueId, partyMembers, discordId }) {
  const playerInfo = await getPlayerId(db, uid, discordId);
  if (!playerInfo) throw { code: 401, message: 'Not authenticated' };
  const { playerId } = playerInfo;

  const queueRef = getQueueRef(db, queueId);
  const queueSnap = await queueRef.get();
  if (!queueSnap.exists) throw { code: 404, message: 'Queue not found.' };

  const queue = queueSnap.data();
  if (queue.status !== 'open') {
    throw { code: 400, message: 'Queue is not open.' };
  }

  // Check if already in queue
  const isInSolos = queue.solos?.some(s => s.playerId === playerId);
  const isInParties = queue.parties?.some(p => p.memberIds.includes(playerId));
  if (isInSolos || isInParties) {
    throw { code: 409, message: 'You are already in the queue.' };
  }

  const updateData = {};

  if (partyMembers && partyMembers.length > 0) {
    // Creating a party
    const allMembers = [playerId, ...partyMembers];
    if (allMembers.length !== 3) {
      throw { code: 400, message: 'Parties must have exactly 3 members.' };
    }
    // Check if any member is already in queue
    for (const memberId of allMembers) {
      const memberInSolos = queue.solos?.some(s => s.playerId === memberId);
      const memberInParties = queue.parties?.some(p => p.memberIds.includes(memberId));
      if (memberInSolos || memberInParties) {
        throw { code: 400, message: `Player ${memberId} is already in the queue.` };
      }
    }

    const partyId = `${playerId}_${Date.now()}`;
    const party = {
      id: partyId,
      leaderId: playerId,
      memberIds: allMembers,
      createdAt: new Date().toISOString(),
    };
    updateData.parties = admin.firestore.FieldValue.arrayUnion(party);
  } else {
    // Joining as solo
    const entry = {
      id: `${playerId}_${Date.now()}`,
      playerId,
      joinedAt: new Date().toISOString(),
    };
    updateData.solos = admin.firestore.FieldValue.arrayUnion(entry);
  }

  await queueRef.update(updateData);
  return { success: true };
}

async function handleLeaveQueue(db, { uid, queueId, discordId }) {
  const playerInfo = await getPlayerId(db, uid, discordId);
  if (!playerInfo) throw { code: 401, message: 'Not authenticated' };
  const { playerId } = playerInfo;

  const queueRef = getQueueRef(db, queueId);
  const queueSnap = await queueRef.get();
  if (!queueSnap.exists) throw { code: 404, message: 'Queue not found.' };

  const queue = queueSnap.data();
  const updateData = {};

  // Remove from solos
  const soloEntry = queue.solos?.find(s => s.playerId === playerId);
  if (soloEntry) {
    updateData.solos = admin.firestore.FieldValue.arrayRemove(soloEntry);
  }

  // Remove from parties (if leader, remove whole party; if member, remove from party)
  const party = queue.parties?.find(p => p.memberIds.includes(playerId));
  if (party) {
    if (party.leaderId === playerId) {
      // Leader leaving, remove whole party
      updateData.parties = admin.firestore.FieldValue.arrayRemove(party);
    } else {
      // Member leaving, remove from party
      const updatedParty = { ...party, memberIds: party.memberIds.filter(id => id !== playerId) };
      updateData.parties = admin.firestore.FieldValue.arrayRemove(party);
      if (updatedParty.memberIds.length > 1) {
        updateData.parties = admin.firestore.FieldValue.arrayUnion(updatedParty);
      }
    }
  }

  if (Object.keys(updateData).length > 0) {
    await queueRef.update(updateData);
  }
  return { success: true };
}

async function handleProcessQueue(db, { queueId }) {
  const queueRef = getQueueRef(db, queueId);
  const queueSnap = await queueRef.get();
  if (!queueSnap.exists) throw { code: 404, message: 'Queue not found.' };

  const queue = queueSnap.data();
  if (queue.status !== 'open') {
    return { success: false, message: 'Queue not open' };
  }

  // Count total players
  const partyPlayers = queue.parties?.reduce((sum, p) => sum + p.memberIds.length, 0) || 0;
  const soloPlayers = queue.solos?.length || 0;
  const totalPlayers = partyPlayers + soloPlayers;

  if (totalPlayers < 9) {
    return { success: false, message: 'Not enough players' };
  }

  // Collect all players
  const allPlayers = [];
  queue.parties?.forEach(p => allPlayers.push(...p.memberIds));
  queue.solos?.forEach(s => allPlayers.push(s.playerId));

  // Take first 9 players
  const selectedPlayers = allPlayers.slice(0, 9);

  // Create tournament
  const tournamentId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const tournamentRef = db
    .collection('artifacts').doc(APP_ID)
    .collection('public').doc('data')
    .collection('tournaments').doc(tournamentId);

  // Randomly assign to 3 teams
  const shuffled = selectedPlayers.sort(() => Math.random() - 0.5);
  const teams = [
    { id: 'A', members: shuffled.slice(0, 3) },
    { id: 'B', members: shuffled.slice(3, 6) },
    { id: 'C', members: shuffled.slice(6, 9) },
  ];

  const playersMap = {};
  const playerIds = [];
  const teamsData = [];

  for (const team of teams) {
    const captainId = team.members[0];
    const memberIds = team.members.slice(1);
    teamsData.push({
      id: team.id,
      captainId,
      memberIds,
      name: `Team ${team.id}`,
      points: 0,
      finalsPoints: 0,
      group: team.id,
      color: team.id === 'A' ? '#ef4444' : team.id === 'B' ? '#3b82f6' : '#10b981',
    });

    for (const playerId of team.members) {
      playersMap[playerId] = {
        id: playerId,
        name: '', // Will be filled from player data
        isCaptain: playerId === captainId,
        uma: '',
      };
      playerIds.push(playerId);
    }
  }

  // Get player names
  const playersSnap = await db
    .collection('artifacts').doc(APP_ID)
    .collection('public').doc('data')
    .collection('players')
    .where(admin.firestore.FieldPath.documentId(), 'in', selectedPlayers)
    .get();

  playersSnap.forEach(doc => {
    const playerId = doc.id;
    const data = doc.data();
    if (playersMap[playerId]) {
      playersMap[playerId].name = data.name || '';
    }
  });

  const newTournament = {
    id: tournamentId,
    name: `Racc Open - ${new Date().toLocaleDateString()}`,
    status: 'registration',
    stage: 'groups',
    players: playersMap,
    teams: teamsData,
    races: {},
    playerIds,
    format: 'uma-ban',
    isOfficial: false,
    isSecured: false,
    selfSignupEnabled: false, // No more signups
    captainActionsEnabled: true,
    teamRenamingEnabled: true,
    usePlacementTiebreaker: true,
    umaDraftMaxCopiesPerUma: 1,
    umaDraftAllowSameGroupDuplicates: false,
    pointsSystem: { 1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1, 9: 0 },
    createdAt: new Date().toISOString(),
    playedAt: new Date().toISOString(),
  };

  await tournamentRef.set(newTournament);

  // Update queue
  await queueRef.update({
    status: 'closed',
    tournamentId,
  });

  return { success: true, tournamentId };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { action, queueId, partyMembers, authToken, discordId } = req.body;
  if (!queueId) { res.status(400).json({ error: 'queueId is required' }); return; }
  if (!authToken && !discordId) { res.status(401).json({ error: 'Not authenticated' }); return; }
  if (!action) { res.status(400).json({ error: 'action is required' }); return; }

  try {
    const db = await getDb();
    const handlers = {
      join: () => handleJoinQueue(db, { uid: authToken, queueId, partyMembers, discordId }),
      leave: () => handleLeaveQueue(db, { uid: authToken, queueId, discordId }),
      process: () => handleProcessQueue(db, { queueId }),
    };

    const fn = handlers[action];
    if (!fn) { res.status(400).json({ error: `Unknown action: ${action}` }); return; }

    const result = await fn();
    res.json(result);
  } catch (err) {
    const code = err.code || 500;
    const message = err.message || 'Internal server error';
    if (code >= 500) console.error('Queue error:', err);
    res.status(code).json({ error: message });
  }
}