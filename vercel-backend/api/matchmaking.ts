import admin from 'firebase-admin';
import { VercelRequest, VercelResponse } from '@vercel/node';

const APP_ID = process.env.APP_ID || 'raggooner-uma-2026';
const QUEUE_SIZE = 9;

type Player = {
  id: string;
  name?: string;
  avatarUrl?: string;
};

type MatchResult = {
  teamA: Player[];
  teamB: Player[];
  teamC: Player[];
};

type QueueAction = 'join' | 'leave' | 'status' | 'clear_match';

type QueueState = {
  queue: Player[];
  matches: Record<string, MatchResult>;
  updatedAt: string;
};

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

async function getDb() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_BASE64');
  }

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
    );
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  return admin.firestore();
}

function getPlayersCollection(db: admin.firestore.Firestore) {
  return db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players');
}

function getStateRef(db: admin.firestore.Firestore) {
  return db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('quickPlay').doc('matchmaking');
}

function getDefaultState(): QueueState {
  return {
    queue: [],
    matches: {},
    updatedAt: new Date().toISOString(),
  };
}

async function resolvePlayer(db: admin.firestore.Firestore, authToken?: string, discordId?: string): Promise<Player | null> {
  const playersRef = getPlayersCollection(db);

  if (authToken) {
    const snap = await playersRef.where('firebaseUid', '==', authToken).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0]!;
      const data = doc.data();
      return { id: doc.id, name: data.name || 'Player', avatarUrl: data.avatarUrl };
    }
  }

  if (discordId) {
    const snap = await playersRef.where('discordId', '==', discordId).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0]!;
      const data = doc.data();
      return { id: doc.id, name: data.name || 'Player', avatarUrl: data.avatarUrl };
    }
  }

  return null;
}

function shufflePlayers(players: Player[]) {
  const shuffled = [...players];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function buildMatchResult(players: Player[]): MatchResult {
  return {
    teamA: players.slice(0, 3),
    teamB: players.slice(3, 6),
    teamC: players.slice(6, 9),
  };
}

function buildPlayerResponse(state: QueueState, playerId: string) {
  const matchResult = state.matches[playerId] ?? null;

  return {
    status: matchResult ? 'match_found' : 'searching',
    queuedCount: state.queue.length,
    matchResult,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, authToken, discordId } = req.body as {
    action?: QueueAction;
    authToken?: string;
    discordId?: string;
  };

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  if (!['join', 'leave', 'status', 'clear_match'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  if (!authToken && !discordId) {
    return res.status(401).json({ error: 'Authentication is required' });
  }

  try {
    const db = await getDb();
    const player = await resolvePlayer(db, authToken, discordId);

    if (!player) {
      return res.status(404).json({ error: 'Linked player not found' });
    }

    const stateRef = getStateRef(db);

    if (action === 'status') {
      const snap = await stateRef.get();
      const state = snap.exists ? ({ ...getDefaultState(), ...snap.data() } as QueueState) : getDefaultState();
      return res.status(200).json(buildPlayerResponse(state, player.id));
    }

    if (action === 'clear_match') {
      const payload = await db.runTransaction(async (tx) => {
        const snap = await tx.get(stateRef);
        const state = snap.exists ? ({ ...getDefaultState(), ...snap.data() } as QueueState) : getDefaultState();

        delete state.matches[player.id];
        state.updatedAt = new Date().toISOString();

        tx.set(stateRef, state, { merge: true });
        return { status: 'cleared', queuedCount: state.queue.length };
      });

      return res.status(200).json(payload);
    }

    if (action === 'leave') {
      const payload = await db.runTransaction(async (tx) => {
        const snap = await tx.get(stateRef);
        const state = snap.exists ? ({ ...getDefaultState(), ...snap.data() } as QueueState) : getDefaultState();

        state.queue = state.queue.filter((queuedPlayer) => queuedPlayer.id !== player.id);
        state.updatedAt = new Date().toISOString();

        tx.set(stateRef, state, { merge: true });
        return { status: 'left', queuedCount: state.queue.length };
      });

      return res.status(200).json(payload);
    }

    const payload = await db.runTransaction(async (tx) => {
      const snap = await tx.get(stateRef);
      const state = snap.exists ? ({ ...getDefaultState(), ...snap.data() } as QueueState) : getDefaultState();

      if (!state.matches[player.id] && !state.queue.some((queuedPlayer) => queuedPlayer.id === player.id)) {
        state.queue.push(player);
      }

      while (state.queue.length >= QUEUE_SIZE) {
        const selectedPlayers = shufflePlayers(state.queue.slice(0, QUEUE_SIZE));
        state.queue = state.queue.slice(QUEUE_SIZE);

        const matchResult = buildMatchResult(selectedPlayers);
        for (const selectedPlayer of selectedPlayers) {
          state.matches[selectedPlayer.id] = matchResult;
        }
      }

      state.updatedAt = new Date().toISOString();
      tx.set(stateRef, state, { merge: true });

      return buildPlayerResponse(state, player.id);
    });

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Matchmaking error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
