import { setGlobalOptions } from "firebase-functions";
import { onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");

initializeApp();
const db = getFirestore();

setGlobalOptions({ maxInstances: 10 });

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

// ---------------------------------------------------------------------------
// assignDefaultRole
//
// Triggered when a new Firebase Auth user is created.
// If the user signed in via Discord (OIDC), writes a userRoles document
// with role = "player" so they appear in the admin user management page.
// ---------------------------------------------------------------------------
export const assignDefaultRole = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) return;
  const isDiscord = user.providerData?.some((p) => p.providerId.includes("discord"));
  if (!isDiscord) return;

  const appId = "default-app";
  const roleRef = db
    .collection("artifacts").doc(appId)
    .collection("public").doc("data")
    .collection("userRoles").doc(user.uid);

  try {
    await roleRef.set({
      uid: user.uid,
      role: "player",
      displayName: user.displayName ?? "",
      updatedAt: new Date().toISOString(),
    });
    logger.info("Assigned default player role.", { uid: user.uid });
  } catch (e) {
    // Non-fatal: log but don't block user creation
    logger.error("Failed to assign default role.", { uid: user.uid, error: e });
  }
});

// ---------------------------------------------------------------------------
// syncTournamentMetadata
//
// Triggered on any tournament document update. Handles two transitions:
//
// Completion  (status → "completed"):
//   Atomically claims the sync right via a transaction that flips
//   metadataSynced false → true. Only the winner of that transaction
//   proceeds to update player stats. Any concurrent or retry invocation
//   finds metadataSynced already true and exits cleanly.
//
// Reopen  (status "completed" → anything else):
//   Atomically claims the unsync right via a transaction that flips
//   metadataSynced true → false. Importantly the transaction also checks
//   that the tournament is no longer completed, so a sync invocation that
//   races ahead and sets metadataSynced=true after the unsync transaction
//   reads it cannot cause a double-increment — the unsync claim will
//   succeed before the sync claim can, or vice-versa, never both.
// ---------------------------------------------------------------------------
export const syncTournamentMetadata = onDocumentUpdated(
  "artifacts/{appId}/public/data/tournaments/{tournamentId}",
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();
    if (!before || !after) return;

    const { appId, tournamentId } = event.params;
    const tournamentRef = event.data!.after.ref;

    if (before.status === after.status) return;

    // Skip unofficial tournaments — only official tournaments count toward metadata
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
      await updatePlayers(db, appId, tournamentId, after, 1);
      return;
    }

    // ---- UNSYNC on reopen --------------------------------------------------
    if (before.status === "completed" && after.status !== "completed") {
      const claimed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(tournamentRef);
        const data = snap.data();
        // Guard 1: nothing was ever synced — nothing to undo.
        if (!data?.metadataSynced) return false;
        // Guard 2: tournament was re-completed between the reopen write and now.
        if (data?.status === "completed") return false;
        tx.update(tournamentRef, { metadataSynced: false });
        return true;
      });

      if (!claimed) {
        logger.info("Unsync already claimed or not needed, skipping.", { tournamentId });
        return;
      }

      logger.info("Unsyncing player metadata.", { tournamentId });
      await updatePlayers(db, appId, tournamentId, after, -1);
    }
  }
);

// ---------------------------------------------------------------------------
// unsyncOnTournamentDelete
//
// Triggered when a tournament document is deleted.
// If the tournament was official and had been synced (metadataSynced=true),
// reverses the player metadata increments so stats stay accurate.
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
    await updatePlayers(db, appId, tournamentId, tournament, -1);
  }
);

// ---------------------------------------------------------------------------
// Helpers for team ranking and player-team lookup
// ---------------------------------------------------------------------------
interface TeamRankResult {
  rank: number;
  inFinals: boolean;
}

// Mirrors the priority used by compareTeams() on the client:
// finalists sorted by finalsPoints desc, non-finalists sorted by points desc.
// Tiebreaker (countback) is omitted here — it's rare and would require
// replicating the full getTeamPlacements logic in the Cloud Function.
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

// ---------------------------------------------------------------------------
// Increments (direction=1) or decrements (direction=-1) every participant's
// aggregate stats in their GlobalPlayer document, and maintains the 5-entry
// recentResults array on each player.
//
// Uses individual get+update per player (rather than a batch) so that
// recentResults can be read before writing.
// ---------------------------------------------------------------------------
async function updatePlayers(
  db: FirebaseFirestore.Firestore,
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

    // Read current recentResults to prepend or filter
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

      // Filter out any existing entry for this tournament (safe re-sync), then
      // sort by playedAt descending so the 5 most recently played are kept.
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
// Captain Action Helpers
// ---------------------------------------------------------------------------

// Resolves the team captained by the authenticated user in a tournament.
// Validates: linked player exists, captainActionsEnabled, user is a captain.
async function resolveCaptainTeam(
  uid: string,
  appId: string,
  tournamentId: string
): Promise<{ playerId: string; team: any; tournament: any; tournamentRef: FirebaseFirestore.DocumentReference }> {
  const playersSnap = await db
    .collection("artifacts").doc(appId)
    .collection("public").doc("data")
    .collection("players")
    .where("firebaseUid", "==", uid)
    .limit(1)
    .get();

  if (playersSnap.empty) {
    throw new HttpsError("not-found", "No player linked to your account.");
  }
  const playerId = playersSnap.docs[0].id;

  const tournamentRef = db
    .collection("artifacts").doc(appId)
    .collection("public").doc("data")
    .collection("tournaments").doc(tournamentId);

  const snap = await tournamentRef.get();
  if (!snap.exists) throw new HttpsError("not-found", "Tournament not found.");

  const tournament = snap.data()!;
  if (!tournament.captainActionsEnabled) {
    throw new HttpsError("failed-precondition", "Captain actions are disabled for this tournament.");
  }

  const teams = (tournament.teams ?? []) as any[];
  const team = teams.find((t: any) => t.captainId === playerId);
  if (!team) {
    throw new HttpsError("permission-denied", "You are not a captain in this tournament.");
  }

  return { playerId, team, tournament, tournamentRef };
}

// Replicates the client-side recalculateTournamentScores() for teams only.
// Points are summed from all races then adjustments are applied.
function recalculateTeams(tournament: any): any[] {
  const pointsSystem = tournament.pointsSystem || {};
  const defaultPoints: Record<number, number> = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2,
  };
  const activePoints =
    Object.keys(pointsSystem).length > 0 ? pointsSystem : defaultPoints;

  const teams = ((tournament.teams ?? []) as any[]).map((t: any) => ({
    ...t,
    points: 0,
    finalsPoints: 0,
    adjustments: t.adjustments || [],
  }));

  const findTeamIdx = (pid: string) =>
    teams.findIndex(
      (t: any) => t.captainId === pid || (t.memberIds ?? []).includes(pid)
    );

  Object.values(tournament.races ?? {}).forEach((race: any) => {
    const isFinals = race.stage === "finals";
    Object.entries(race.placements ?? {}).forEach(([pid, pos]) => {
      const pts = activePoints[Number(pos)] || 0;
      const idx = findTeamIdx(pid);
      if (idx !== -1) {
        if (isFinals) teams[idx].finalsPoints += pts;
        else teams[idx].points += pts;
      }
    });
  });

  teams.forEach((t: any) => {
    (t.adjustments || []).forEach((adj: any) => {
      if (adj.stage === "finals") t.finalsPoints += adj.amount;
      else t.points += adj.amount;
    });
  });

  return teams;
}

// ---------------------------------------------------------------------------
// captainDraftPlayer
//
// Callable: captain picks a player during the player draft phase.
// Validates turn order, player availability, then appends to team.memberIds.
// ---------------------------------------------------------------------------
export const captainDraftPlayer = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const { tournamentId, appId: clientAppId, targetPlayerId } = request.data as {
    tournamentId: string;
    appId: string;
    targetPlayerId: string;
  };
  if (!tournamentId || !targetPlayerId) {
    throw new HttpsError("invalid-argument", "tournamentId and targetPlayerId are required.");
  }
  const appId = clientAppId || "default-app";

  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(request.auth.uid, appId, tournamentId);

  if (tournament.status !== "draft") {
    throw new HttpsError("failed-precondition", "Tournament is not in draft phase.");
  }

  const { order, currentIdx } = tournament.draft ?? {};
  if (!order || currentIdx === undefined) {
    throw new HttpsError("failed-precondition", "Draft not initialized.");
  }
  if (order[currentIdx] !== team.id) {
    throw new HttpsError("permission-denied", "It is not your turn to pick.");
  }

  const player = tournament.players?.[targetPlayerId];
  if (!player) throw new HttpsError("not-found", "Player not in this tournament.");

  const teams = tournament.teams as any[];
  const alreadyPicked = teams.some(
    (t: any) =>
      t.captainId === targetPlayerId ||
      (t.memberIds ?? []).includes(targetPlayerId)
  );
  if (alreadyPicked) throw new HttpsError("already-exists", "Player already picked.");

  const updatedTeams = teams.map((t: any) =>
    t.id === team.id ?
      { ...t, memberIds: [...(t.memberIds ?? []), targetPlayerId] } :
      t
  );

  await tournamentRef.update({
    "teams": updatedTeams,
    "draft.currentIdx": currentIdx + 1,
  });

  return { success: true };
});

// ---------------------------------------------------------------------------
// captainPickUma
//
// Callable: captain picks an uma during the uma draft (pick) phase.
// Validates turn order, uma not banned or already picked.
// ---------------------------------------------------------------------------
export const captainPickUma = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const { tournamentId, appId: clientAppId, umaId } = request.data as {
    tournamentId: string;
    appId: string;
    umaId: string;
  };
  if (!tournamentId || !umaId) {
    throw new HttpsError("invalid-argument", "tournamentId and umaId are required.");
  }
  const appId = clientAppId || "default-app";

  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(request.auth.uid, appId, tournamentId);

  if (tournament.status !== "pick") {
    throw new HttpsError("failed-precondition", "Tournament is not in uma pick phase.");
  }

  const { order, currentIdx } = tournament.draft ?? {};
  if (!order || currentIdx === undefined) {
    throw new HttpsError("failed-precondition", "Uma draft not initialized.");
  }
  if (order[currentIdx] !== team.id) {
    throw new HttpsError("permission-denied", "It is not your turn to pick.");
  }

  const bans = (tournament.bans ?? []) as string[];
  if (bans.includes(umaId)) {
    throw new HttpsError("failed-precondition", "That uma is banned.");
  }

  const teams = tournament.teams as any[];
  const alreadyPicked = teams.some((t: any) =>
    (t.umaPool ?? []).includes(umaId)
  );
  if (alreadyPicked) throw new HttpsError("already-exists", "Uma already picked by another team.");

  const updatedTeams = teams.map((t: any) =>
    t.id === team.id ?
      { ...t, umaPool: [...(t.umaPool ?? []), umaId] } :
      t
  );

  await tournamentRef.update({
    "teams": updatedTeams,
    "draft.currentIdx": currentIdx + 1,
    "draftLastPickTime": new Date().toISOString(),
  });

  return { success: true };
});

// ---------------------------------------------------------------------------
// captainSubmitUma
//
// Callable: captain assigns an uma to a player on their team.
// Validates player is on captain's team; for uma-draft format validates the
// uma is in the team's pool and not already taken by a teammate.
// ---------------------------------------------------------------------------
export const captainSubmitUma = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const { tournamentId, appId: clientAppId, playerId, umaId } = request.data as {
    tournamentId: string;
    appId: string;
    playerId: string;
    umaId: string;
  };
  if (!tournamentId || !playerId) {
    throw new HttpsError("invalid-argument", "tournamentId and playerId are required.");
  }
  const appId = clientAppId || "default-app";

  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(request.auth.uid, appId, tournamentId);

  if (tournament.status !== "active") {
    throw new HttpsError("failed-precondition", "Tournament is not active.");
  }

  const teamMemberIds: string[] = [team.captainId, ...(team.memberIds ?? [])];
  if (!teamMemberIds.includes(playerId)) {
    throw new HttpsError("permission-denied", "That player is not on your team.");
  }

  if (tournament.format === "uma-draft" && umaId) {
    const umaPool: string[] = team.umaPool ?? [];
    if (!umaPool.includes(umaId)) {
      throw new HttpsError("permission-denied", "That uma is not in your team pool.");
    }
    const players = tournament.players ?? {};
    const takenByTeammate = teamMemberIds
      .filter((pid: string) => pid !== playerId)
      .some((pid: string) => players[pid]?.uma === umaId);
    if (takenByTeammate) {
      throw new HttpsError("already-exists", "Uma already assigned to a teammate.");
    }
  }

  await tournamentRef.update({ [`players.${playerId}.uma`]: umaId ?? "" });
  return { success: true };
});

// ---------------------------------------------------------------------------
// captainSaveTapResults
//
// Callable: captain submits a full set of race placements (tap-to-rank style).
// Replaces the race document and recalculates team scores.
// ---------------------------------------------------------------------------
export const captainSaveTapResults = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const { tournamentId, appId: clientAppId, group, raceNumber, placements } =
    request.data as {
      tournamentId: string;
      appId: string;
      group: string;
      raceNumber: number;
      placements: Record<string, number>;
    };
  if (!tournamentId || !group || !raceNumber || !placements) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }
  const appId = clientAppId || "default-app";

  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(request.auth.uid, appId, tournamentId);

  if (tournament.status !== "active") {
    throw new HttpsError("failed-precondition", "Tournament is not active.");
  }

  const stage = tournament.stage as string;
  if (stage === "groups" && team.group !== group) {
    throw new HttpsError("permission-denied", "Your team is not in that group.");
  }
  if (stage === "finals" && !team.inFinals) {
    throw new HttpsError("permission-denied", "Your team did not qualify for finals.");
  }

  const key = `${stage}-${group}-${raceNumber}`;
  const existingRaces = tournament.races ?? {};
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
});

// ---------------------------------------------------------------------------
// captainUpdateRacePlacement
//
// Callable: captain updates a single player's position in a race (dropdown
// style). Read-modify-write is performed server-side to stay atomic.
// ---------------------------------------------------------------------------
export const captainUpdateRacePlacement = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const {
    tournamentId,
    appId: clientAppId,
    group,
    raceNumber,
    position,
    playerId: targetPlayerId,
  } = request.data as {
    tournamentId: string;
    appId: string;
    group: string;
    raceNumber: number;
    position: number;
    playerId: string;
  };
  if (!tournamentId || !group || !raceNumber || position === undefined) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }
  const appId = clientAppId || "default-app";

  const { team, tournament, tournamentRef } =
    await resolveCaptainTeam(request.auth.uid, appId, tournamentId);

  if (tournament.status !== "active") {
    throw new HttpsError("failed-precondition", "Tournament is not active.");
  }

  const stage = tournament.stage as string;
  if (stage === "groups" && team.group !== group) {
    throw new HttpsError("permission-denied", "Your team is not in that group.");
  }
  if (stage === "finals" && !team.inFinals) {
    throw new HttpsError("permission-denied", "Your team did not qualify for finals.");
  }

  const key = `${stage}-${group}-${raceNumber}`;
  const existingRaces = tournament.races ?? {};
  const existingRace = existingRaces[key];
  const raceData = existingRace ?
    { ...existingRace } :
    {
      "id": crypto.randomUUID(),
      "stage": stage,
      "group": group,
      "raceNumber": Number(raceNumber),
      "timestamp": new Date().toISOString(),
      "placements": {},
    };

  const newPlacements: Record<string, number> = { ...(raceData.placements ?? {}) };

  // Remove player from their current slot
  if (targetPlayerId) {
    delete newPlacements[targetPlayerId];
  }
  // Evict whoever was at this position
  for (const [pid, pos] of Object.entries(newPlacements)) {
    if (pos === Number(position)) delete newPlacements[pid];
  }
  // Place the player
  if (targetPlayerId) {
    newPlacements[targetPlayerId] = Number(position);
  }

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
});

// ---------------------------------------------------------------------------
// selfSignupTournament
//
// Callable: adds the authenticated user's linked GlobalPlayer to a tournament.
// Validates: user is authenticated, player is linked, tournament allows
// self-signup, and the player is not already registered.
// ---------------------------------------------------------------------------
export const selfSignupTournament = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { tournamentId, appId: clientAppId } = request.data as {
    tournamentId: string;
    appId: string;
  };
  if (!tournamentId) {
    throw new HttpsError("invalid-argument", "tournamentId is required.");
  }
  const appId = clientAppId || "default-app";

  const uid = request.auth.uid;

  // Find the player linked to this Firebase UID
  const playersSnap = await db
    .collection("artifacts").doc(appId)
    .collection("public").doc("data")
    .collection("players")
    .where("firebaseUid", "==", uid)
    .limit(1)
    .get();

  if (playersSnap.empty) {
    throw new HttpsError("not-found", "No player linked to your account.");
  }

  const playerDoc = playersSnap.docs[0];
  const playerData = playerDoc.data();
  const playerId = playerDoc.id;

  // Load and validate the tournament
  const tournamentRef = db
    .collection("artifacts").doc(appId)
    .collection("public").doc("data")
    .collection("tournaments").doc(tournamentId);

  const tournamentSnap = await tournamentRef.get();
  if (!tournamentSnap.exists) {
    throw new HttpsError("not-found", "Tournament not found.");
  }

  const tournament = tournamentSnap.data()!;
  if (!tournament.selfSignupEnabled) {
    throw new HttpsError("failed-precondition", "Sign-ups are closed for this tournament.");
  }

  if (tournament.players?.[playerId]) {
    throw new HttpsError("already-exists", "You are already registered.");
  }

  await tournamentRef.update({
    [`players.${playerId}`]: {
      id: playerId,
      name: playerData.name ?? "",
      isCaptain: false,
      uma: "",
    },
    playerIds: FieldValue.arrayUnion(playerId),
  });

  return { success: true };
});

// ---------------------------------------------------------------------------
// selfLeaveTournament
//
// Callable: removes the authenticated user's linked GlobalPlayer from a
// tournament. Validates: user is authenticated, player is linked, and the
// tournament is in registration phase.
// ---------------------------------------------------------------------------
export const selfLeaveTournament = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { tournamentId, appId: clientAppId } = request.data as {
    tournamentId: string;
    appId: string;
  };
  if (!tournamentId) {
    throw new HttpsError("invalid-argument", "tournamentId is required.");
  }
  const appId = clientAppId || "default-app";

  const uid = request.auth.uid;

  // Find the player linked to this Firebase UID
  const playersSnap = await db
    .collection("artifacts").doc(appId)
    .collection("public").doc("data")
    .collection("players")
    .where("firebaseUid", "==", uid)
    .limit(1)
    .get();

  if (playersSnap.empty) {
    throw new HttpsError("not-found", "No player linked to your account.");
  }

  const playerId = playersSnap.docs[0].id;

  const tournamentRef = db
    .collection("artifacts").doc(appId)
    .collection("public").doc("data")
    .collection("tournaments").doc(tournamentId);

  const tournamentSnap = await tournamentRef.get();
  if (!tournamentSnap.exists) {
    throw new HttpsError("not-found", "Tournament not found.");
  }

  const tournament = tournamentSnap.data()!;
  if (tournament.status !== "registration") {
    throw new HttpsError("failed-precondition", "Can only leave during registration.");
  }

  await tournamentRef.update({
    [`players.${playerId}`]: FieldValue.delete(),
    playerIds: FieldValue.arrayRemove(playerId),
  });

  return { success: true };
});

// ---------------------------------------------------------------------------
// postDiscordAnnouncement
//
// Callable: posts the tournament announcement (text + track image) to the
// configured Discord webhook. Caller must be a superadmin or admin.
// ---------------------------------------------------------------------------
export const postDiscordAnnouncement = onCall(
  { secrets: ["DISCORD_WEBHOOK_URL"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const { appId: clientAppId, content, imageBase64, imageFileName } =
      request.data as {
        appId: string;
        content: string;
        imageBase64?: string;
        imageFileName?: string;
      };

    if (!content) {
      throw new HttpsError("invalid-argument", "content is required.");
    }

    const appId = clientAppId || "default-app";
    const uid = request.auth.uid;

    const roleSnap = await db
      .collection("artifacts").doc(appId)
      .collection("public").doc("data")
      .collection("userRoles").doc(uid)
      .get();

    const role = roleSnap.exists ? roleSnap.data()?.role : null;
    if (role !== "superadmin" && role !== "admin") {
      throw new HttpsError("permission-denied", "Only admins can post announcements.");
    }

    const webhookUrl = discordWebhookUrl.value();
    if (!webhookUrl) {
      throw new HttpsError("internal", "Discord webhook URL is not configured.");
    }

    let response: Response;
    if (imageBase64 && imageFileName) {
      const imageBuffer = Buffer.from(imageBase64, "base64");
      const blob = new Blob([imageBuffer], { "type": "image/png" });
      const form = new FormData();
      form.append("payload_json", JSON.stringify({ "content": content }));
      form.append("files[0]", blob, imageFileName);
      response = await fetch(webhookUrl, { "method": "POST", "body": form });
    } else {
      response = await fetch(webhookUrl, {
        "method": "POST",
        "headers": { "Content-Type": "application/json" },
        "body": JSON.stringify({ "content": content }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Discord webhook failed", { "status": response.status, "body": errorText });
      throw new HttpsError("internal", "Failed to post to Discord.");
    }

    return { success: true };
  }
);
