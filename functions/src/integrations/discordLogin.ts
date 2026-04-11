import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";

const discordClientId = defineSecret("DISCORD_CLIENT_ID");
const discordClientSecret = defineSecret("DISCORD_CLIENT_SECRET");

const FRONTEND_URL = "http://localhost:5173";
const FRONTEND_URL_PROD = "https://raggooner-uma-2026.web.app";
const DISCORD_API = "https://discord.com/api/v10";

export const discordLogin = onRequest(
  { secrets: ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"] },
  async (req, res) => {
    const clientId = discordClientId.value();
    const clientSecret = discordClientSecret.value();

    if (!clientId || !clientSecret) {
      res.status(500).send("Discord OAuth not configured.");
      return;
    }

    const isEmulator = !!process.env.FUNCTIONS_EMULATOR;
    const callbackUrl = isEmulator
      ? "http://127.0.0.1:5001/raggooner-uma-2026/us-central1/discordLogin"
      : "https://us-central1-raggooner-uma-2026.cloudfunctions.net/discordLogin";

    const { action, code, state } = req.query;

    // Step 1: Redirect to Discord authorization
    if (action === "start") {
      const redirectUri = `${callbackUrl}?action=callback`;
      const discordAuthUrl = `${DISCORD_API}/oauth2/authorize?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=identify`;
      res.redirect(discordAuthUrl);
      return;
    }

    // Step 2: Handle Discord callback
    if (action === "callback" && code) {
      try {
        // Exchange code for access token
        const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: code as string,
            redirect_uri: `${callbackUrl}?action=callback`,
          }),
        });

        if (!tokenResponse.ok) {
          const err = await tokenResponse.text();
          res.status(400).send(`Discord token exchange failed: ${err}`);
          return;
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get Discord user info
        const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
          res.status(400).send("Failed to get Discord user info.");
          return;
        }

        const discordUser = await userResponse.json();
        const discordId = discordUser.id;
        const username = discordUser.username;
        const avatarHash = discordUser.avatar as string | null;
        const photoURL = avatarHash
          ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${avatarHash.startsWith("a_") ? "gif" : "png"}?size=128`
          : null;

        // Find or create Firebase user with this Discord ID
        let uid: string;

        const appId = "raggooner-uma-2026";
        const playersSnap = await admin
          .firestore()
          .collection("artifacts").doc(appId)
          .collection("public").doc("data")
          .collection("players")
          .where("discordId", "==", discordId)
          .limit(1)
          .get();

        if (!playersSnap.empty) {
          const playerData = playersSnap.docs[0].data();
          if (playerData.firebaseUid) {
            uid = playerData.firebaseUid;
          } else {
            uid = `discord_${discordId}`;
            await playersSnap.docs[0].ref.update({ firebaseUid: uid });
          }
        } else {
          const userRecord = await admin.auth().createUser({
            displayName: username,
            photoURL: photoURL || undefined,
          });
          uid = userRecord.uid;

          await admin.auth().setCustomUserClaims(uid, {
            discordId,
            provider: "discord",
          });
        }

        // Mint custom Firebase token
        const customToken = await admin.auth().createCustomToken(uid, {
          discordId,
          displayName: username,
          photoURL,
        });

        // Redirect to frontend
        const frontendUrl = process.env.NODE_ENV === 'production' ? FRONTEND_URL_PROD : FRONTEND_URL;
        const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(customToken)}&state=${state || ""}`;
        res.redirect(redirectUrl);
        return;

      } catch (error: any) {
        console.error("Discord OAuth error:", error);
        res.status(500).send(`Login failed: ${error.message}`);
        return;
      }
    }

    res.status(400).send("Invalid request. Use ?action=start to begin login.");
  }
);
