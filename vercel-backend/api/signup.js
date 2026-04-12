/**
 * Vercel Serverless Function — Tournament Signup
 *
 * Handles: selfSignupTournament, selfLeaveTournament
 *
 * POST /api/signup
 * Body: { action, tournamentId, authToken }
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

async function getPlayerId(db, uid, discordId) {
  let snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('firebaseUid', '==', uid).limit(1).get();
  if (!snap.empty) return { playerId: snap.docs[0].id, playerData: snap.docs[0].data() };
  if (discordId) {
    snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('discordId', '==', discordId).limit(1).get();
    if (!snap.empty) return { playerId: snap.docs[0].id, playerData: snap.docs[0].data() };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleSelfSignup(db, { uid, tournamentId, discordId }) {
  const playerInfo = await getPlayerId(db, uid, discordId);
  if (!playerInfo) throw { code: 401, message: 'Not authenticated' };
  const { playerId, playerData } = playerInfo;

  const tournamentRef = getTournamentRef(db, tournamentId);
  const tournamentSnap = await tournamentRef.get();
  if (!tournamentSnap.exists) throw { code: 404, message: 'Tournament not found.' };

  const tournament = tournamentSnap.data();
  if (!tournament.selfSignupEnabled) {
    throw { code: 400, message: 'Sign-ups are closed for this tournament.' };
  }
  if (tournament.players?.[playerId]) {
    throw { code: 409, message: 'You are already registered.' };
  }

  const playerIds = tournament.playerIds || [];
  await tournamentRef.update({
    [`players.${playerId}`]: {
      id: playerId,
      name: playerData.name || '',
      isCaptain: false,
      uma: '',
    },
    playerIds: [...playerIds, playerId],
  });
  return { success: true };
}

async function handleSelfLeave(db, { uid, tournamentId, discordId }) {
  const playerInfo = await getPlayerId(db, uid, discordId);
  if (!playerInfo) throw { code: 401, message: 'Not authenticated' };
  const { playerId } = playerInfo;

  const tournamentRef = getTournamentRef(db, tournamentId);
  const tournamentSnap = await tournamentRef.get();
  if (!tournamentSnap.exists) throw { code: 404, message: 'Tournament not found.' };

  const tournament = tournamentSnap.data();
  if (tournament.status !== 'registration') {
    throw { code: 400, message: 'Can only leave during registration.' };
  }

  const players = { ...(tournament.players || {}) };
  delete players[playerId];
  const playerIds = (tournament.playerIds || []).filter((pid) => pid !== playerId);

  await tournamentRef.update({ players, playerIds });
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

  const { action, tournamentId, authToken, discordId } = req.body;
  if (!tournamentId) { res.status(400).json({ error: 'tournamentId is required' }); return; }
  if (!authToken && !discordId) { res.status(401).json({ error: 'Not authenticated' }); return; }
  if (!action) { res.status(400).json({ error: 'action is required' }); return; }

  try {
    const db = await getDb();
    const handlers = {
      signup: () => handleSelfSignup(db, { uid: authToken, tournamentId, discordId }),
      leave: () => handleSelfLeave(db, { uid: authToken, tournamentId, discordId }),
    };

    const fn = handlers[action];
    if (!fn) { res.status(400).json({ error: `Unknown action: ${action}` }); return; }

    const result = await fn();
    res.json(result);
  } catch (err) {
    const code = err.code || 500;
    const message = err.message || 'Internal server error';
    if (code >= 500) console.error('Signup error:', err);
    res.status(code).json({ error: message });
  }
}
