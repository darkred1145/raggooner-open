# CLAUDE.md — functions/

Firebase Cloud Functions for Raccoon Open. Written in TypeScript, deployed via the `w9jds/firebase-action` GitHub Action.

## Commands

Run these from the `functions/` directory:

- **Type-check + compile:** `npm run build` (runs `tsc`)
- **Lint:** `npm run lint` (ESLint — also runs as a predeploy hook, failures block CI)

After any change, verify with:
```
npm run lint && npm run build
```

## Runtime

- **Node.js version:** 24
- **Generation:** Gen 2 (2nd Gen) only — configured in `package.json` (`"engines": { "node": "24" }`)
- Gen 1 functions max out at Node.js 20 and will fail to deploy with Node.js 24. Always use v2 trigger imports.

## Functions

### `assignDefaultRole` (`beforeUserCreated` identity trigger — v2)
Fires as a blocking function just before a new Firebase Auth user is saved. If the user signed in via Discord (`oidc.discord.com`), writes a `userRoles/{uid}` document with `role: "player"`. Anonymous users are skipped. Errors are caught and logged without rethrowing — a Firestore write failure will not block user creation. Uses the Admin SDK so it bypasses Firestore security rules.

> **Do not use the v1 `auth.user().onCreate()` trigger.** Gen 1 Cloud Functions do not support Node.js 24, which is the project's configured runtime. Always use v2 triggers.

### `syncTournamentMetadata` (Firestore `onDocumentUpdated` trigger — v2)
Fires on any tournament document update. Handles two transitions:
- **Completion** (`status → "completed"`): atomically claims sync via a `metadataSynced` flag transaction, then increments player stats (totalTournaments, totalRaces, opponentsFaced, opponentsBeaten, per-season counters).
- **Reopen** (`status "completed" → anything else`): atomically flips `metadataSynced` back to false, then decrements the same stats.

**Only syncs official tournaments** — exits early if `after.isOfficial !== true`.

## Lint Rules to Watch For

The ESLint config (`eslint-config-google`) enforces:
- **Arrow function parentheses:** always required — `(p) => ...` not `p => ...`
- Standard TypeScript rules from `@typescript-eslint`

These are easy to miss and will fail the CI predeploy hook.

## Adding New Functions

- v1 triggers (Auth, Pub/Sub): `import { auth } from "firebase-functions/v1";`
- v2 triggers (Firestore, HTTPS): `import { onDocumentUpdated } from "firebase-functions/v2/firestore";`
- Both can coexist in `src/index.ts`
- `setGlobalOptions({ maxInstances: 10 })` applies to v2 functions only
