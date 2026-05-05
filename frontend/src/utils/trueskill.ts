import type { Tournament, Team } from '../types';
import { compareTeams, recalculateTournamentScores } from './utils';

export interface TrueSkillSnapshot {
  mu: number;
  sigma: number;
  exposure: number;
  score: number;
  penalty: number;
  matches: number;
  isProvisional: boolean;
  epithet: string;
}

export interface TrueSkillHistoryEntry extends TrueSkillSnapshot {
  playerId: string;
  tournamentId: string;
  tournamentName: string;
  seasonId: string;
  playedAt: string;
  deltaScore: number;
}

export interface SeasonTrueSkillResult {
  ratings: Map<string, TrueSkillSnapshot>;
  histories: Map<string, TrueSkillHistoryEntry[]>;
}

const DEFAULT_MU = 25;
const DEFAULT_SIGMA = 25 / 3;
const BETA = 25 / 6;
const TAU = 25 / 300;
const PROVISIONAL_MATCHES = 3;

type MutableRating = {
  mu: number;
  sigma: number;
  matches: number;
};

type RankedTeam = {
  id: string;
  rank: number;
  playerIds: string[];
};

const SQRT_2 = Math.sqrt(2);
const SQRT_2PI = Math.sqrt(2 * Math.PI);

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function gaussianPdf(x: number): number {
  return Math.exp(-(x * x) / 2) / SQRT_2PI;
}

function gaussianCdf(x: number): number {
  return 0.5 * (1 + erf(x / SQRT_2));
}

function vExceedsMargin(delta: number): number {
  const denominator = gaussianCdf(delta);
  return denominator < 1e-9 ? -delta : gaussianPdf(delta) / denominator;
}

function wExceedsMargin(delta: number): number {
  const v = vExceedsMargin(delta);
  return v * (v + delta);
}

function toSnapshot(rating: MutableRating): TrueSkillSnapshot {
  const exposure = rating.mu - 3 * rating.sigma;
  const score = Math.max(0, Math.round((exposure + 25) * 40));
  const penalty = Math.round(3 * rating.sigma * 40);
  const isProvisional = rating.matches < PROVISIONAL_MATCHES;

  return {
    mu: Number(rating.mu.toFixed(3)),
    sigma: Number(rating.sigma.toFixed(3)),
    exposure: Number(exposure.toFixed(3)),
    score,
    penalty,
    matches: rating.matches,
    isProvisional,
    epithet: getTrueSkillEpithet(score, rating.matches),
  };
}

export function getTrueSkillEpithet(score: number, matches: number): string {
  if (matches < PROVISIONAL_MATCHES) return 'Provisional';
  if (score >= 1500) return 'Transcendent';
  if (score >= 1400) return 'Legend';
  if (score >= 1325) return 'Elite';
  if (score >= 1250) return 'Ace';
  if (score >= 1175) return 'Expert';
  if (score >= 1100) return 'Veteran';
  if (score >= 1025) return 'Contender';
  return 'Initiate';
}

function getOrderedTeams(tournament: Tournament): Team[] {
  const { teams: scoredTeams } = recalculateTournamentScores(tournament);
  const finalistTeams = scoredTeams.filter(team => team.inFinals);

  if (finalistTeams.length > 0) {
    return [
      ...finalistTeams.sort((a, b) => compareTeams(a, b, true, tournament, true)),
      ...scoredTeams
        .filter(team => !team.inFinals)
        .sort((a, b) => compareTeams(a, b, true, tournament, false)),
    ];
  }

  return [...scoredTeams].sort((a, b) => {
    const totalDiff = ((b.points || 0) + (b.finalsPoints || 0)) - ((a.points || 0) + (a.finalsPoints || 0));
    if (totalDiff !== 0) return totalDiff;
    return compareTeams(a, b, true, tournament, false);
  });
}

function getRankedTeams(tournament: Tournament): RankedTeam[] {
  return getOrderedTeams(tournament)
    .map((team, index) => ({
      id: team.id,
      rank: index + 1,
      playerIds: [team.captainId, ...(team.memberIds || [])].filter(Boolean),
    }))
    .filter(team => team.playerIds.length > 0);
}

function ensureRating(playerRatings: Map<string, MutableRating>, playerId: string): MutableRating {
  const existing = playerRatings.get(playerId);
  if (existing) return existing;

  const created: MutableRating = {
    mu: DEFAULT_MU,
    sigma: DEFAULT_SIGMA,
    matches: 0,
  };
  playerRatings.set(playerId, created);
  return created;
}

function inflateUncertainty(rating: MutableRating) {
  rating.sigma = Math.sqrt((rating.sigma * rating.sigma) + (TAU * TAU));
}

function updateAdjacentTeams(playerRatings: Map<string, MutableRating>, higherTeam: RankedTeam, lowerTeam: RankedTeam) {
  const higherRatings = higherTeam.playerIds.map(playerId => ensureRating(playerRatings, playerId));
  const lowerRatings = lowerTeam.playerIds.map(playerId => ensureRating(playerRatings, playerId));

  const higherMu = higherRatings.reduce((sum, rating) => sum + rating.mu, 0);
  const lowerMu = lowerRatings.reduce((sum, rating) => sum + rating.mu, 0);
  const sigmaSq = [...higherRatings, ...lowerRatings].reduce((sum, rating) => sum + (rating.sigma * rating.sigma), 0);
  const c = Math.sqrt(sigmaSq + (higherTeam.playerIds.length + lowerTeam.playerIds.length) * (BETA * BETA));
  const delta = (higherMu - lowerMu) / c;
  const v = vExceedsMargin(delta);
  const w = wExceedsMargin(delta);

  higherRatings.forEach(rating => {
    const sigmaSqOverC = (rating.sigma * rating.sigma) / c;
    rating.mu += sigmaSqOverC * v;
    const multiplier = 1 - ((rating.sigma * rating.sigma) / (c * c)) * w;
    rating.sigma = Math.max(1e-3, Math.sqrt((rating.sigma * rating.sigma) * Math.max(multiplier, 1e-6)));
  });

  lowerRatings.forEach(rating => {
    const sigmaSqOverC = (rating.sigma * rating.sigma) / c;
    rating.mu -= sigmaSqOverC * v;
    const multiplier = 1 - ((rating.sigma * rating.sigma) / (c * c)) * w;
    rating.sigma = Math.max(1e-3, Math.sqrt((rating.sigma * rating.sigma) * Math.max(multiplier, 1e-6)));
  });
}

export function computeSeasonTrueSkill(tournaments: Tournament[], seasonId: string | null | undefined): SeasonTrueSkillResult {
  const ratings = new Map<string, MutableRating>();
  const histories = new Map<string, TrueSkillHistoryEntry[]>();

  if (!seasonId) {
    return { ratings: new Map(), histories };
  }

  const ratedTournaments = tournaments
    .filter(tournament => tournament.status === 'completed' && tournament.isOfficial && tournament.seasonId === seasonId)
    .sort((a, b) => new Date(a.playedAt ?? a.createdAt).getTime() - new Date(b.playedAt ?? b.createdAt).getTime());

  ratedTournaments.forEach(tournament => {
    const rankedTeams = getRankedTeams(tournament);
    const participants = [...new Set(rankedTeams.flatMap(team => team.playerIds))];

    participants.forEach(playerId => inflateUncertainty(ensureRating(ratings, playerId)));

    for (let index = 0; index < rankedTeams.length - 1; index++) {
      updateAdjacentTeams(ratings, rankedTeams[index]!, rankedTeams[index + 1]!);
    }

    participants.forEach(playerId => {
      const rating = ensureRating(ratings, playerId);
      const previousEntries = histories.get(playerId) ?? [];
      const previousScore = previousEntries[previousEntries.length - 1]?.score ?? Math.round((25 - 3 * (25 / 3) + 25) * 40);

      rating.matches += 1;
      const snapshot = toSnapshot(rating);
      const historyEntry: TrueSkillHistoryEntry = {
        ...snapshot,
        playerId,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        seasonId,
        playedAt: tournament.playedAt ?? tournament.createdAt,
        deltaScore: snapshot.score - previousScore,
      };

      histories.set(playerId, [...previousEntries, historyEntry]);
    });
  });

  return {
    ratings: new Map(Array.from(ratings.entries()).map(([playerId, rating]) => [playerId, toSnapshot(rating)])),
    histories,
  };
}

export interface FFARatingResult {
  ratings: Map<string, TrueSkillSnapshot>;
  histories: Map<string, TrueSkillHistoryEntry[]>;
}

export function computeFFATrueSkill(
  tournaments: Tournament[],
  seasonId: string | null | undefined
): FFARatingResult {
  const ratings = new Map<string, MutableRating>();
  const histories = new Map<string, TrueSkillHistoryEntry[]>();

  if (!seasonId) {
    return { ratings: new Map(), histories };
  }

  const ratedTournaments = tournaments
    .filter(t => t.status === 'completed' && t.isOfficial && t.seasonId === seasonId)
    .sort((a, b) => new Date(a.playedAt ?? a.createdAt).getTime() - new Date(b.playedAt ?? b.createdAt).getTime());

  for (const tournament of ratedTournaments) {
    const races = tournament.races || {};
    for (const race of Object.values(races)) {
      const placements = race.placements || {};
      const playerEntries = Object.entries(placements)
        .map(([playerId, position]) => ({ playerId, position: position as number }))
        .filter(e => e.position > 0);

      if (playerEntries.length <= 1) continue;

      playerEntries.forEach(e => inflateUncertainty(ensureRating(ratings, e.playerId)));

      for (let i = 0; i < playerEntries.length - 1; i++) {
        for (let j = i + 1; j < playerEntries.length; j++) {
          const higher = playerEntries[i]!;
          const lower = playerEntries[j]!;
          if (higher.position < lower.position) {
            updateAdjacentFFA(ratings, higher.playerId, lower.playerId);
          } else if (higher.position > lower.position) {
            updateAdjacentFFA(ratings, lower.playerId, higher.playerId);
          }
        }
      }

      const tournamentName = tournament.name;
      const playedAt = tournament.playedAt ?? tournament.createdAt;
      playerEntries.forEach(e => {
        const rating = ensureRating(ratings, e.playerId);
        const previousEntries = histories.get(e.playerId) ?? [];
        const previousScore = previousEntries[previousEntries.length - 1]?.score
          ?? Math.round((DEFAULT_MU - 3 * DEFAULT_SIGMA + 25) * 40);

        rating.matches += 1;
        const snapshot = toSnapshot(rating);
        const historyEntry: TrueSkillHistoryEntry = {
          ...snapshot,
          playerId: e.playerId,
          tournamentId: tournament.id,
          tournamentName,
          seasonId,
          playedAt,
          deltaScore: snapshot.score - previousScore,
        };
        histories.set(e.playerId, [...previousEntries, historyEntry]);
      });
    }
  }

  return {
    ratings: new Map(Array.from(ratings.entries()).map(([playerId, rating]) => [playerId, toSnapshot(rating)])),
    histories,
  };
}

function updateAdjacentFFA(
  playerRatings: Map<string, MutableRating>,
  higherPlayerId: string,
  lowerPlayerId: string
) {
  const higher = ensureRating(playerRatings, higherPlayerId);
  const lower = ensureRating(playerRatings, lowerPlayerId);

  const sigmaSq = (higher.sigma * higher.sigma) + (lower.sigma * lower.sigma);
  const c = Math.sqrt(sigmaSq + 2 * (BETA * BETA));
  const delta = (higher.mu - lower.mu) / c;
  const v = vExceedsMargin(delta);
  const w = wExceedsMargin(delta);

  higher.mu += (higher.sigma * higher.sigma) / c * v;
  higher.sigma = Math.max(1e-3, Math.sqrt((higher.sigma * higher.sigma) * Math.max(1 - ((higher.sigma * higher.sigma) / (c * c)) * w, 1e-6)));

  lower.mu -= (lower.sigma * lower.sigma) / c * v;
  lower.sigma = Math.max(1e-3, Math.sqrt((lower.sigma * lower.sigma) * Math.max(1 - ((lower.sigma * lower.sigma) / (c * c)) * w, 1e-6)));
}

export interface TeamRatingResult {
  ratings: Map<string, TrueSkillSnapshot>;
  histories: Map<string, TrueSkillHistoryEntry[]>;
}

export function computeTeamTrueSkill(
  tournaments: Tournament[],
  seasonId: string | null | undefined
): TeamRatingResult {
  const ratings = new Map<string, MutableRating>();
  const histories = new Map<string, TrueSkillHistoryEntry[]>();

  if (!seasonId) {
    return { ratings: new Map(), histories };
  }

  const ratedTournaments = tournaments
    .filter(t => t.status === 'completed' && t.isOfficial && t.seasonId === seasonId)
    .sort((a, b) => new Date(a.playedAt ?? a.createdAt).getTime() - new Date(b.playedAt ?? b.createdAt).getTime());

  ratedTournaments.forEach(tournament => {
    const teams = tournament.teams || [];
    if (teams.length === 0) return;

    const scoredTeams = teams.map(team => {
      const totalPoints = (team.points || 0) + (team.finalsPoints || 0);
      const playerIds = [team.captainId, ...(team.memberIds || [])].filter(Boolean) as string[];
      return { id: team.id, totalPoints, playerIds, group: team.group || 'A', inFinals: team.inFinals ?? true };
    });

    const sorted = [...scoredTeams].sort((a, b) => b.totalPoints - a.totalPoints);
    const rankedTeams = sorted.map((team, index) => ({ id: team.id, rank: index + 1, playerIds: team.playerIds }))
      .filter(team => team.playerIds.length > 0);

    if (rankedTeams.length < 2) return;

    const participants = [...new Set(rankedTeams.flatMap(team => team.playerIds))];
    participants.forEach(playerId => inflateUncertainty(ensureRating(ratings, playerId)));

    for (let index = 0; index < rankedTeams.length - 1; index++) {
      updateAdjacentTeams(ratings, rankedTeams[index]!, rankedTeams[index + 1]!);
    }

    participants.forEach(playerId => {
      const rating = ensureRating(ratings, playerId);
      const previousEntries = histories.get(playerId) ?? [];
      const previousScore = previousEntries[previousEntries.length - 1]?.score
        ?? Math.round((DEFAULT_MU - 3 * DEFAULT_SIGMA + 25) * 40);

      rating.matches += 1;
      const snapshot = toSnapshot(rating);
      const historyEntry: TrueSkillHistoryEntry = {
        ...snapshot,
        playerId,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        seasonId,
        playedAt: tournament.playedAt ?? tournament.createdAt,
        deltaScore: snapshot.score - previousScore,
      };
      histories.set(playerId, [...previousEntries, historyEntry]);
    });
  });

  return {
    ratings: new Map(Array.from(ratings.entries()).map(([playerId, rating]) => [playerId, toSnapshot(rating)])),
    histories,
  };
}
