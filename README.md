# Raggooner Open

Tournament management web app for community Umamusume Pretty Derby tournaments.

Handles the full tournament lifecycle — player registration, team drafts, race scoring, analytics, and Discord-ready result exports.

> **Fork of [Raccoon Open](https://github.com/jacobfreise/raggooner-open)** — independently hosted with free-tier Discord OAuth (no Firebase Blaze plan required).
>
> 🌐 **Live Site:** https://raggooner-uma-2026.web.app/

## Features

- **Two tournament formats** — Blind Pick and Draft Pick, each with their own phase progression (registration → draft → ban → pick → active → completed)
- **Player drafts** — Snake draft order for teams, uma ban/pick phases with slot animation
- **Live race scoring** — Automatic point calculation from race placements, group stage + finals
- **Analytics** — Per-player stats, Hall of Fame categories, season breakdowns, opponent records
- **Player profiles** — Discord-linked accounts with uma rosters, support cards, and match history
- **Discord integration** — One-click export of results formatted for Discord markdown
- **Real-time sync** — Firestore `onSnapshot` keeps all clients in sync during live events
- **Free-tier Discord OAuth** — Custom Vercel serverless backend (no Firebase Blaze plan needed)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 (Composition API), TypeScript, Tailwind CSS v4, Vite |
| Backend | Vercel Serverless Functions (free tier) |
| Database | Firestore |
| Auth | Firebase Auth with custom Discord OIDC |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions (deploy on push to `main`) |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js v20+
- Firebase CLI — `npm install -g firebase-tools`

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd raggooner-open
   cd frontend && npm install
   cd ../vercel-backend && npm install
   ```

2. Create `frontend/.env` with your Firebase config:
   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=

   # Discord OAuth backend (Vercel URL)
   VITE_DISCORD_OAUTH_URL=https://your-vercel-url.vercel.app
   ```

3. Start the dev server:
   ```bash
   cd frontend && npm run dev
   ```

   The app runs at http://localhost:5173 and reads from the production Firestore database. To use local emulators instead:

   ```bash
   firebase emulators:start        # Firestore on :8080, Auth on :9099
   cd frontend && npm run dev      # App on :5173
   ```

### Commands

```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Type-check + production build
npm test          # Run all tests
npm run preview   # Preview production build
```

### Project Structure

| Directory | What it is |
|---|---|
| `frontend/` | Vue 3 + TypeScript SPA |
| `vercel-backend/` | Vercel Serverless Functions (Discord OAuth) |
| `scripts/` | Tournament data sync tools (see `scripts/SYNC_BACKEND.md`) |

The frontend loads game data at runtime from `frontend/public/data/` — no external API calls needed for race replay rendering.

## Contributing

1. Fork and clone the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Make changes and verify (`cd frontend && npm test && npm run build`)
4. Open a pull request against `main`

## License

MIT — see [LICENSE](LICENSE).
