/**
 * Vercel Serverless Function — Captain Actions
 *
 * Handles: captainDraftPlayer, captainPickUma, captainSubmitUma,
 *          captainSaveTapResults, captainUpdateRacePlacement
 *
 * POST /api/captain
 * Body: { action, tournamentId, ...action-specific fields, authToken }
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

function getTournamentRef(db, tournamentId) {
  return db
    .collection('artifacts').doc(APP_ID)
    .collection('public').doc('data')
    .collection('tournaments').doc(tournamentId);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function getPlayerId(db, uid) {
  const snap = await db
    .collection('artifacts').doc(APP_ID)
    .collection('public').doc('data')
    .collection('players')
    .where('firebaseUid', '==', uid)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { playerId: snap.docs[0].id, playerData: snap.docs[0].data() };
}

async function resolveCaptainTeam(db, uid, tournamentId) {
  const playerInfo = await getPlayerId(db, uid);
  if (!playerInfo) throw { code: 404, message: 'No player linked to your account.' };
  const { playerId, playerData } = playerInfo;

  const tournamentRef = getTournamentRef(db, tournamentId);
  const tournamentSnap = await tournamentRef.get();
  if (!tournamentSnap.exists) throw { code: 404, message: 'Tournament not found.' };

  const tournament = tournamentSnap.data();
  if (!tournament.captainActionsEnabled) {
    throw { code: 400, message: 'Captain actions are disabled for this tournament.' };
  }

  const teams = tournament.teams || [];
  const team = teams.find((t) => t.captainId === playerId);
  if (!team) throw { code: 403, message: 'You are not a captain in this tournament.' };

  return { playerId, playerData, team, tournament, tournamentRef };
}

function recalculateTeams(tournament) {
  const pointsSystem = tournament.pointsSystem || {};
  const defaultPoints = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2,
  };
  const activePoints =
    Object.keys(pointsSystem).length > 0 ? pointsSystem : defaultPoints;

  const teams = ((tournament.teams || []).map((t) => ({
    ...t,
    points: 0,
    finalsPoints: 0,
    adjustments: t.adjustments || [],
  })));

  const findTeamIdx = (pid) =>
    teams.findIndex(
      (t) => t.captainId === pid || (t.memberIds || []).includes(pid)
    );

  Object.values(tournament.races || {}).forEach((race) => {
    const isFinals = race.stage === 'finals';
    Object.entries(race.placements || {}).forEach(([pid, pos]) => {
      const pts = activePoints[Number(pos)] || 0;
      const idx = findTeamIdx(pid);
      if (idx !== -1) {
        if (isFinals) teams[idx].finalsPoints += pts;
        else teams[idx].points += pts;
      }
    });
  });

  teams.forEach((t) => {
    (t.adjustments || []).forEach((adj) => {
      if (adj.stage === 'finals') t.finalsPoints += adj.amount;
      else t.points += adj.amount;
    });
  });

  return teams;
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleDraftPlayer(db, { uid, tournamentId, targetPlayerId }) {
  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(db, uid, tournamentId);

  if (tournament.status !== 'draft') {
    throw { code: 400, message: 'Tournament is not in draft phase.' };
  }

  const { order, currentIdx } = tournament.draft || {};
  if (!order || currentIdx === undefined) {
    throw { code: 400, message: 'Draft not initialized.' };
  }
  if (order[currentIdx] !== team.id) {
    throw { code: 403, message: 'It is not your turn to pick.' };
  }

  const player = tournament.players?.[targetPlayerId];
  if (!player) throw { code: 404, message: 'Player not in this tournament.' };

  const teams = tournament.teams || [];
  const alreadyPicked = teams.some(
    (t) => t.captainId === targetPlayerId || (t.memberIds || []).includes(targetPlayerId)
  );
  if (alreadyPicked) throw { code: 409, message: 'Player already picked.' };

  const updatedTeams = teams.map((t) =>
    t.id === team.id
      ? { ...t, memberIds: [...(t.memberIds || []), targetPlayerId] }
      : t
  );

  await tournamentRef.update({
    teams: updatedTeams,
    'draft.currentIdx': currentIdx + 1,
  });
  return { success: true };
}

async function handlePickUma(db, { uid, tournamentId, umaId }) {
  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(db, uid, tournamentId);

  if (tournament.status !== 'pick') {
    throw { code: 400, message: 'Tournament is not in uma pick phase.' };
  }

  const { order, currentIdx } = tournament.draft || {};
  if (!order || currentIdx === undefined) {
    throw { code: 400, message: 'Uma draft not initialized.' };
  }
  if (order[currentIdx] !== team.id) {
    throw { code: 403, message: 'It is not your turn to pick.' };
  }

  const bans = tournament.bans || [];
  if (bans.includes(umaId)) {
    throw { code: 400, message: 'That uma is banned.' };
  }

  const teams = tournament.teams || [];
  const alreadyPicked = teams.some((t) => (t.umaPool || []).includes(umaId));
  if (alreadyPicked) throw { code: 409, message: 'Uma already picked by another team.' };

  const updatedTeams = teams.map((t) =>
    t.id === team.id
      ? { ...t, umaPool: [...(t.umaPool || []), umaId] }
      : t
  );

  await tournamentRef.update({
    teams: updatedTeams,
    'draft.currentIdx': currentIdx + 1,
    draftLastPickTime: new Date().toISOString(),
  });
  return { success: true };
}

async function handleSubmitUma(db, { uid, tournamentId, playerId: targetPlayerId, umaId }) {
  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(db, uid, tournamentId);

  if (tournament.status !== 'active') {
    throw { code: 400, message: 'Tournament is not active.' };
  }

  const teamMemberIds = [team.captainId, ...(team.memberIds || [])];
  if (!teamMemberIds.includes(targetPlayerId)) {
    throw { code: 403, message: 'That player is not on your team.' };
  }

  if (tournament.format === 'uma-draft' && umaId) {
    const umaPool = team.umaPool || [];
    if (!umaPool.includes(umaId)) {
      throw { code: 403, message: 'That uma is not in your team pool.' };
    }
    const players = tournament.players || {};
    const takenByTeammate = teamMemberIds
      .filter((pid) => pid !== targetPlayerId)
      .some((pid) => players[pid]?.uma === umaId);
    if (takenByTeammate) {
      throw { code: 409, message: 'Uma already assigned to a teammate.' };
    }
  }

  await tournamentRef.update({ [`players.${targetPlayerId}.uma`]: umaId || '' });
  return { success: true };
}

async function handleSaveTapResults(db, { uid, tournamentId, group, raceNumber, placements }) {
  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(db, uid, tournamentId);

  if (tournament.status !== 'active') {
    throw { code: 400, message: 'Tournament is not active.' };
  }

  const stage = tournament.stage;
  if (stage === 'groups' && team.group !== group) {
    throw { code: 403, message: 'Your team is not in that group.' };
  }
  if (stage === 'finals' && !team.inFinals) {
    throw { code: 403, message: 'Your team did not qualify for finals.' };
  }

  const key = `${stage}-${group}-${raceNumber}`;
  const existingRaces = tournament.races || {};
  const raceData = {
    id: existingRaces[key]?.id || crypto.randomUUID(),
    stage,
    group,
    raceNumber: Number(raceNumber),
    timestamp: new Date().toISOString(),
    placements,
  };

  const updatedTeams = recalculateTeams({
    ...tournament,
    races: { ...existingRaces, [key]: raceData },
  });

  await tournamentRef.update({
    [`races.${key}`]: raceData,
    teams: updatedTeams,
  });
  return { success: true };
}

async function handleUpdateRacePlacement(db, { uid, tournamentId, group, raceNumber, position, playerId: targetPlayerId }) {
  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(db, uid, tournamentId);

  if (tournament.status !== 'active') {
    throw { code: 400, message: 'Tournament is not active.' };
  }

  const stage = tournament.stage;
  if (stage === 'groups' && team.group !== group) {
    throw { code: 403, message: 'Your team is not in that group.' };
  }
  if (stage === 'finals' && !team.inFinals) {
    throw { code: 403, message: 'Your team did not qualify for finals.' };
  }

  const key = `${stage}-${group}-${raceNumber}`;
  const existingRaces = tournament.races || {};
  const existingRace = existingRaces[key];
  const raceData = existingRace ? { ...existingRace } : {
    id: crypto.randomUUID(),
    stage,
    group,
    raceNumber: Number(raceNumber),
    timestamp: new Date().toISOString(),
    placements: {},
  };

  const newPlacements = { ...(raceData.placements || {}) };

  if (targetPlayerId) delete newPlacements[targetPlayerId];
  for (const [pid, pos] of Object.entries(newPlacements)) {
    if (pos === Number(position)) delete newPlacements[pid];
  }
  if (targetPlayerId) newPlacements[targetPlayerId] = Number(position);

  raceData.placements = newPlacements;
  raceData.timestamp = new Date().toISOString();

  const updatedTeams = recalculateTeams({
    ...tournament,
    races: { ...existingRaces, [key]: raceData },
  });

  await tournamentRef.update({
    [`races.${key}`]: raceData,
    teams: updatedTeams,
  });
  return { success: true };
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

  const { action, tournamentId, authToken, ...rest } = req.body;
  if (!tournamentId) { res.status(400).json({ error: 'tournamentId is required' }); return; }
  if (!authToken) { res.status(401).json({ error: 'Not authenticated' }); return; }
  if (!action) { res.status(400).json({ error: 'action is required' }); return; }

  try {
    const db = await getDb();
    const handlers = {
      draftPlayer: () => handleDraftPlayer(db, { uid: authToken, tournamentId, ...rest }),
      pickUma: () => handlePickUma(db, { uid: authToken, tournamentId, ...rest }),
      submitUma: () => handleSubmitUma(db, { uid: authToken, tournamentId, ...rest }),
      saveTap: () => handleSaveTapResults(db, { uid: authToken, tournamentId, ...rest }),
      updatePlacement: () => handleUpdateRacePlacement(db, { uid: authToken, tournamentId, ...rest }),
    };

    const fn = handlers[action];
    if (!fn) { res.status(400).json({ error: `Unknown action: ${action}` }); return; }

    const result = await fn();
    res.json(result);
  } catch (err) {
    const code = err.code || 500;
    const message = err.message || 'Internal server error';
    if (code >= 500) console.error('Captain action error:', err);
    res.status(code).json({ error: message });
  }
}
