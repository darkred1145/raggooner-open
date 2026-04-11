/**
 * Import extracted data into the PRODUCTION Firebase project.
 * Reads the service account key from the root directory.
 * 
 * Run: node scripts/import-to-production.js
 */

const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

// Find the service account key file
const saFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('raggooner-uma-2026') && f.endsWith('.json'));
if (!saFiles.length) {
  console.log('❌ No service account key found. Download from Firebase Console → Settings → Service Accounts.');
  process.exit(1);
}
const SA_KEY = JSON.parse(fs.readFileSync(path.join(__dirname, saFiles[0]), 'utf8'));
console.log(`📂 Using service account: ${saFiles[0]}`);

const PROJECT_ID = 'raggooner-uma-2026';
const APP_ID = 'raggooner-uma-2026';
const BASE_PATH = `artifacts/${APP_ID}/public/data`;

// Find the export data file
const exportFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('raggooner-export-') && f.endsWith('.json'));
if (!exportFiles.length) {
  console.log('❌ No export data found. Run extract-data.js first.');
  process.exit(1);
}
const EXPORT_PATH = path.join(__dirname, exportFiles[0]);
console.log(`📂 Using export: ${exportFiles[0]}`);

const COLLECTIONS = ['players', 'seasons', 'tournaments', 'settings', 'userRoles'];

async function getAccessToken() {
  const jwtClient = new GoogleAuth({
    credentials: SA_KEY,
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/datastore']
  });
  const client = await jwtClient.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('Failed to get access token');
  return token.token;
}

function packFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj || {})) {
    fields[key] = packValue(val);
  }
  return fields;
}

function packValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return { timestampValue: val };
    return { stringValue: val };
  }
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(v => packValue(v)) } };
  if (typeof val === 'object') return { mapValue: { fields: packFields(val) } };
  return { stringValue: String(val) };
}

async function importDoc(token, col, id, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${BASE_PATH}/${col}?documentId=${id}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: packFields(fields) })
  });
  if (!res.ok) {
    const err = await res.text();
    // Skip already existing documents (409)
    if (res.status === 409) return 'skip';
    console.log(`      ❌ ${id}: ${res.status} - ${err.substring(0, 100)}`);
    return 'error';
  }
  return 'ok';
}

async function main() {
  const exportData = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));

  console.log('\n🔑 Getting access token...');
  const token = await getAccessToken();
  console.log('✅ Authenticated');

  console.log('\n📤 Importing to production Firestore...');
  let totalImported = 0;
  let totalSkipped = 0;

  for (const col of COLLECTIONS) {
    const docs = exportData[col];
    if (!docs || !docs.length) continue;

    let imported = 0;
    let skipped = 0;

    console.log(`  Importing ${col} (${docs.length} docs)...`);

    for (const doc of docs) {
      const { id, ...fields } = doc;
      const result = await importDoc(token, col, id, fields);
      if (result === 'ok') imported++;
      else if (result === 'skip') skipped++;
    }

    console.log(`  ✅ ${imported} imported${skipped ? `, ${skipped} skipped (already exist)` : ''}`);
    totalImported += imported;
    totalSkipped += skipped;
  }

  console.log(`\n🎉 Done! ${totalImported} imported, ${totalSkipped} skipped.`);
}

main().catch(e => console.error('❌', e));
