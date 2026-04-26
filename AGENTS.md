# AGENTS.md — Project Root

This is the monorepo for **Raccoon Open**, a tournament management web app for the game Umamusume Pretty Derby.

## Repository Structure

| Directory | What it is |
|---|---|
| `frontend/` | Vue 3 + TypeScript SPA — the main app |
| `vercel-backend/` | Vercel Serverless Functions (free tier) |
| `tools/` | Standalone Python scripts for game data extraction (shelved) |

> Each subdirectory has its own `AGENTS.md` with specific commands, conventions, and gotchas. They are loaded automatically — do not duplicate their content here.

## How the Pieces Fit Together

- The **frontend** is the entire user-facing product: tournament creation, player drafts, race scoring, analytics, and user management.
- **Vercel Serverless Functions** handle all backend operations: tournament signup/leave, captain actions, ban voting, Discord OAuth, and queue management.
- The **tools** directory contains Frida-based memory scanning scripts for reading game state from the Windows client. This work is currently shelved.

## Firebase Project

- Project ID: `raggooner-uma-2026`
- Firestore, Firebase Auth (Discord OIDC via `oidc.discord.com`), Cloud Storage
- All Firestore data lives under `artifacts/{APP_ID}/public/data/{collection}/{docId}` where `APP_ID` defaults to `raggooner-uma-2026` (configurable via `VITE_APP_ID` in `frontend/.env`)

## Git

Do not add `Co-Authored-By` trailers or any co-author lines to commit messages.

## Deployment

CI/CD runs via GitHub Actions on push to `main`:
1. Frontend is built and deployed to Firebase Hosting
2. Cloud Functions are linted, built, and deployed

Always verify both before pushing:
```
cd frontend && npm test && npm run build
cd ../functions && npm run lint && npm run build
```
