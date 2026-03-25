import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../db";

// ---------------------------------------------------------------------------
// resolveCaptainTeam
//
// Shared helper: finds the team captained by the authenticated user.
// Validates: linked player exists, captainActionsEnabled, user is a captain.
// Exported for use by races.ts.
// ---------------------------------------------------------------------------
export async function resolveCaptainTeam(
  uid: string,
  appId: string,
  tournamentId: string
): Promise<{
  playerId: string;
  team: any;
  tournament: any;
  tournamentRef: FirebaseFirestore.DocumentReference;
}> {
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

// ---------------------------------------------------------------------------
// captainDraftPlayer
//
// Callable: captain picks a player during the player draft phase.
// Validates turn order and player availability, then appends to team.memberIds.
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
// Validates turn order and that the uma is not banned or already picked.
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
  const alreadyPicked = teams.some((t: any) => (t.umaPool ?? []).includes(umaId));
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
// For uma-draft format, validates the uma is in the pool and not taken.
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
