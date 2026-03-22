#!/usr/bin/env node

/**
 * Sets isOfficial = true on all tournaments that don't already have the flag set.
 * All tournaments created before the official/unofficial feature are considered official.
 *
 * Usage:
 *   node scripts/backfillIsOfficial.mjs              # emulator
 *   node scripts/backfillIsOfficial.mjs --live        # production
 *   node scripts/backfillIsOfficial.mjs --dry-run     # preview only
 */

import { confirmLiveMode, initDb, listAll, updateDoc, DRY_RUN } from './config.mjs';

async function main() {
  await confirmLiveMode();
  initDb();

  const tournaments = await listAll('tournaments');
  const needsFlag = tournaments.filter(t => t.isOfficial === undefined || t.isOfficial === null);

  console.log(`Found ${needsFlag.length} tournament(s) missing isOfficial flag.\n`);

  if (needsFlag.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  for (const t of needsFlag) {
    console.log(`  ${DRY_RUN ? '[DRY-RUN] ' : ''}Setting isOfficial=true on: ${t.name || t.id}`);
    if (!DRY_RUN) {
      await updateDoc('tournaments', t.id, { isOfficial: true });
    }
  }

  console.log(`\nDone. ${DRY_RUN ? '(dry-run, no writes made)' : `Updated ${needsFlag.length} tournament(s).`}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
