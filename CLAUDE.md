# CLAUDE.md — Project Root

This is the monorepo for **Raccoon Open**, a tournament management web app for the game Umamusume Pretty Derby.

## Repository Structure

| Directory | What it is |
|---|---|
| `frontend/` | Vue 3 + TypeScript SPA — the main app |
| `functions/` | Firebase Cloud Functions (TypeScript) |
| `tools/` | Standalone Python scripts for game data extraction (shelved) |

> Each subdirectory has its own `CLAUDE.md` with specific commands, conventions, and gotchas. They are loaded automatically — do not duplicate their content here.

## How the Pieces Fit Together

- The **frontend** is the entire user-facing product: tournament creation, player drafts, race scoring, analytics, and user management.
- **Cloud Functions** run two server-side jobs: syncing player metadata when a tournament completes, and auto-assigning a `player` role when a new Discord user signs up.
- The **tools** directory contains Frida-based memory scanning scripts for reading game state from the Windows client. This work is currently shelved.

## Firebase Project

- Project ID: `raggooneropen`
- Firestore, Firebase Auth (Discord OIDC via `oidc.discord.com`), Cloud Functions, Cloud Storage
- All Firestore data lives under `artifacts/default-app/public/data/{collection}/{docId}`

## Deployment

CI/CD runs via GitHub Actions on push to `main`:
1. Frontend is built and deployed to Firebase Hosting
2. Cloud Functions are linted, built, and deployed

Always verify both before pushing:
```
cd frontend && npm test && npm run build
cd ../functions && npm run lint && npm run build
```
