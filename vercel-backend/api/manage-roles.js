/**
 * Vercel Serverless Function — Role Management
 *
 * POST /api/manage-roles
 * Body: { action, appId, targetUid, role, displayName, authToken, discordId }
 */

import admin from 'firebase-admin';

const APP_ID = process.env.APP_ID || 'raggooner-uma-2026';
const VALID_ROLES = new Set(['player', 'tournament_creator', 'admin', 'superadmin']);

function getDataRoot(db, appId = APP_ID) {
  return db.collection('artifacts').doc(appId).collection('public').doc('data');
}

async function getDb() {
  if (!admin.apps.length) {
    const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!encodedServiceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not configured');
    }

    const serviceAccount = JSON.parse(
      Buffer.from(encodedServiceAccount, 'base64').toString('utf-8')
    );
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  return admin.firestore();
}

function getPlayersCollection(db, appId = APP_ID) {
  return getDataRoot(db, appId).collection('players');
}

function getUserRolesCollection(db, appId = APP_ID) {
  return getDataRoot(db, appId).collection('userRoles');
}

async function findPlayerByIdentity(db, uid, discordId, appId = APP_ID) {
  const players = getPlayersCollection(db, appId);

  if (uid) {
    const snap = await players.where('firebaseUid', '==', uid).limit(1).get();
    if (!snap.empty) return snap.docs[0];
  }

  if (discordId) {
    const snap = await players.where('discordId', '==', discordId).limit(1).get();
    if (!snap.empty) return snap.docs[0];
  }

  return null;
}

async function getUserRoleByUid(db, uid, appId = APP_ID) {
  if (!uid) return 'player';

  const roleSnap = await getUserRolesCollection(db, appId).doc(uid).get();
  return roleSnap.exists ? roleSnap.data().role : 'player';
}

async function getCallerRole(db, uid, discordId, appId = APP_ID) {
  // If the discordId matches the OWNER_DISCORD_ID env var, grant superadmin automatically
  if (discordId && process.env.OWNER_DISCORD_ID && discordId === process.env.OWNER_DISCORD_ID) {
    return 'superadmin';
  }

  if (uid) {
    const uidRole = await getUserRoleByUid(db, uid, appId);
    if (uidRole !== 'player') return uidRole;
  }

  let roleUid = uid;
  const playerDoc = await findPlayerByIdentity(db, uid, discordId, appId);
  if (playerDoc) {
    const playerData = playerDoc.data();
    roleUid = playerData.firebaseUid || uid;
  }

  if (!roleUid && discordId) {
    const discordRole = await getUserRoleByUid(db, discordId, appId);
    if (discordRole !== 'player') return discordRole;
  }

  return getUserRoleByUid(db, roleUid, appId);
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
    const targetAppId = appId || APP_ID;

    if (action === 'setUserRole') {
      if (!targetUid || !role) { res.status(400).json({ error: 'targetUid and role are required' }); return; }
      if (!VALID_ROLES.has(role)) {
        res.status(400).json({ error: `Invalid role: ${role}` }); return;
      }

      const callerRole = await getCallerRole(db, authToken, discordId, targetAppId);

      if (callerRole !== 'superadmin' && callerRole !== 'admin') {
        res.status(403).json({ error: 'Not authorized to manage users.' }); return;
      }

      const targetCurrentRole = await getUserRoleByUid(db, targetUid, targetAppId);
      if (callerRole !== 'superadmin') {
        if (role === 'superadmin') {
          res.status(403).json({ error: 'Only superadmins can promote to superadmin.' }); return;
        }
        if (targetCurrentRole === 'superadmin') {
          res.status(403).json({ error: 'Only superadmins can modify superadmin roles.' }); return;
        }
      }

      const roleRef = getUserRolesCollection(db, targetAppId).doc(targetUid);

      await roleRef.set({
        uid: targetUid,
        role,
        displayName: displayName || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
