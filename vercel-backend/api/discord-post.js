/**
 * Vercel Serverless Function — Discord Posts
 *
 * Handles: postDiscordAnnouncement, postDiscordResults
 *
 * POST /api/discord-post
 * Body: { action, content/imageBase64/messages, authToken }
 *
 * Environment variables:
 *   FIREBASE_SERVICE_ACCOUNT_BASE64 — base64-encoded service account JSON
 *   APP_ID — Firebase app ID (default: raggooner-uma-2026)
 *   DISCORD_WEBHOOK_URL — Discord webhook URL for posting
 */

import admin from 'firebase-admin';

const APP_ID = process.env.APP_ID || 'raggooner-uma-2026';
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

let dbInitialized = false;

async function getDb() {
  if (!dbInitialized) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
    );
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    dbInitialized = true;
  }
  return admin.firestore();
}

async function checkAdminRole(db, uid, discordId) {
  // Find player by either uid or discordId
  let snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('firebaseUid', '==', uid).limit(1).get();
  if (snap.empty && discordId) {
    snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('discordId', '==', discordId).limit(1).get();
  }
  if (snap.empty) return false;
  const playerData = snap.docs[0].data();
  // Check role from userRoles collection using the player's firebaseUid
  const roleUid = playerData.firebaseUid || uid;
  const roleSnap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('userRoles').doc(roleUid).get();
  const role = roleSnap.exists ? roleSnap.data()?.role : null;
  return role === 'tournament_creator' || role === 'superadmin' || role === 'admin';
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleAnnouncement(db, { authToken, discordId, content, imageBase64, imageFileName }) {
  const isAuthorized = await checkAdminRole(db, authToken, discordId);
  if (!isAuthorized) throw { code: 403, message: 'Not authorized to post announcements.' };
  if (!WEBHOOK_URL) throw { code: 500, message: 'Discord webhook URL is not configured.' };
  if (!content) throw { code: 400, message: 'content is required.' };

  let response;
  if (imageBase64 && imageFileName) {
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const form = new FormData();
    form.append('payload_json', JSON.stringify({ content }));
    form.append('files[0]', new Blob([imageBuffer], { type: 'image/png' }), imageFileName);
    response = await fetch(WEBHOOK_URL, { method: 'POST', body: form });
  } else {
    response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Discord announcement failed', { status: response.status, body: errorText });
    throw { code: 500, message: 'Failed to post to Discord.' };
  }
  return { success: true };
}

async function handleResults(db, { authToken, discordId, messages }) {
  const isAuthorized = await checkAdminRole(db, authToken, discordId);
  if (!isAuthorized) throw { code: 403, message: 'Not authorized to post results.' };
  if (!WEBHOOK_URL) throw { code: 500, message: 'Discord webhook URL is not configured.' };
  if (!Array.isArray(messages) || messages.length === 0) {
    throw { code: 400, message: 'messages must be a non-empty array.' };
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < messages.length; i++) {
    if (i > 0) await sleep(1000);
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: messages[i] }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord results failed', { status: response.status, body: errorText, part: i + 1 });
      throw { code: 500, message: `Failed to post part ${i + 1} to Discord.` };
    }
  }
  return { success: true, partsPosted: messages.length };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { action, authToken, discordId, ...rest } = req.body;
  if (!authToken && !discordId) { res.status(401).json({ error: 'Not authenticated' }); return; }
  if (!action) { res.status(400).json({ error: 'action is required' }); return; }

  try {
    const db = await getDb();
    const handlers = {
      announcement: () => handleAnnouncement(db, { authToken, discordId, ...rest }),
      results: () => handleResults(db, { authToken, discordId, ...rest }),
    };

    const fn = handlers[action];
    if (!fn) { res.status(400).json({ error: `Unknown action: ${action}` }); return; }

    const result = await fn();
    res.json(result);
  } catch (err) {
    const code = err.code || 500;
    const message = err.message || 'Internal server error';
    if (code >= 500) console.error('Discord post error:', err);
    res.status(code).json({ error: message });
  }
}
