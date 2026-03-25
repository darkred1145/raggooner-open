import { onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { db } from "../db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentResult {
  tournamentId: string;
  tournamentName: string;
  teamName: string;
  teamRank: number;
  teamInFinals: boolean;
  isOfficial: boolean;
  seasonId?: string;
  playedAt: string;
  racesPlayed: number;
  raceWins: number;
  avgPoints: number;
  avgPlacement: number;
  dominancePct: number;
  umaPlayed?: string;
}

interface TeamRankResult {
  rank: number;
  inFinals: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Mirrors the priority used by compareTeams() on the client:
// finalists sorted by finalsPoints desc, non-finalists sorted by points desc.
function computeTeamRanking(
  tournament: FirebaseFirestore.DocumentData
): Map<string, TeamRankResult> {
  const teams = [...((tournament.teams ?? []) as any[])];

  const finalists = teams
    .filter((t) => t.inFinals)
    .sort((a, b) => (b.finalsPoints ?? 0) - (a.finalsPoints ?? 0));

  const nonFinalists = teams
    .filter((t) => !t.inFinals)
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  const ranking = new Map<string, TeamRankResult>();
  finalists.forEach((team, idx) => ranking.set(team.id, { rank: idx + 1, inFinals: true }));
  nonFinalists.forEach((team, idx) => ranking.set(team.id, { rank: idx + 1, inFinals: false }));
  return ranking;
}

function findPlayerTeam(
  tournament: FirebaseFirestore.DocumentData,
  playerId: string
): any {
  const teams = (tournament.teams ?? []) as any[];
  return (
    teams.find(
      (t) => t.captainId === playerId || (t.memberIds ?? []).includes(playerId)
    ) ?? null
  );
}

// Increments (direction=1) or decrements (direction=-1) every participant's
// aggregate stats in their GlobalPlayer document, and maintains the 5-entry
// recentResults array on each player.
async function updatePlayers(
  appId: string,
  tournamentId: string,
  tournament: FirebaseFirestore.DocumentData,
  direction: 1 | -1
): Promise<void> {
  const players = Object.values(tournament.players ?? {}) as any[];
  const races = Object.values(tournament.races ?? {}) as any[];
  const teamRanking = computeTeamRanking(tournament);

  const promises = players.map(async (player) => {
    const playerRef = db.doc(`artifacts/${appId}/public/data/players/${player.id}`);

    let totalFaced = 0;
    let totalBeaten = 0;
    let raceCount = 0;
    let raceWins = 0;
    let totalPlacementSum = 0;
    let totalPoints = 0;

    const pointsSystem = (tournament.pointsSystem ?? {}) as Record<number, number>;
    const defaultPoints: Record<number, number> = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2 };
    const activePoints = Object.keys(pointsSystem).length > 0 ? pointsSystem : defaultPoints;

    for (const race of races) {
      const position = race.placements?.[player.id];
      if (position == null) continue;
      const playersInRace = Object.keys(race.placements).length;
      if (playersInRace <= 1) continue;
      raceCount++;
      totalFaced += playersInRace - 1;
      totalBeaten += playersInRace - position;
      totalPlacementSum += position;
      if (position === 1) raceWins++;
      totalPoints += activePoints[position] ?? 0;
    }

    const update: Record<string, any> = {
      "metadata.totalTournaments": FieldValue.increment(direction),
      "metadata.totalRaces": FieldValue.increment(direction * raceCount),
      "metadata.opponentsFaced": FieldValue.increment(direction * totalFaced),
      "metadata.opponentsBeaten": FieldValue.increment(direction * totalBeaten),
    };

    if (direction === 1) {
      update["metadata.lastPlayed"] = new Date().toISOString();
    }

    if (tournament.seasonId) {
      const s = tournament.seasonId;
      update[`metadata.seasons.${s}.opponentsFaced`] =
        FieldValue.increment(direction * totalFaced);
      update[`metadata.seasons.${s}.opponentsBeaten`] =
        FieldValue.increment(direction * totalBeaten);
    }

    const snap = await playerRef.get();
    const currentResults: RecentResult[] =
      snap.data()?.metadata?.recentResults ?? [];

    if (direction === 1) {
      const team = findPlayerTeam(tournament, player.id);
      const teamResult = team ?
        (teamRanking.get(team.id) ?? { rank: 0, inFinals: false }) :
        { rank: 0, inFinals: false };
      const dominancePct = totalFaced > 0 ? (totalBeaten / totalFaced) * 100 : 0;

      const newResult: RecentResult = {
        tournamentId,
        tournamentName: tournament.name ?? "",
        teamName: team?.name ?? "",
        teamRank: teamResult.rank,
        teamInFinals: teamResult.inFinals,
        isOfficial: tournament.isOfficial ?? false,
        playedAt: tournament.playedAt ?? new Date().toISOString(),
        racesPlayed: raceCount,
        raceWins,
        avgPoints: raceCount > 0 ? totalPoints / raceCount : 0,
        avgPlacement: raceCount > 0 ? totalPlacementSum / raceCount : 0,
        dominancePct,
        ...(player.uma ? { umaPlayed: player.uma } : {}),
        ...(tournament.seasonId ? { seasonId: tournament.seasonId } : {}),
      };

      const withoutThis = currentResults.filter((r) => r.tournamentId !== tournamentId);
      update["metadata.recentResults"] = [newResult, ...withoutThis]
        .sort((a, b) => (b.playedAt ?? "").localeCompare(a.playedAt ?? ""))
        .slice(0, 5);
    } else {
      update["metadata.recentResults"] = currentResults.filter(
        (r) => r.tournamentId !== tournamentId
      );
    }

    await playerRef.update(update);
  });

  await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// syncTournamentMetadata
//
// Triggered on any tournament document update. Handles two transitions:
//
// Completion  (status → "completed"):
//   Atomically claims the sync right via a transaction that flips
//   metadataSynced false → true. Only the winner of that transaction
//   proceeds to update player stats.
//
// Reopen  (status "completed" → anything else):
//   Atomically claims the unsync right via a transaction that flips
//   metadataSynced true → false.
// ---------------------------------------------------------------------------
export const syncTournamentMetadata = onDocumentUpdated(
  "artifacts/{appId}/public/data/tournaments/{tournamentId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const { appId, tournamentId } = event.params;
    const tournamentRef = event.data!.after.ref;

    if (before.status === after.status) return;
    if (!after.isOfficial) return;

    // ---- SYNC on completion ------------------------------------------------
    if (after.status === "completed" && before.status !== "completed") {
      const claimed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(tournamentRef);
        if (snap.data()?.metadataSynced) return false;
        tx.update(tournamentRef, { metadataSynced: true });
        return true;
      });

      if (!claimed) {
        logger.info("Sync already claimed, skipping.", { tournamentId });
        return;
      }

      logger.info("Syncing player metadata.", { tournamentId });
      await updatePlayers(appId, tournamentId, after, 1);
      return;
    }

    // ---- UNSYNC on reopen --------------------------------------------------
    if (before.status === "completed" && after.status !== "completed") {
      const claimed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(tournamentRef);
        const data = snap.data();
        if (!data?.metadataSynced) return false;
        if (data?.status === "completed") return false;
        tx.update(tournamentRef, { metadataSynced: false });
        return true;
      });

      if (!claimed) {
        logger.info("Unsync already claimed or not needed, skipping.", { tournamentId });
        return;
      }

      logger.info("Unsyncing player metadata.", { tournamentId });
      await updatePlayers(appId, tournamentId, after, -1);
    }
  }
);

// ---------------------------------------------------------------------------
// unsyncOnTournamentDelete
//
// Triggered when a tournament document is deleted.
// If the tournament was official and had been synced, reverses player stats.
// ---------------------------------------------------------------------------
export const unsyncOnTournamentDelete = onDocumentDeleted(
  "artifacts/{appId}/public/data/tournaments/{tournamentId}",
  async (event) => {
    const tournament = event.data?.data();
    if (!tournament) return;
    if (!tournament.isOfficial) return;
    if (!tournament.metadataSynced) return;

    const { appId, tournamentId } = event.params;
    logger.info("Synced tournament deleted, reversing player metadata.", { tournamentId });
    await updatePlayers(appId, tournamentId, tournament, -1);
  }
);
