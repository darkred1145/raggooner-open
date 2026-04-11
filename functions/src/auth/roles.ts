import { beforeUserCreated } from "firebase-functions/v2/identity";
import * as logger from "firebase-functions/logger";
import { defineString } from "firebase-functions/params";
import { db } from "../db";

const appId = defineString("APP_ID").value() || "default-app";

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
