/**
 * Fixes "Invalid Date" issues by re-importing data as Strings.
 * Deletes the affected collections and re-imports from the latest export file.
 * 
 * Run: node scripts/fix-dates.js
 */

const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

// Find Service Account Key
const saFiles = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.startsWith('raggooner-uma-2026') && f.endsWith('.json'));
if (!saFiles.length) {
  console.log('❌ No service account key found.');
  process.exit(1);
}
const SA_KEY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', saFiles[0]), 'utf8'));
console.log(`📂 Using service account: ${saFiles[0]}`);

// Find Export Data
const exportFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('raggooner-export-') && f.endsWith('.json'));
if (!exportFiles.length) {
  console.log('❌ No export data found. Run extract-data.js first.');
  process.exit(1);
}
const EXPORT_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, exportFiles[0]), 'utf8'));
console.log(`📂 Using export: ${exportFiles[0]}`);

const PROJECT_ID = 'raggooner-uma-2026';
const APP_ID = 'raggooner-uma-2026';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/artifacts/${APP_ID}/public/data`;

const COLLECTIONS = ['players', 'seasons', 'tournaments', 'settings'];

async function getAccessToken() {
  const client = await new GoogleAuth({ credentials: SA_KEY, scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function deleteCollection(token, col) {
  console.log(`🗑️ Deleting ${col}...`);
  let pageToken;
  let deleted = 0;
  do {
    const url = `${BASE_URL}/${col}?pageSize=500${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.documents) {
      for (const doc of data.documents) {
        await fetch(`https://firestore.googleapis.com/v1/${doc.name}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        deleted++;
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  console.log(`  ✅ Deleted ${deleted} docs`);
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
  // Force all strings (including dates) to be stored as stringValue
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(v => packValue(v)) } };
  if (typeof val === 'object') return { mapValue: { fields: packFields(val) } };
  return { stringValue: String(val) };
}

async function importDoc(token, col, id, fields) {
  const url = `${BASE_URL}/${col}?documentId=${id}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: packFields(fields) })
  });
  return res.ok;
}

async function main() {
  const token = await getAccessToken();
  console.log('🔑 Authenticated');

  // 1. Delete
  for (const col of COLLECTIONS) {
    await deleteCollection(token, col);
  }

  // 2. Import
  console.log('\n📤 Re-importing with fixed dates...');
  let total = 0;
  for (const col of COLLECTIONS) {
    const docs = EXPORT_DATA[col];
    if (!docs || !docs.length) continue;
    
    let count = 0;
    for (const doc of docs) {
      const { id, ...fields } = doc;
      if (await importDoc(token, col, id, fields)) count++;
    }
    console.log(`  ✅ Imported ${count} ${col}`);
    total += count;
  }
  console.log(`\n🎉 Done! ${total} documents fixed.`);
}

main().catch(e => console.error('❌', e));
