#!/usr/bin/env node

/**
 * Removes the 'role' field from all documents in the 'players' collection.
 * Roles should be managed in the 'userRoles' collection, not directly on player docs.
 *
 * Usage:
 *   node scripts/removePlayerRoles.mjs --dry-run        # preview (emulator)
 *   node scripts/removePlayerRoles.mjs                  # write to emulator
 *   node scripts/removePlayerRoles.mjs --live --dry-run # preview against production
 *   node scripts/removePlayerRoles.mjs --live           # write to production
 */

import { confirmLiveMode, IS_LIVE, DRY_RUN, col } from './config.mjs';
import { FieldValue } from 'firebase-admin/firestore';

async function main() {
  await confirmLiveMode();

  console.log(`=== Removing 'role' field from players${IS_LIVE ? ' (LIVE)' : ''}${DRY_RUN ? ' [DRY RUN]' : ''} ===\n`);

  const snapshot = await col('players').get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if ('role' in data) {
      console.log(`  [${count + 1}] Found 'role' on player: ${doc.id} (${data.name || 'unnamed'})`);
      
      if (!DRY_RUN) {
        await doc.ref.update({
          role: FieldValue.delete()
        });
      }
      count++;
    }
  }

  if (count === 0) {
    console.log('No players found with a "role" field.');
  } else if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would have removed the 'role' field from ${count} documents.`);
  } else {
    console.log(`\nDone. Successfully removed the 'role' field from ${count} documents.`);
  }
}

main().catch(err => {
  console.error('Error removing player roles:', err);
  process.exit(1);
});
