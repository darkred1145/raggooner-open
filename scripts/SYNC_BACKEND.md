# Backend Synchronization Scripts

Synchronizes your Raggooner Open fork with the upstream Raggooner backend API.

## Overview

These scripts enable manual database synchronization using the official Raggooner API. Operations are deliberately minimized and only triggered upon visual confirmation of state changes (e.g., tournament creation, start, or completion).

**Fetching Strategy:**
- `getAllTournaments` → Detect new tournament entries (DISCOVER MODE only)
- `getTournamentById` → Fetch tournament details and check for status updates
- `getPlayerById` → Fetch updated player stats after tournament completion

## Setup

### 1. API Token

Store your API token securely:

```bash
# Add to .env or export in your shell
export API_TOKEN="[REDACTED_API_TOKEN]"
```

Or pass inline:
```bash
npm run sync-backend -- --token [REDACTED_API_TOKEN]
```

### 2. Firebase Admin SDK

The TypeScript version requires Firebase Admin credentials. Make sure your service account key is available:

```bash
# The scripts automatically detect service account keys named:
# raggooner-uma-2026-firebase-adminsdk-*.json
```

## Usage

### TypeScript Version (Recommended)

```bash
# FAST MODE: Only check active tournaments (default, saves quota)
npm run sync-backend

# DISCOVER MODE: Deep verify ALL tournaments (active + finished)
npm run sync-backend -- --discover

# Test without applying changes (dry-run mode)
npm run sync-backend-dry

# Custom token
npm run sync-backend -- --token <your-token>

# Skip confirmation prompts
npm run sync-backend -- --force

# Combine flags
npm run sync-backend -- --discover --force
```

## What the Script Does

### Modes
- **FAST MODE** (default): Only checks tournaments with status ≠ "completed" to save API quota
- **DISCOVER MODE** (`--discover`): Deep verifies ALL tournaments including finished ones

### Detection Phase
1. **Fetches tournaments** from upstream (all or active-only based on mode)
2. **Identifies new tournaments** (not in local `.sync-state.json`)
3. **Detects status updates** (status changes on existing tournaments)

### Sync Phase
1. **New tournaments** → Merged into local Firestore (preserves local modifications)
2. **Status updates** → Updates tournament status
3. **Completed tournaments** → Fetches updated player stats via `getPlayerById` for each participant
4. **Interactive prompts** → Asks before overwriting local data that differs from upstream
5. **Ghost-write prevention** → Skips database writes when no meaningful changes detected

### State Tracking
- Sync state saved to `.sync-state.json` (scripts folder)
- Tracks tournament IDs, statuses, and last sync timestamp
- Tracks known player IDs to instantly fetch missing profiles
- Enables incremental synchronization

## API Quota

Each endpoint has a read cost:

| Endpoint | Cost | Notes |
|----------|------|-------|
| `getAllTournaments` | 2 + ceil(N/1000) + N | Token verification + count + docs |
| `getTournamentById` | 3 | Token + usage + doc |
| `getPlayerById` | 2 | Token + usage + doc |

Current quota: **Daily limit** (specific value in 429 response)

Monitor in error responses:
```json
{
  "dailyLimit": 50000,
  "currentUsage": 45230,
  "readsRequested": 1200,
  "resetsAt": "2026-04-23T00:00:00Z"
}
```

## Workflow Example

### New Tournament Detected
```
1. Run sync-backend-dry (preview changes)
2. Verify tournament details look correct
3. Run sync-backend (apply changes)
```

### Tournament Status Change
```
1. Upstream tournament moves from "draft" → "active"
2. Run sync-backend (or use --discover for finished tournaments)
3. Local Firestore status updated
```

### Tournament Completion
```
1. Upstream tournament reaches "completed" status
2. Run sync-backend (or --discover)
3. Script automatically fetches updated player stats via getPlayerById
4. All participating player stats synced to Firestore
```

## Dry-Run Mode

Always test first:

```bash
npm run sync-backend-dry
```

This shows:
- ✨ New tournaments to be added
- 🔄 Status updates to be applied
- 💾 Changes that *would* be committed

No Firestore writes occur in dry-run mode.

## Merging Strategy

When syncing tournaments, the script preserves local data:

```typescript
// Existing local data is merged with upstream data
const freshData = {
  ...(existingData || {}),  // Local data takes precedence
  ...tournamentData,         // Upstream data
  races: tournamentData.races || {},
  players: tournamentData.players || {},
  teams: tournamentData.teams || [],
};
```

The script also transforms legacy data:
- Sets `stage` to `"finals"`
- Removes `stages` field
- Maps `stagePoints.finals` → `finalsPoints`
- Maps `stageGroups.finals` → `group`
- Maps `qualifiedStages` → `inFinals`

### Interactive Overwrite Protection
If your local data (races/teams) differs from upstream, the script prompts:
```
⚠️ Oh, it looks like your local data for TOURNAMENT_NAME is different from the original site!
❓ Do you want to overwrite your local changes with the upstream data? (y/N):
```

Use `--force` to skip prompts. If data is identical, no write occurs (ghost-write prevention).

## Troubleshooting

### "Invalid or disabled API token"
- Check token format and expiration
- Verify token in your shell environment: `echo $API_TOKEN`

### "Daily quota exceeded"
- Response includes remaining quota
- Quota resets at midnight UTC
- Use dry-run to preview and plan syncs

### "No service account key found" (TypeScript)
- Download from Firebase Console → Project Settings → Service Accounts
- Name should start with `raggooner-uma-2026`
- Place in root or `scripts/` directory

### Firebase connection issues
- Verify Firestore project ID matches `raggooner-uma-2026`
- Check service account has Firestore read/write permissions

## State File

Location: `scripts/.sync-state.json`

Structure:
```json
{
  "lastSync": "2026-04-22T15:30:45.123Z",
  "tournaments": {
    "tournament-id-1": {
      "id": "tournament-id-1",
      "name": "Tournament Name",
      "status": "active",
      "format": "uma-ban",
      "isOfficial": true,
      "createdAt": "2026-04-20T10:00:00Z"
    }
  },
  "players": {},
  "seasons": {}
}
```

Delete this file to force full resync on next run.

## Advanced Usage

### Custom Interval Syncing
Create a cron job:
```bash
# Sync every 6 hours
0 */6 * * * cd /path/to/raggooner-open && npm run sync-backend >> logs/sync.log 2>&1
```

### Monitoring
Check sync history:
```bash
tail -f logs/sync.log
```

### Multiple Tokens
Rotate tokens for different environments:
```bash
API_TOKEN=token1 npm run sync-backend
API_TOKEN=token2 npm run sync-backend
```

## See Also

- [API Documentation](../API.md)
- [Firebase Firestore Schema](../docs/firestore-schema.md)
- [Migration Scripts](./README.md)
