import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../db";

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
// tournament. Only allowed during registration.
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
