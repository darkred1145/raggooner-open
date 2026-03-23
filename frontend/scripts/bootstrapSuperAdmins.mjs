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
 */

import { confirmLiveMode, IS_LIVE, DRY_RUN, col } from './config.mjs';

const SUPERADMIN_UIDS = [
  'JrBubSUpmlNqYV4Gi7TsYY7yRqzO',
  '0u3zMN1xD3SrcVKIzw10UMvnmFJ2',
  '7IjG3AzSTybzW0AxfxZFwQ6ZKDB3',
  'mehTFP5BuqdrT6mw4xqnaNrHSMk1',
  'j7kIBg1mIXO5m824GeBQmXYfb6q2',
  'LCwXSR9TZUPqdpv8qM7qD3y7m0uh',
  'JXs2aov8XqTfnB9XLOVHVNzw3psv',
];

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
