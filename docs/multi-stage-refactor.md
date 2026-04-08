# Multi-Stage Tournament Refactor

Refactor the tournament system from a hardcoded two-stage (groups/finals) model to a flexible N-stage model supporting formats like Quarterfinals → Semifinals → Finals.

Each stage functions identically to the current groups stage: teams are split into groups, play 5 races, and the top N per group advance to the next stage.

---

## Problem

The entire codebase assumes exactly two stages via the TypeScript union `'groups' | 'finals'`. This is hardcoded across types, scoring, flow logic, cloud functions, analytics, and UI.

Key files with hardcoded assumptions:

| File | Hardcoded Pattern |
|---|---|
| `frontend/src/types.ts:179` | `Tournament.stage: 'groups' \| 'finals'` |
| `frontend/src/types.ts:48` | `Race.stage: 'groups' \| 'finals'` |
| `frontend/src/types.ts:34` | `Team.points` / `Team.finalsPoints` (two separate fields) |
| `frontend/src/types.ts:27` | `PointAdjustment.stage: 'groups' \| 'finals'` |
| `frontend/src/utils/utils.ts:91` | `if (isFinals) finalsPoints += pts else points += pts` |
| `frontend/src/composables/analytics/usePlayerRankings.ts:200` | `race.stage === 'finals'` |
| `frontend/src/composables/analytics/useUmaStats.ts:131` | `race.stage === 'finals'` |
| `frontend/src/composables/analytics/useDiagrams.ts:125` | `race.stage === 'finals'` |
| `frontend/src/composables/useHallOfFame.ts:178` | `r.stage === 'groups'` / `r.stage === 'finals'` |
| `frontend/src/composables/useTournamentFlow.ts:66` | `isSmallTournament ? 'finals' : 'groups'` |
| `frontend/src/composables/useGameLogic.ts:119` | `canAdvanceToFinals`, `advancingTeamIds` |
| `frontend/src/components/playFormats/GroupsFinalsPhase.vue:12` | `ref<'groups' \| 'finals'>` |
| `functions/src/gameplay/races.ts:80` | `if (stage === 'groups')` / `if (stage === 'finals')` |

---

## Target Data Model

### New Types

```typescript
interface StageConfig {
    name: string;           // e.g. 'quarterfinals', 'semifinals', 'finals'
    label: string;          // display name shown in UI
    groups: string[];       // e.g. ['A', 'B', 'C', 'D']
    racesRequired: number;  // races needed before advancement (typically 5)
    teamsAdvancingPerGroup: number; // qualifiers per group
}

interface Tournament {
    // ...existing fields...
    stages: StageConfig[];       // ordered list, first = earliest stage
    currentStageIndex: number;   // replaces stage: string

    // REMOVE: stage: 'groups' | 'finals';
}

interface Race {
    // ...existing fields...
    stage: string;  // now matches StageConfig.name — open string

    // REMOVE: stage: 'groups' | 'finals';
}

interface Team {
    // ...existing fields...
    stagePoints: Record<string, number>;  // e.g. { quarterfinals: 42, semifinals: 18 }
    stageGroups: Record<string, string>;  // group assignment per stage, e.g. { quarterfinals: 'A', semifinals: 'B' }
    qualifiedStages: string[];            // stages this team has qualified into

    // REMOVE: points: number;
    // REMOVE: finalsPoints: number;
    // REMOVE: group: 'A' | 'B' | 'C';
    // REMOVE: inFinals?: boolean;
}

interface PointAdjustment {
    // ...existing fields...
    stage: string;  // open string instead of union

    // REMOVE: stage: 'groups' | 'finals';
}

interface Wildcard {
    // ...existing fields...
    stage: string;  // open string
    group: string;  // open string

    // REMOVE: group: 'A' | 'B' | 'C' | 'Finals';
}
```

### Preset Configs

Define preset `stages` arrays for common formats so the UI doesn't need to build them from scratch:

```typescript
// Current 2-stage format (groups + finals) — backward-compat preset
const GROUPS_FINALS_PRESET: StageConfig[] = [
    { name: 'groups', label: 'Group Stage', groups: ['A', 'B'], racesRequired: 5, teamsAdvancingPerGroup: 2 },
    { name: 'finals', label: 'Finals', groups: ['A'], racesRequired: 5, teamsAdvancingPerGroup: 0 },
];

// 3-stage bracket
const THREE_STAGE_PRESET: StageConfig[] = [
    { name: 'quarterfinals', label: 'Quarterfinals', groups: ['A', 'B', 'C', 'D'], racesRequired: 5, teamsAdvancingPerGroup: 1 },
    { name: 'semifinals',    label: 'Semifinals',    groups: ['A', 'B'],            racesRequired: 5, teamsAdvancingPerGroup: 2 },
    { name: 'finals',        label: 'Finals',        groups: ['A'],                 racesRequired: 5, teamsAdvancingPerGroup: 0 },
];
```

---

## Implementation Steps

### Step 1 — Type Refactor (`frontend/src/types.ts`)

- Replace `stage: 'groups' | 'finals'` on `Tournament`, `Race`, `PointAdjustment`, `Wildcard` with `stage: string`
- Replace `Team.points`, `Team.finalsPoints`, `Team.group`, `Team.inFinals` with `stagePoints`, `stageGroups`, `qualifiedStages`
- Add `StageConfig` interface
- Add `stages: StageConfig[]` and `currentStageIndex: number` to `Tournament`

This will produce TypeScript errors across the codebase that guide the remaining steps.

### Step 2 — Scoring (`frontend/src/utils/utils.ts`)

Rewrite `recalculateTournamentScores` (lines 91–168):

```typescript
// Before
const isFinals = race.stage === 'finals';
if (isFinals) teams[idx].finalsPoints += pts;
else          teams[idx].points += pts;

// After
const stageName = race.stage;
teams[idx].stagePoints[stageName] = (teams[idx].stagePoints[stageName] ?? 0) + pts;

// Adjustments
adj.stage → teams[idx].stagePoints[adj.stage] += adj.amount;
```

Consumers that previously read `team.points` or `team.finalsPoints` should read `team.stagePoints[stageName]` for a specific stage, or sum across all entries for an overall total.

### Step 3 — Draft / Group Assignment (`frontend/src/utils/draftUtils.ts`)

Groups are currently assigned once at draft time (lines 4–44). Under the new model:

- At draft time, assign teams to groups for `stages[0]` only, stored in `team.stageGroups[stages[0].name]`
- At each stage transition, assign qualified teams to groups for the next stage and write `team.stageGroups[stages[nextIndex].name]`

The group deck logic (shuffled assignment) stays the same; it just runs once per stage transition instead of once ever.

### Step 4 — Tournament Flow (`frontend/src/composables/useTournamentFlow.ts`)

Replace the binary `isSmallTournament ? 'finals' : 'groups'` initialization:

```typescript
// Before
const initialStage = isSmallTournament ? 'finals' : 'groups';
await secureUpdate({ status: 'active', stage: initialStage });

// After
const initialStageIndex = 0;
await secureUpdate({ status: 'active', currentStageIndex: initialStageIndex });
```

For small tournaments (no group stage), the `stages` preset should just be a single-entry array with `name: 'finals'`.

### Step 5 — Advancement Logic (`frontend/src/composables/useGameLogic.ts`)

Replace `canAdvanceToFinals` and `advancingTeamIds` with stage-generic versions:

```typescript
// Before
const canAdvanceToFinals = computed(() => {
    if (tournament.value.stage === 'finals') return false;
    // hardcoded race count checks per team count
});

// After
const canAdvanceStage = computed(() => {
    const { stages, currentStageIndex } = tournament.value;
    if (currentStageIndex >= stages.length - 1) return false; // already at last stage

    const currentStage = stages[currentStageIndex];
    return currentStage.groups.every(g => getRaceCount(g, currentStage.name) >= currentStage.racesRequired);
});
```

`advancingTeamIds` becomes `advancingTeamIdsForStage(stageIndex)`:
- Top `teamsAdvancingPerGroup` from each group in the given stage
- Same tie/wildcard logic as today, driven by `StageConfig` values instead of hardcoded team counts

Stage transition:
```typescript
// Before
await secureUpdate({ stage: 'finals', teams: updatedTeams });

// After
const nextIndex = tournament.value.currentStageIndex + 1;
// assign nextStage groups to qualified teams
await secureUpdate({ currentStageIndex: nextIndex, teams: updatedTeams });
```

### Step 6 — Cloud Functions (`functions/src/gameplay/races.ts`)

Replace hardcoded stage checks (lines 80–86):

```typescript
// Before
if (stage === 'groups' && team.group !== group) throw ...;
if (stage === 'finals' && !team.inFinals) throw ...;

// After
const currentStage = tournament.stages[tournament.currentStageIndex];
const teamGroup = team.stageGroups?.[currentStage.name];
if (teamGroup !== group) throw new HttpsError('permission-denied', 'Your team is not in that group.');

const isQualified = team.qualifiedStages.includes(currentStage.name);
if (!isQualified) throw new HttpsError('permission-denied', 'Your team did not qualify for this stage.');
```

Also update `recalculateTeams` (lines 30–46) to use `stagePoints` instead of `points`/`finalsPoints`.

### Step 7 — Analytics (`usePlayerRankings.ts`, `useUmaStats.ts`, `useDiagrams.ts`)

All three share the same pattern:

```typescript
// Before
const isFinalsRace = race.stage === 'finals' || !hasGroups;

// After — treat the last stage as the prestige/finals-equivalent stage
const lastStageName = tournament.stages[tournament.stages.length - 1].name;
const isFinalsRace = race.stage === lastStageName || !hasGroups;
```

This preserves existing analytics semantics (finals = most prestigious stage) while being format-agnostic.

### Step 8 — Hall of Fame (`frontend/src/composables/useHallOfFame.ts`)

Lines 177–184 and 1219–1223 filter by `r.stage === 'groups'` / `r.stage === 'finals'`. Replace with:

```typescript
const firstStageName = tournament.stages[0].name;
const lastStageName  = tournament.stages[tournament.stages.length - 1].name;

// Replace: r.stage === 'groups'  →  r.stage === firstStageName
// Replace: r.stage === 'finals'  →  r.stage === lastStageName
```

For tournaments with only one stage (small format), `firstStageName === lastStageName`, which is fine.

### Step 9 — UI (`GroupsFinalsPhase.vue`)

- Replace `currentView: ref<'groups' | 'finals'>` with `currentStageIndex: ref<number>`
- Derive stage name and group list from `tournament.stages[currentStageIndex]`
- Stage tabs (Groups / Finals navigation) become a loop over `tournament.stages`
- Group tabs (A / B / C) come from `tournament.stages[currentStageIndex].groups`
- `shouldShowGroup` uses `currentStage.groups.includes(group)` instead of hardcoded team-count conditions

Consider renaming the component from `GroupsFinalsPhase.vue` to something format-agnostic like `StagePhase.vue`.

### Step 10 — Data Migration

This is the highest-risk step. Existing Firestore documents use the old schema.

**Old → New field mapping:**

| Old field | New field |
|---|---|
| `tournament.stage: 'groups'` | `tournament.currentStageIndex: 0` |
| `tournament.stage: 'finals'` | `tournament.currentStageIndex: 1` (or last index) |
| `team.points` | `team.stagePoints['groups']` |
| `team.finalsPoints` | `team.stagePoints['finals']` |
| `team.group: 'A'` | `team.stageGroups['groups']: 'A'` |
| `team.inFinals: true` | `team.qualifiedStages: ['groups', 'finals']` |
| `race.stage: 'groups'` | unchanged (string value stays the same) |
| `race.stage: 'finals'` | unchanged |
| `tournament` (missing `stages`) | add `stages: GROUPS_FINALS_PRESET` |

Options:
1. **Lazy migration:** Add backward-compat read logic that detects old-format documents (missing `stages` field) and maps them at read time. Write new format on any update.
2. **Script migration:** Write a one-time Node script that reads all tournament documents and rewrites them in the new format.

Option 1 is safer if there are completed tournaments you don't want to accidentally corrupt.

---

## Rough Effort & Risk

| Step | Effort | Risk |
|---|---|---|
| 1. Type refactor | Medium | High — cascading TS errors guide other steps |
| 2. Scoring rewrite | Small | Medium |
| 3. Draft/group assignment | Small | Low |
| 4. Tournament flow init | Small | Medium |
| 5. Advancement logic | Medium | High |
| 6. Cloud functions | Small | Low |
| 7. Analytics | Small | Medium |
| 8. Hall of Fame | Small | Low |
| 9. UI | Medium | Low |
| 10. Data migration | Large | Very High |

---

## Recommended Order

Start with Step 1 (types) — the TypeScript errors will enumerate every file that needs updating. Work through Steps 2–9 until the project compiles and tests pass. Do Step 10 last, on a backup of the Firestore data.
