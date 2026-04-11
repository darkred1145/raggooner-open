/**
 * Extract data from the original Raggooner Open Firebase project.
 * Produces a JSON file in the scripts/ directory.
 * 
 * Run: node scripts/extract-data.js
 */

const ORIG_API_KEY = 'AIzaSyAOZOQKH7slZ2fW_jjZEvFCH0T82EMBiVg';
const ORIG_PROJECT = 'raggooneropen';
const ORIG_APP_ID = 'default-app';
const COLLECTIONS = ['players', 'seasons', 'tournaments', 'settings', 'userRoles'];
const { writeFile } = require('fs').promises;
const path = require('path');

async function getAuthToken() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${ORIG_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Referer': 'https://raggooneropen.web.app/',
        'Origin': 'https://raggooneropen.web.app',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ returnSecureToken: true })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.idToken;
}

async function fetchCollection(token, col) {
  const url = `https://firestore.googleapis.com/v1/projects/${ORIG_PROJECT}/databases/(default)/documents/artifacts/${ORIG_APP_ID}/public/data/${col}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Referer': 'https://raggooneropen.web.app/',
      'Origin': 'https://raggooneropen.web.app'
    }
  });
  if (!res.ok) {
    const err = await res.text();
    console.log(`   ❌ ${col}: ${res.status} - ${err.substring(0, 150)}`);
    return [];
  }
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map(doc => {
    const id = doc.name.split('/').pop();
    const fields = {};
    for (const [key, val] of Object.entries(doc.fields || {})) {
      fields[key] = unpackField(val);
    }
    return { id, ...fields };
  });
}

function unpackField(val) {
  const type = Object.keys(val || {})[0];
  if (!type) return val;
  if (type === 'stringValue') return val.stringValue;
  if (type === 'integerValue') return parseInt(val.integerValue);
  if (type === 'doubleValue') return val.doubleValue;
  if (type === 'booleanValue') return val.booleanValue;
  if (type === 'timestampValue') return val.timestampValue;
  if (type === 'mapValue') return unpackMap(val.mapValue);
  if (type === 'arrayValue') return unpackArray(val.arrayValue);
  if (type === 'nullValue') return null;
  if (type === 'referenceValue') return val.referenceValue;
  return val;
}

function unpackMap(m) {
  const o = {};
  for (const [k, v] of Object.entries(m.fields || {})) o[k] = unpackField(v);
  return o;
}

function unpackArray(a) {
  return (a.values || []).map(v => unpackField(v));
}

async function main() {
  console.log('📥 Extracting from original project (raggooneropen)...');
  const token = await getAuthToken();
  console.log('✅ Authenticated');

  const exportData = {};
  for (const col of COLLECTIONS) {
    console.log(`  Fetching ${col}...`);
    exportData[col] = await fetchCollection(token, col);
    console.log(`  ✅ ${exportData[col].length} documents`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(__dirname, `raggooner-export-${timestamp}.json`);
  await writeFile(filename, JSON.stringify(exportData, null, 2));
  console.log(`\n💾 Saved to: ${filename}`);

  const total = Object.values(exportData).reduce((s, a) => s + a.length, 0);
  console.log(`📊 Total: ${total} documents extracted`);
}

main().catch(e => console.error('❌', e));
