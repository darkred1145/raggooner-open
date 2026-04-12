/**
 * Vercel Serverless Function — Ban Voting
 *
 * Handles ban proposal and voting without Firebase Blaze plan.
 * Uses Firebase Admin SDK to read/write tournament data directly.
 *
 * POST /api/ban-vote
 * Body: { action: "propose" | "vote", tournamentId, umaId, vote?, authToken }
 *
 * Environment variables (set in Vercel dashboard):
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
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
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

// Resolve captain's playerId from Firebase Auth UID
async function resolvePlayerId(db, authToken) {
  if (!authToken) return null;
  const playersSnap = await db
    .collection('artifacts').doc(APP_ID)
    .collection('public').doc('data')
    .collection('players')
    .where('firebaseUid', '==', authToken)
    .limit(1)
    .get();
  if (playersSnap.empty) return null;
  return playersSnap.docs[0].id;
}

export default async function handler(req, res) {
  // CORS for preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { action, tournamentId, umaId, vote, authToken } = req.body;

  if (!tournamentId || !umaId) {
    res.status(400).json({ error: 'tournamentId and umaId are required' });
    return;
  }

  try {
    const db = await getDb();
    const tournamentRef = getTournamentRef(db, tournamentId);
    const tournamentSnap = await tournamentRef.get();

    if (!tournamentSnap.exists) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    const tournament = tournamentSnap.data();
    const playerId = await resolvePlayerId(db, authToken);

    if (!playerId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // --- CAPTAIN PROPOSE BAN ---
    if (action === 'propose') {
      if (tournament.status !== 'ban') {
        res.status(400).json({ error: 'Tournament is not in ban phase' });
        return;
      }
      if (!tournament.banVotingEnabled) {
        res.status(400).json({ error: 'Ban voting is not enabled' });
        return;
      }

      const proposals = tournament.captainBanProposals || {};
      if (proposals[playerId]) {
        res.status(400).json({ error: 'You have already proposed a ban' });
        return;
      }

      // Check if player is a captain
      const teams = tournament.teams || [];
      const captainIds = teams.map((t) => t.captainId);
      if (!captainIds.includes(playerId)) {
        res.status(403).json({ error: 'You are not a captain' });
        return;
      }

      const updatedProposals = { ...proposals, [playerId]: umaId };
      const allCaptainsVoted = captainIds.every((cid) => updatedProposals[cid]);

      const updateData = { captainBanProposals: updatedProposals };
      if (allCaptainsVoted) {
        updateData.banPhaseStatus = 'player-voting';
      }

      await tournamentRef.update(updateData);
      res.json({ success: true, allCaptainsVoted });
      return;
    }

    // --- PLAYER VOTE ON BAN ---
    if (action === 'vote') {
      if (tournament.status !== 'ban') {
        res.status(400).json({ error: 'Tournament is not in ban phase' });
        return;
      }
      if (tournament.banPhaseStatus !== 'player-voting') {
        res.status(400).json({ error: 'Not in player voting phase yet' });
        return;
      }
      if (vote === undefined || vote === null) {
        res.status(400).json({ error: 'vote (boolean) is required' });
        return;
      }

      const proposals = tournament.captainBanProposals || {};
      const proposedUmas = Object.values(proposals);
      if (!proposedUmas.includes(umaId)) {
        res.status(400).json({ error: 'That uma was not proposed for banning' });
        return;
      }

      const votes = tournament.banVotes || {};
      const umaVotes = votes[umaId] || {};

      if (umaVotes[playerId] !== undefined) {
        res.status(400).json({ error: 'You have already voted on this ban' });
        return;
      }

      const updatedUmaVotes = { ...umaVotes, [playerId]: vote };
      const updatedVotes = { ...votes, [umaId]: updatedUmaVotes };

      const playerIds = tournament.playerIds || [];
      const totalVoters = playerIds.length;
      const yesVotes = Object.values(updatedUmaVotes).filter((v) => v === true).length;
      const threshold = tournament.banVoteThreshold || 0.5;
      const banPassed = yesVotes / totalVoters > threshold;
      const allVoted = playerIds.every((pid) => updatedUmaVotes[pid] !== undefined);

      const updateData = { banVotes: updatedVotes };

      if (banPassed || allVoted) {
        if (banPassed) {
          const currentBans = tournament.bans || [];
          if (!currentBans.includes(umaId)) {
            updateData.bans = [...currentBans, umaId];
          }
        }

        const allUmasResolved = proposedUmas.every((proposedUma) => {
          const v = votes[proposedUma] || {};
          if (proposedUma === umaId) return true;
          return playerIds.every((pid) => v[pid] !== undefined);
        });

        if (allUmasResolved) {
          updateData.banPhaseStatus = 'resolved';
        }
      }

      await tournamentRef.update(updateData);
      res.json({ success: true, banPassed, allVoted });
      return;
    }

    res.status(400).json({ error: 'Invalid action. Use "propose" or "vote".' });
  } catch (error) {
    console.error('Ban vote error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
