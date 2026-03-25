import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { db } from "../db";

const discordWebhookUrl = defineSecret("DISCORD_WEBHOOK_URL");

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
