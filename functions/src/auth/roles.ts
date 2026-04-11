import { beforeUserCreated } from "firebase-functions/v2/identity";
import * as logger from "firebase-functions/logger";
import { db } from "../db";

// App ID is set at deploy time via firebase functions:config:set
const APP_ID = process.env.APP_ID || "raggooner-uma-2026";

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

  const roleRef = db
    .collection("artifacts").doc(APP_ID)
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
