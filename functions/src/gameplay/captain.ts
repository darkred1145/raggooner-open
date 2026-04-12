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

// ---------------------------------------------------------------------------
// captainProposeBan
//
// Callable: captain proposes a uma to ban (once per captain during ban phase).
// Validates: user is a captain, ban voting is enabled, captain hasn't voted yet.
// Transitions to player-voting phase once all captains have proposed.
// ---------------------------------------------------------------------------
export const captainProposeBan = onCall(async (request) => {
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

  const { playerId, tournament, tournamentRef } =
    await resolveCaptainTeam(request.auth.uid, appId, tournamentId);

  if (tournament.status !== "ban") {
    throw new HttpsError("failed-precondition", "Tournament is not in ban phase.");
  }
  if (!tournament.banVotingEnabled) {
    throw new HttpsError("failed-precondition", "Ban voting is not enabled for this tournament.");
  }

  const proposals = tournament.captainBanProposals ?? {};
  if (proposals[playerId]) {
    throw new HttpsError("already-exists", "You have already proposed a ban.");
  }

  // Add captain's ban proposal
  const updatedProposals = { ...proposals, [playerId]: umaId };

  // Check if all captains have proposed
  const teams = tournament.teams ?? [];
  const captainIds = teams.map((t: any) => t.captainId);
  const allCaptainsVoted = captainIds.every((cid: string) => updatedProposals[cid]);

  const updateData: any = {
    captainBanProposals: updatedProposals,
  };

  // If all captains voted, transition to player-voting phase
  if (allCaptainsVoted) {
    updateData.banPhaseStatus = "player-voting";
  }

  await tournamentRef.update(updateData);
  return { success: true, allCaptainsVoted };
});

// ---------------------------------------------------------------------------
// playerVoteOnBan
//
// Callable: player votes Yes/No on a proposed ban during player-voting phase.
// Each player can vote once per proposed ban. Ban passes if >50% vote Yes.
// ---------------------------------------------------------------------------
export const playerVoteOnBan = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const { tournamentId, appId: clientAppId, umaId, vote } = request.data as {
    tournamentId: string;
    appId: string;
    umaId: string;
    vote: boolean; // true = ban, false = skip
  };
  if (!tournamentId || !umaId || vote === undefined) {
    throw new HttpsError("invalid-argument", "tournamentId, umaId, and vote are required.");
  }
  const appId = clientAppId || "default-app";

  const { playerId, tournament, tournamentRef } =
    await resolveCaptainTeam(request.auth.uid, appId, tournamentId);

  if (tournament.status !== "ban") {
    throw new HttpsError("failed-precondition", "Tournament is not in ban phase.");
  }
  if (tournament.banPhaseStatus !== "player-voting") {
    throw new HttpsError("failed-precondition", "Not in player voting phase yet.");
  }

  const proposals = tournament.captainBanProposals ?? {};
  const proposedUmas = Object.values(proposals) as string[];
  if (!proposedUmas.includes(umaId)) {
    throw new HttpsError("not-found", "That uma was not proposed for banning.");
  }

  const votes = tournament.banVotes ?? {};
  const umaVotes = votes[umaId] ?? {};

  // Check if player already voted on this uma
  if (umaVotes[playerId] !== undefined) {
    throw new HttpsError("already-exists", "You have already voted on this ban.");
  }

  // Add player's vote
  const updatedUmaVotes = { ...umaVotes, [playerId]: vote };
  const updatedVotes = { ...votes, [umaId]: updatedUmaVotes };

  // Calculate if ban passes (>50% yes votes)
  const playerIds = tournament.playerIds ?? [];
  const totalVoters = playerIds.length;
  const yesVotes = Object.values(updatedUmaVotes).filter((v) => v === true).length;
  const threshold = tournament.banVoteThreshold ?? 0.5;
  const banPassed = yesVotes / totalVoters > threshold;

  // Check if all players have voted on this uma
  const allVoted = playerIds.every((pid: string) => updatedUmaVotes[pid] !== undefined);

  const updateData: any = { banVotes: updatedVotes };

  // If ban passed or all voted, add to bans and check if we should resolve
  if (banPassed || allVoted) {
    if (banPassed) {
      const currentBans = tournament.bans ?? [];
      if (!currentBans.includes(umaId)) {
        updateData.bans = [...currentBans, umaId];
      }
    }

    // Check if all proposed umas have been fully voted on
    const allUmasResolved = proposedUmas.every((proposedUma: string) => {
      const v = votes[proposedUma] ?? {};
      if (proposedUma === umaId) {
        return true; // Current uma is being resolved now
      }
      return playerIds.every((pid: string) => (v[pid] !== undefined));
    });

    if (allUmasResolved) {
      updateData.banPhaseStatus = "resolved";
    }
  }

  await tournamentRef.update(updateData);
  return { success: true, banPassed, allVoted };
});
