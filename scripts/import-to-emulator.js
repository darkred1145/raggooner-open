/**
 * Import extracted data into the LOCAL Firestore emulator.
 * Run: node scripts/import-to-emulator.js
 */

const fs = require('fs');
const path = require('path');

const EMU_HOST = '127.0.0.1';
const EMU_PORT = '8080';
const TARGET_PROJECT = 'raggooner-uma-2026';
const TARGET_APP_ID = 'raggooner-uma-2026';
const BASE_PATH = `artifacts/${TARGET_APP_ID}/public/data`;

// Find the export data file
const exportFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('raggooner-export-') && f.endsWith('.json'));
if (!exportFiles.length) {
  console.log('❌ No export data found. Run extract-data.js first.');
  process.exit(1);
}
const EXPORT_PATH = path.join(__dirname, exportFiles[0]);
console.log(`📂 Using export: ${exportFiles[0]}`);

const COLLECTIONS = ['players', 'seasons', 'tournaments', 'settings'];

function packFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj || {})) {
    fields[key] = packValue(val);
  }
  return fields;
}

function packValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(v => packValue(v)) } };
  if (typeof val === 'object') return { mapValue: { fields: packFields(val) } };
  return { stringValue: String(val) };
}

async function importDoc(col, id, fields) {
  const url = `http://${EMU_HOST}:${EMU_PORT}/v1/projects/${TARGET_PROJECT}/databases/(default)/documents/${BASE_PATH}/${col}?documentId=${id}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: packFields(fields) })
  });
  if (!res.ok && res.status !== 409) {
    const err = await res.text();
    console.log(`      ❌ ${id}: ${res.status} - ${err.substring(0, 100)}`);
  }
  return res.ok || res.status === 409;
}

async function main() {
  const exportData = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));

  console.log('\n📤 Importing to emulator...');
  let total = 0;

  for (const col of COLLECTIONS) {
    const docs = exportData[col];
    if (!docs || !docs.length) continue;

    console.log(`  Importing ${col} (${docs.length} docs)...`);
    let imported = 0;
    for (const doc of docs) {
      const { id, ...fields } = doc;
      if (await importDoc(col, id, fields)) imported++;
    }
    console.log(`  ✅ ${imported}/${docs.length} ${col}`);
    total += imported;
  }

  console.log(`\n🎉 Done! ${total} documents imported to emulator.`);
}

main().catch(e => console.error('❌', e));
