const APP_ID = process.env.APP_ID || 'raggooner-uma-2026';

export async function getPlayerId(db, uid, discordId) {
  if (uid) {
    const snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('firebaseUid', '==', uid).limit(1).get();
    if (!snap.empty) return { playerId: snap.docs[0].id, playerData: snap.docs[0].data() };
  }
  if (discordId) {
    const snap = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('players').where('discordId', '==', discordId).limit(1).get();
    if (!snap.empty) return { playerId: snap.docs[0].id, playerData: snap.docs[0].data() };
  }
  return null;
}
