import { VercelRequest, VercelResponse } from '@vercel/node';

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

const QUEUE_SIZE = 9;
let globalQueue: Player[] = [];
const pendingMatches = new Map<string, MatchResult>();

const setCorsHeaders = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
};

const isPlayer = (value: unknown): value is Player => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && candidate.id.trim().length > 0;
};

const buildPlayerResponse = (playerId?: string) => {
  const queuedCount = globalQueue.length;
  const matchResult = playerId ? pendingMatches.get(playerId) ?? null : null;

  return {
    status: matchResult ? 'match_found' : 'searching',
    queuedCount,
    matchResult,
  };
};

const shufflePlayers = (players: Player[]) => {
  const shuffled = [...players];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const createMatch = () => {
  const selectedPlayers = shufflePlayers(globalQueue.splice(0, QUEUE_SIZE));
  const matchResult: MatchResult = {
    teamA: selectedPlayers.slice(0, 3),
    teamB: selectedPlayers.slice(3, 6),
    teamC: selectedPlayers.slice(6, 9),
  };

  for (const player of selectedPlayers) {
    pendingMatches.set(player.id, matchResult);
  }

  return matchResult;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, player } = req.body as { action?: QueueAction; player?: unknown };

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  if (!['join', 'leave', 'status', 'clear_match'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  if (!isPlayer(player)) {
    return res.status(400).json({ error: 'A valid player is required' });
  }

  try {
    if (action === 'clear_match') {
      pendingMatches.delete(player.id);
      return res.status(200).json({ status: 'cleared' });
    }

    if (action === 'leave') {
      globalQueue = globalQueue.filter((queuedPlayer) => queuedPlayer.id !== player.id);
      return res.status(200).json({ status: 'left', queuedCount: globalQueue.length });
    }

    if (action === 'status') {
      return res.status(200).json(buildPlayerResponse(player.id));
    }

    if (!globalQueue.some((queuedPlayer) => queuedPlayer.id === player.id) && !pendingMatches.has(player.id)) {
      globalQueue.push(player);
    }

    if (!pendingMatches.has(player.id) && globalQueue.length >= QUEUE_SIZE) {
      createMatch();
    }

    return res.status(200).json(buildPlayerResponse(player.id));
  } catch (error) {
    console.error('Matchmaking error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
