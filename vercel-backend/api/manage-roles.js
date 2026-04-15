/**
 * Vercel Serverless Function — Role Management
 *
 * POST /api/manage-roles
 * Body: { action, appId, targetUid, role, displayName, authToken, discordId }
 */

import admin from 'firebase-admin';

const APP_ID = process.env.APP_ID || 'raggooner-uma-2026';

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

async function getCallerRole(db, uid, discordId) {
  // If the discordId matches the OWNER_DISCORD_ID env var, grant superadmin automatically
  if (discordId && process.env.OWNER_DISCORD_ID && discordId === process.env.OWNER_DISCORD_ID) {
    return 'superadmin';
  }

  let snap;
  if (uid) {
    snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('firebaseUid', '==', uid).limit(1).get();
  }
  if ((!snap || snap.empty) && discordId) {
    snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('discordId', '==', discordId).limit(1).get();
  }

  let roleUid = uid;
  if (snap && !snap.empty) {
    const playerData = snap.docs[0].data();
    roleUid = playerData.firebaseUid || uid;
  }

  if (!roleUid) return 'player';

  const roleSnap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('userRoles').doc(roleUid).get();
  return roleSnap.exists ? roleSnap.data().role : 'player';
}

export default async function handler(req, res) {
  // Enable CORS locally for preflight just in case
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { action, appId, targetUid, role, displayName, authToken, discordId } = req.body;
  if (!authToken && !discordId) { res.status(401).json({ error: 'Not authenticated' }); return; }
  if (!action) { res.status(400).json({ error: 'action is required' }); return; }

  try {
    const db = await getDb();

    if (action === 'setUserRole') {
      if (!targetUid || !role) { res.status(400).json({ error: 'targetUid and role are required' }); return; }

      const callerRole = await getCallerRole(db, authToken, discordId);

      if (callerRole !== 'superadmin' && callerRole !== 'admin') {
        res.status(403).json({ error: 'Not authorized to manage users.' }); return;
      }

      if (role === 'superadmin' && callerRole !== 'superadmin') {
        res.status(403).json({ error: 'Only superadmins can promote to superadmin.' }); return;
      }

      const targetAppId = appId || APP_ID;
      const roleRef = db.collection('artifacts').doc(targetAppId).collection('public').doc('data').collection('userRoles').doc(targetUid);
      
      await roleRef.set({
        uid: targetUid,
        role,
        displayName: displayName || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      res.json({ success: true });
      return;
    }

    res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error('Role management error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}