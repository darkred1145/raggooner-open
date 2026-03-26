#!/usr/bin/env node

/**
 * Writes superadmin role docs to userRoles for the initial set of superadmin UIDs.
 * Run this once after removing SUPERADMIN_UIDS from constants.ts.
 *
 * Usage:
 *   node scripts/bootstrapSuperAdmins.mjs --dry-run        # preview (emulator)
 *   node scripts/bootstrapSuperAdmins.mjs                  # write to emulator
 *   node scripts/bootstrapSuperAdmins.mjs --live --dry-run # preview against production
 *   node scripts/bootstrapSuperAdmins.mjs --live           # write to production
 *
 * Setup:
 *   Copy scripts/.env.example to scripts/.env and fill in the UIDs.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { confirmLiveMode, IS_LIVE, DRY_RUN, col } from './config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(filename) {
  const path = join(__dirname, filename);
  const lines = readFileSync(path, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv('.env');
const SUPERADMIN_UIDS = (env.SUPERADMIN_UIDS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (SUPERADMIN_UIDS.length === 0) {
  console.error('No SUPERADMIN_UIDS found. Copy scripts/.env.example to scripts/.env and fill it in.');
  process.exit(1);
}

async function main() {
  await confirmLiveMode();

  console.log(`=== Bootstrap Superadmins${IS_LIVE ? ' (LIVE)' : ''}${DRY_RUN ? ' [DRY RUN]' : ''} ===\n`);

  // Look up player names for display
  const playerSnap = await col('players').get();
  const nameByUid = {};
  for (const doc of playerSnap.docs) {
    const d = doc.data();
    if (d.firebaseUid) nameByUid[d.firebaseUid] = d.name;
  }

  for (const uid of SUPERADMIN_UIDS) {
    const displayName = nameByUid[uid] ?? '';
    console.log(`  ${uid}  ${displayName ? `(${displayName})` : '(no linked player)'}`);
    if (!DRY_RUN) {
      await col('userRoles').doc(uid).set({
        uid,
        role: 'superadmin',
        displayName,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No writes performed.');
  } else {
    console.log(`\nDone. Wrote ${SUPERADMIN_UIDS.length} superadmin role documents.`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
