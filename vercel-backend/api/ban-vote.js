/**
 * Vercel Serverless Function — Ban Voting
 *
 * POST /api/ban-vote
 * Body: { action, tournamentId, umaId, vote?, authToken, discordId }
 */

import admin from 'firebase-admin';

const APP_ID = process.env.APP_ID || 'raggooner-uma-2026';

let dbInitialized = false;

async function getDb() {
  if (!dbInitialized) {
    const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    dbInitialized = true;
  }
  return admin.firestore();
}

function getTournamentRef(db, tournamentId) {
  return db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('tournaments').doc(tournamentId);
}

async function getPlayerId(db, authToken, discordId) {
  let snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('firebaseUid', '==', authToken).limit(1).get();
  if (!snap.empty) return { playerId: snap.docs[0].id, playerData: snap.docs[0].data() };
  if (discordId) {
    snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('discordId', '==', discordId).limit(1).get();
    if (!snap.empty) return { playerId: snap.docs[0].id, playerData: snap.docs[0].data() };
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { action, tournamentId, umaId, vote, authToken, discordId } = req.body;
  if (!tournamentId || !umaId) { res.status(400).json({ error: 'tournamentId and umaId are required' }); return; }

  try {
    const db = await getDb();
    const tournamentRef = getTournamentRef(db, tournamentId);
    const tournamentSnap = await tournamentRef.get();
    if (!tournamentSnap.exists) { res.status(404).json({ error: 'Tournament not found' }); return; }

    const tournament = tournamentSnap.data();
    const playerInfo = await getPlayerId(db, authToken, discordId);
    if (!playerInfo) { res.status(401).json({ error: 'Not authenticated' }); return; }
    const { playerId } = playerInfo;

    if (action === 'propose') {
      if (tournament.status !== 'ban') { res.status(400).json({ error: 'Not in ban phase' }); return; }
      if (!tournament.banVotingEnabled) { res.status(400).json({ error: 'Ban voting not enabled' }); return; }

      const proposals = tournament.captainBanProposals || {};
      if (proposals[playerId]) { res.status(400).json({ error: 'Already proposed a ban' }); return; }

      const teams = tournament.teams || [];
      const captainIds = teams.map((t) => t.captainId);
      if (!captainIds.includes(playerId)) { res.status(403).json({ error: 'Not a captain' }); return; }

      const updatedProposals = { ...proposals, [playerId]: umaId };
      const allCaptainsVoted = captainIds.every((cid) => updatedProposals[cid]);
      const updateData = { captainBanProposals: updatedProposals };
      if (allCaptainsVoted) updateData.banPhaseStatus = 'player-voting';

      await tournamentRef.update(updateData);
      res.json({ success: true, allCaptainsVoted });
      return;
    }

    if (action === 'vote') {
      if (tournament.status !== 'ban') { res.status(400).json({ error: 'Not in ban phase' }); return; }
      if (tournament.banPhaseStatus !== 'player-voting') { res.status(400).json({ error: 'Not in voting phase' }); return; }
      if (vote === undefined || vote === null) { res.status(400).json({ error: 'vote is required' }); return; }

      const proposals = tournament.captainBanProposals || {};
      if (!Object.values(proposals).includes(umaId)) { res.status(400).json({ error: 'Uma not proposed' }); return; }

      const votes = tournament.banVotes || {};
      const umaVotes = votes[umaId] || {};
      if (umaVotes[playerId] !== undefined) { res.status(400).json({ error: 'Already voted' }); return; }

      const updatedUmaVotes = { ...umaVotes, [playerId]: vote };
      const updatedVotes = { ...votes, [umaId]: updatedUmaVotes };
      const playerIds = tournament.playerIds || [];
      const totalVoters = playerIds.length;
      const yesVotes = Object.values(updatedUmaVotes).filter((v) => v === true).length;
      const threshold = tournament.banVoteThreshold || 0.5;
      const banPassed = totalVoters > 0 && yesVotes / totalVoters > threshold;
      const allVoted = totalVoters > 0 && playerIds.every((pid) => updatedUmaVotes[pid] !== undefined);

      const updateData = { banVotes: updatedVotes };
      if (banPassed || allVoted) {
        if (banPassed) {
          const currentBans = tournament.bans || [];
          if (!currentBans.includes(umaId)) updateData.bans = [...currentBans, umaId];
        }
        const allUmasResolved = Object.values(proposals).every((proposedUma) => {
          const v = votes[proposedUma] || {};
          if (proposedUma === umaId) return true;
          return playerIds.every((pid) => v[pid] !== undefined);
        });
        if (allUmasResolved) updateData.banPhaseStatus = 'resolved';
      }

      await tournamentRef.update(updateData);
      res.json({ success: true, banPassed, allVoted });
      return;
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Ban vote error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
