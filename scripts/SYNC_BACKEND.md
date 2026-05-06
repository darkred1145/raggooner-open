# Backend Synchronization Scripts

Synchronizes your Raggooner Open fork with the upstream Raggooner backend API.

## Overview

These scripts enable manual database synchronization using the official Raggooner API. Operations are deliberately minimized and only triggered upon visual confirmation of state changes (e.g., tournament creation, start, or completion).

**Fetching Strategy:**
- `getAllTournaments` → Detect new tournament entries
- `getTournamentById` → Check for status updates
- `getCoreData` → Final sync after tournament completion (pulls tournaments, players, seasons in one request)

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
# Sync with upstream (applies changes)
npm run sync-backend

# Test without applying changes (dry-run mode)
npm run sync-backend-dry

# Custom token
npm run sync-backend -- --token <your-token>
```

### Node.js Version

```bash
# Sync with upstream
npm run sync-backend-js

# Custom token
npm run sync-backend-js -- --token <your-token> --dry-run
```

## What the Script Does

### Detection Phase
1. **Fetches all tournaments** from upstream
2. **Identifies new tournaments** (not in local `.sync-state.json`)
3. **Detects status updates** (status changes on existing tournaments)

### Sync Phase (TypeScript only)
1. **New tournaments** → Merged into local Firestore (preserves local modifications)
2. **Status updates** → Updates tournament status
3. **Completed tournaments** → Triggers `getCoreData` to sync:
   - Updated player statistics
   - Bracket data
   - Season information

### State Tracking
- Sync state saved to `.sync-state.json` (local folder)
- Tracks tournament IDs, statuses, and last sync timestamp
- Enables incremental synchronization

## API Quota

Each endpoint has a read cost:

| Endpoint | Cost | Notes |
|----------|------|-------|
| `getAllTournaments` | 2 + ceil(N/1000) + N | Token verification + count + docs |
| `getTournamentById` | 3 | Token + usage + doc |
| `getCoreData` | 2 + ceil(T/1000) + ceil(P/1000) + ceil(S/1000) + T + P + S | All three collections |

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
2. Run sync-backend
3. Local Firestore status updated
```

### Tournament Completion
```
1. Upstream tournament reaches "completed" status
2. Run sync-backend
3. Script automatically calls getCoreData
4. All player stats, brackets, and seasons synced
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

```javascript
// Existing local data is merged with upstream data
const merged = {
  ...upstreamTournament,      // Upstream data
  ...localData,               // Local data takes precedence
  syncedAt: new Date()        // Track sync timestamp
};
```

This ensures custom fields or local modifications aren't overwritten.

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
