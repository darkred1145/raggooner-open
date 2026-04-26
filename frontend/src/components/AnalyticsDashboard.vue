<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

defineOptions({ inheritAttrs: false });
import LineChart from './analytics/LineChart.vue';
import { getUmaImagePath } from "../utils/umaData.ts";
import { TOURNAMENT_FORMATS } from "../utils/constants.ts";
import { TRACK_DICT } from "../utils/trackData.ts";

import { useAnalyticsData } from '../composables/analytics/useAnalyticsData';
import { usePlayerRankings } from '../composables/analytics/usePlayerRankings';
import { useUmaStats } from '../composables/analytics/useUmaStats';
import { useDiagrams } from '../composables/analytics/useDiagrams';
import { useDeckRankings } from '../composables/analytics/useDeckRankings';
import { TIER_CRITERIA, TOP5_CRITERIA, getWinningTeam } from '../utils/analyticsUtils';
import { getTierBg } from '../utils/supportCardRanking';
import { compareTeams, recalculateTournamentScores } from '../utils/utils';
import SiteHeader from './shared/SiteHeader.vue';
import SiteNav from './shared/SiteNav.vue';
import PlayerAvatar from './shared/PlayerAvatar.vue';
import PlayerProfileModal from './PlayerProfileModal.vue';
import type { GlobalPlayer, Tournament } from '../types';


const activeTab = ref<'overview' | 'players' | 'umas' | 'tierlist' | 'tournaments' | 'diagrams' | 'decks'>('overview');

const profileModalOpen = ref(false);
const profilePlayer = ref<GlobalPlayer | null>(null);
const openProfile = (player: GlobalPlayer) => {
    profilePlayer.value = player;
    profileModalOpen.value = true;
};
const playerSearchQuery = ref('');
const umaSearchQuery = ref('');

// 1. Data Layer
const {
  loading, players, seasons, minTournaments, tierCriterion,
  selectedSeasons, selectedFormats, selectedSurfaces, selectedDistanceTypes, selectedLocations, allTrackLocations,
  filteredTournaments, filteredParticipations, filteredRaces, overviewStats,
  loadData, forceRefreshAnalytics, toggleSeason, toggleFormat, toggleSurface, toggleDistanceType, toggleLocation
} = useAnalyticsData();

// Stage view (global)
const stageView = ref<'total' | 'groups' | 'finals'>('total');

// 2. Player Rankings Layer
const {
  playerRankings, expandedPlayerTournaments, expandedPlayerUmas, expandedPlayerRaces, topPlayers, playerTierList,
  playerSortKey, playerSortDesc, expandedPlayerId, expandedDetailTab,
  playerUmaSortKey, playerUmaSortDesc, playerTournamentSortKey, playerTournamentSortDesc,
  playerRaceSortKey, playerRaceSortDesc,
  topPlayerCriterion,
  togglePlayerSort, togglePlayerExpand, togglePlayerUmaSort, togglePlayerTournamentSort, togglePlayerRaceSort
} = usePlayerRankings(players, filteredTournaments, filteredParticipations, filteredRaces, minTournaments, tierCriterion, stageView);

// 3. Uma Stats Layer
const {
  umaStats, expandedUmaTournaments, expandedUmaPlayers, topUmas, umaTierList,
  umaSortKey, umaSortDesc, expandedUmaName, expandedUmaDetailTab,
  umaPlayerSortKey, umaPlayerSortDesc, umaTournamentSortKey, umaTournamentSortDesc,
  topUmaCriterion,
  toggleUmaSort, toggleUmaExpand, toggleUmaPlayerSort, toggleUmaTournamentSort
} = useUmaStats(players, filteredTournaments, filteredParticipations, filteredRaces, minTournaments, tierCriterion, stageView);

// 4. Diagrams Layer
const {
  MAX_DIAGRAM_PLAYERS, MAX_DIAGRAM_UMAS, diagramSelectedPlayerIds, diagramSelectedUmaNames,
  diagramMode, diagramMetric, diagramSubject, diagramColorMap, diagramUmaColorMap,
  playerTimelineData, diagramAvailableUmas, umaTimelineData,
  toggleDiagramPlayer, toggleDiagramUma
} = useDiagrams(players, filteredTournaments, filteredRaces, playerRankings, activeTab, stageView);

// 5. Deck Rankings Layer
const {
  filteredDeckRankings, deckStats, umaStatBonus,
  deckSortKey, deckSortDesc, deckSearchQuery, toggleDeckSort
} = useDeckRankings(players, filteredTournaments);

onMounted(loadData);

const tournamentSortKey = ref('date');
const tournamentSortDesc = ref(true);
const toggleTournamentSort = (key: string) => {
  if (tournamentSortKey.value === key) {
    tournamentSortDesc.value = !tournamentSortDesc.value;
  } else {
    tournamentSortKey.value = key;
    tournamentSortDesc.value = true;
  }
};

const sortedTournaments = computed(() => {
  const mod = tournamentSortDesc.value ? -1 : 1;
  return [...filteredTournaments.value].sort((a, b) => {
    let valA: string | number, valB: string | number;
    switch (tournamentSortKey.value) {
      case 'name':
        valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
      case 'winners':
        valA = (tournamentWinnerNames.value.get(a.id)?.[0] ?? '').toLowerCase();
        valB = (tournamentWinnerNames.value.get(b.id)?.[0] ?? '').toLowerCase(); break;
      case 'players':
        valA = Object.keys(a.players).length; valB = Object.keys(b.players).length; break;
      default: // 'date'
        valA = new Date(a.playedAt ?? a.createdAt).getTime(); valB = new Date(b.playedAt ?? b.createdAt).getTime();
    }
    if (valA < valB) return -1 * mod;
    if (valA > valB) return 1 * mod;
    return 0;
  });
});

const compareLeftId = ref<string | null>(null);
const compareRightId = ref<string | null>(null);

watch(filteredTournaments, (list) => {
  const ids = list.map(t => t.id);
  const isValid = (id: string | null) => !!id && ids.includes(id);

  if (!isValid(compareLeftId.value)) {
    compareLeftId.value = ids[0] ?? null;
  }

  if (!isValid(compareRightId.value) || compareRightId.value === compareLeftId.value) {
    compareRightId.value = ids.find(id => id !== compareLeftId.value) ?? null;
  }
}, { immediate: true });

const assignTournamentSlot = (slot: 'left' | 'right', id: string) => {
  const current = slot === 'left' ? compareLeftId : compareRightId;
  const other = slot === 'left' ? compareRightId : compareLeftId;

  if (other.value === id) {
    other.value = current.value !== id ? current.value : null;
  }

  current.value = id;

  if (!other.value) {
    other.value = filteredTournaments.value.find(t => t.id !== id)?.id ?? null;
  }
};

const comparisonTournamentOptions = computed(() =>
  sortedTournaments.value.map(t => ({
    id: t.id,
    label: `${t.name} (${new Date(t.playedAt ?? t.createdAt).toLocaleDateString()})`,
  }))
);

const leftTournament = computed(() =>
  filteredTournaments.value.find(t => t.id === compareLeftId.value) ?? null
);

const rightTournament = computed(() =>
  filteredTournaments.value.find(t => t.id === compareRightId.value) ?? null
);

const tournamentWinnerNames = computed(() => {
  const map = new Map<string, string[]>();
  filteredTournaments.value.filter(t => t.status === 'completed').forEach(t => {
    const winningTeam = getWinningTeam(t);
    if (!winningTeam) return;
    const names: string[] = [];
    const captain = t.players[winningTeam.captainId];
    if (captain) names.push(captain.name);
    winningTeam.memberIds.forEach(id => {
      const player = t.players[id];
      if (player) names.push(player.name);
    });
    map.set(t.id, names);
  });
  return map;
});

type TournamentComparisonTeam = {
  id: string;
  rank: number;
  name: string;
  group: string;
  rosterCount: number;
  rosterNames: string[];
  points: number;
  finalsPoints: number;
  totalPoints: number;
  inFinals: boolean;
};

type TournamentComparisonSummary = {
  id: string;
  name: string;
  dateLabel: string;
  formatLabel: string;
  trackLabel: string;
  conditionLabel: string;
  winners: string[];
  playerCount: number;
  teamCount: number;
  finalistCount: number;
  raceCount: number;
  groupRaceCount: number;
  finalsRaceCount: number;
  banCount: number;
  wildcardCount: number;
  totalPoints: number;
  averagePointsPerPlayer: number;
  topScorer: string;
  topScorerPoints: number;
  completionLabel: string;
  statusLabel: string;
  teams: TournamentComparisonTeam[];
};

const getTournamentFormatLabel = (tournament: Tournament) =>
  TOURNAMENT_FORMATS[tournament.format || 'uma-ban']?.name ?? (tournament.format || 'Unknown');

const getTournamentTrackLabel = (tournament: Tournament) => {
  const track = tournament.selectedTrack ? TRACK_DICT[tournament.selectedTrack] : null;
  return track ? `${track.location} ${track.distance}m ${track.surface}` : 'No track selected';
};

const getTournamentConditionLabel = (tournament: Tournament) => {
  if (!tournament.selectedCondition) return 'No conditions set';
  const { ground, weather, season } = tournament.selectedCondition;
  return `${ground} · ${weather} · ${season}`;
};

const getTournamentTeamName = (team: TournamentComparisonTeam) =>
  team.name || `Team ${team.rank}`;

const summarizeTournament = (tournament: Tournament): TournamentComparisonSummary => {
  const { teams: scoredTeams, players: scoredPlayers, wildcards } = recalculateTournamentScores(tournament);
  const finalizedTeams = scoredTeams.filter(team => team.inFinals);

  const orderedTeams = finalizedTeams.length > 0
    ? [
        ...finalizedTeams.sort((a, b) => compareTeams(a, b, true, tournament, true)),
        ...scoredTeams
          .filter(team => !team.inFinals)
          .sort((a, b) => compareTeams(a, b, true, tournament, false)),
      ]
    : [...scoredTeams].sort((a, b) => {
        const totalDiff = (b.points + b.finalsPoints) - (a.points + a.finalsPoints);
        if (totalDiff !== 0) return totalDiff;
        return compareTeams(a, b, true, tournament, false);
      });

  const teams = orderedTeams.map((team, index) => {
    const rosterIds = [team.captainId, ...(team.memberIds || [])];
    return {
      id: team.id,
      rank: index + 1,
      name: team.name,
      group: team.group,
      rosterCount: rosterIds.length,
      rosterNames: rosterIds.map(id => tournament.players[id]?.name).filter(Boolean) as string[],
      points: team.points || 0,
      finalsPoints: team.finalsPoints || 0,
      totalPoints: (team.points || 0) + (team.finalsPoints || 0),
      inFinals: !!team.inFinals,
    };
  });

  const playerStats = Object.values(scoredPlayers);
  const totalPoints = playerStats.reduce((sum, player) => sum + (player.totalPoints || 0), 0);
  const topScorer = [...playerStats].sort((a, b) =>
    (b.totalPoints || 0) - (a.totalPoints || 0) || a.name.localeCompare(b.name)
  )[0];
  const raceEntries = Object.values(tournament.races || {});
  const winners = tournamentWinnerNames.value.get(tournament.id) ?? [];

  return {
    id: tournament.id,
    name: tournament.name,
    dateLabel: new Date(tournament.playedAt ?? tournament.createdAt).toLocaleDateString(),
    formatLabel: getTournamentFormatLabel(tournament),
    trackLabel: getTournamentTrackLabel(tournament),
    conditionLabel: getTournamentConditionLabel(tournament),
    winners,
    playerCount: Object.keys(tournament.players || {}).length,
    teamCount: tournament.teams?.length || 0,
    finalistCount: scoredTeams.filter(team => team.inFinals).length,
    raceCount: raceEntries.length,
    groupRaceCount: raceEntries.filter(race => race.stage === 'groups').length,
    finalsRaceCount: raceEntries.filter(race => race.stage === 'finals').length,
    banCount: tournament.bans?.length || 0,
    wildcardCount: wildcards.length,
    totalPoints,
    averagePointsPerPlayer: playerStats.length > 0 ? totalPoints / playerStats.length : 0,
    topScorer: topScorer?.name || '—',
    topScorerPoints: topScorer?.totalPoints || 0,
    completionLabel: tournament.completedAt
      ? new Date(tournament.completedAt).toLocaleString()
      : (tournament.playedAt ? new Date(tournament.playedAt).toLocaleString() : '—'),
    statusLabel: tournament.status,
    teams,
  };
};

const tournamentComparisonMap = computed(() => {
  const map = new Map<string, TournamentComparisonSummary>();
  filteredTournaments.value.forEach(tournament => {
    map.set(tournament.id, summarizeTournament(tournament));
  });
  return map;
});

const leftTournamentSummary = computed(() =>
  leftTournament.value ? tournamentComparisonMap.value.get(leftTournament.value.id) ?? null : null
);

const rightTournamentSummary = computed(() =>
  rightTournament.value ? tournamentComparisonMap.value.get(rightTournament.value.id) ?? null : null
);

const tournamentCompareMetrics = computed(() => {
  const left = leftTournamentSummary.value;
  const right = rightTournamentSummary.value;
  if (!left || !right) return [];

  const deltaClass = (diff: number, higherIsBetter = true) => {
    if (diff === 0) return 'text-slate-400';
    const good = higherIsBetter ? diff > 0 : diff < 0;
    return good ? 'text-emerald-400' : 'text-rose-400';
  };

  const formatDiff = (diff: number, suffix = '') => {
    if (diff === 0) return 'Even';
    const abs = Math.abs(diff);
    const sign = diff > 0 ? '+' : '-';
    return `${sign}${Number.isInteger(abs) ? abs : abs.toFixed(1)}${suffix}`;
  };

  return [
    { key: 'players', label: 'Players', icon: 'ph-users', left: left.playerCount, right: right.playerCount, delta: left.playerCount - right.playerCount, higherIsBetter: true, suffix: '' },
    { key: 'teams', label: 'Teams', icon: 'ph-shield-check', left: left.teamCount, right: right.teamCount, delta: left.teamCount - right.teamCount, higherIsBetter: true, suffix: '' },
    { key: 'races', label: 'Races', icon: 'ph-flag-checkered', left: left.raceCount, right: right.raceCount, delta: left.raceCount - right.raceCount, higherIsBetter: true, suffix: '' },
    { key: 'points', label: 'Total Points', icon: 'ph-lightning', left: left.totalPoints, right: right.totalPoints, delta: left.totalPoints - right.totalPoints, higherIsBetter: true, suffix: ' pts' },
    { key: 'avg', label: 'Avg Points / Player', icon: 'ph-chart-bar', left: left.averagePointsPerPlayer.toFixed(1), right: right.averagePointsPerPlayer.toFixed(1), delta: Number((left.averagePointsPerPlayer - right.averagePointsPerPlayer).toFixed(1)), higherIsBetter: true, suffix: '' },
    { key: 'bans', label: 'Bans', icon: 'ph-prohibit', left: left.banCount, right: right.banCount, delta: left.banCount - right.banCount, higherIsBetter: false, suffix: '' },
  ].map(metric => ({
    ...metric,
    deltaLabel: formatDiff(metric.delta, metric.suffix),
    deltaClass: deltaClass(metric.delta, metric.higherIsBetter),
  }));
});

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? 'th'}`;
};

const getRankColor = (index: number) => {
  if (index === 0) return 'text-yellow-400';
  if (index === 1) return 'text-slate-300';
  if (index === 2) return 'text-amber-600';
  return 'text-slate-400';
};

const getRankIcon = (index: number) => {
  if (index === 0) return 'ph-fill ph-crown';
  if (index === 1) return 'ph-fill ph-medal';
  if (index === 2) return 'ph-fill ph-medal';
  return 'ph-fill ph-user-circle';
};

// ── Stage selector (global) ───────────────────────────────────────────────────
function setStage(s: 'total' | 'groups' | 'finals') {
  stageView.value = s;
}

const STAGE_KEY_MAP = {
  groups: {
    races: 'groupRaces', wins: 'groupWins', winRate: 'groupWinRate',
    totalPoints: 'groupTotalPoints', avgPoints: 'avgGroupPoints',
    dominance: 'groupDominance', avgPosition: 'groupAvgPosition',
    timesPlayed: 'groupRaces', racesPlayed: 'groupRaces',
  },
  finals: {
    races: 'finalsRaces', wins: 'finalsWins', winRate: 'finalsWinRate',
    totalPoints: 'finalsTotalPoints', avgPoints: 'avgFinalsPoints',
    dominance: 'finalsDominance', avgPosition: 'finalsAvgPosition',
    timesPlayed: 'finalsRaces', racesPlayed: 'finalsRaces',
  },
} as const;

function stageKey(col: string): string {
  if (stageView.value === 'total') return col;
  return (STAGE_KEY_MAP[stageView.value] as Record<string, string>)[col] ?? col;
}

function stageStatValue(item: any, criterion: string): number {
  return item[stageKey(criterion)] || 0;
}

// ── Performance indicators (finals vs groups comparison) ──────────────────────
type PerfLevel = 'much-better' | 'better' | 'same' | 'worse' | 'much-worse';

const PERF_STYLES: Record<PerfLevel, { icon: string; color: string; label: string }> = {
  'much-better': { icon: 'ph-fill ph-arrow-up',    color: 'text-green-400', label: 'Much better in finals' },
  'better':      { icon: 'ph-bold ph-trend-up',    color: 'text-blue-400',   label: 'Better in finals' },
  'same':        { icon: 'ph-bold ph-minus',        color: 'text-slate-500',   label: 'Similar in finals' },
  'worse':       { icon: 'ph-bold ph-trend-down',  color: 'text-amber-400',   label: 'Worse in finals' },
  'much-worse':  { icon: 'ph-fill ph-arrow-down',  color: 'text-red-400',     label: 'Much worse in finals' },
};

function perfIndicator(
  groupVal: number, finalsVal: number,
  lowerIsBetter = false,
  thresholds: [number, number, number, number] = [10, 3, -3, -10]
): (typeof PERF_STYLES[PerfLevel] & { level: PerfLevel }) | null {
  if (groupVal === 0 && finalsVal === 0) return null;
  const diff = lowerIsBetter ? groupVal - finalsVal : finalsVal - groupVal;
  let level: PerfLevel;
  if (diff >= thresholds[0])      level = 'much-better';
  else if (diff >= thresholds[1]) level = 'better';
  else if (diff > thresholds[2])  level = 'same';
  else if (diff > thresholds[3])  level = 'worse';
  else                            level = 'much-worse';
  return { ...PERF_STYLES[level], level };
}
</script>
<template>
  <div v-bind="$attrs" class="w-full flex flex-col min-h-full">

    <SiteHeader />

    <main class="flex-grow max-w-[1800px] mx-auto px-4 md:px-8 xl:px-12 py-6 w-full space-y-6">

      <SiteNav />


      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-white uppercase tracking-wider">Analytics Dashboard</h1>
          <p class="text-slate-400 mt-1">Cross-tournament statistics and insights</p>
        </div>

        <div class="flex items-center gap-3">
          <div v-if="loading" class="flex items-center gap-2 text-slate-400">
            <i class="ph ph-circle-notch animate-spin"></i>
            Loading data...
          </div>
          <button
              v-else
              @click="forceRefreshAnalytics"
              class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              title="Refresh analytics data"
          >
            <i class="ph ph-arrows-clockwise"></i>
            Refresh
          </button>
        </div>
      </div>

      <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6 flex flex-col lg:flex-row flex-wrap gap-8 lg:items-center">
        <div class="flex flex-col gap-2 flex-1 max-w-xl">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Min. Tourneys
            </label>
            <div class="flex items-center gap-2">
              <input
                  v-model.number="minTournaments"
                  type="number"
                  min="1"
                  max="20"
                  @change="minTournaments = Math.min(20, Math.max(1, minTournaments || 1))"
                  class="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-sm font-mono font-bold text-center focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <span class="text-xs text-slate-500">played</span>
            </div>
          </div>
          <input
              v-model.number="minTournaments"
              type="range"
              min="1"
              max="20"
              class="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
          <div class="flex justify-between text-[10px] text-slate-500 font-bold px-1">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div class="hidden lg:block w-px h-16 bg-slate-700"></div>
        <div class="lg:hidden w-full h-px bg-slate-700"></div>

        <div class="flex flex-col flex-1">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Filter by Season
          </label>
          <div class="flex flex-wrap gap-2">

            <button
                @click="selectedSeasons = []"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedSeasons.length === 0
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              All Time
            </button>

            <button
                v-for="season in seasons"
                :key="season.id"
                @click="toggleSeason(season.id)"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedSeasons.includes(season.id)
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              {{ season.name }}
            </button>

          </div>
        </div>

        <div class="hidden lg:block w-px h-16 bg-slate-700"></div>
        <div class="lg:hidden w-full h-px bg-slate-700"></div>

        <div class="flex flex-col flex-1 min-w-[200px]">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Filter by Format
          </label>
          <div class="flex flex-wrap gap-2">

            <button
                @click="selectedFormats = []"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedFormats.length === 0
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              All Formats
            </button>

            <button
                v-for="(format, id) in TOURNAMENT_FORMATS"
                :key="id"
                @click="toggleFormat(id as string)"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedFormats.includes(id as string)
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              {{ format.name }}
            </button>

          </div>
        </div>

        <div class="hidden lg:block w-px h-16 bg-slate-700"></div>
        <div class="lg:hidden w-full h-px bg-slate-700"></div>

        <div class="flex flex-col flex-1 min-w-[200px]">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Surface
          </label>
          <div class="flex flex-wrap gap-2">
            <button
                @click="selectedSurfaces = []"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedSurfaces.length === 0
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              All
            </button>
            <button
                v-for="s in ['Turf', 'Dirt']"
                :key="s"
                @click="toggleSurface(s)"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedSurfaces.includes(s)
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              {{ s }}
            </button>
          </div>
        </div>

        <div class="hidden lg:block w-px h-16 bg-slate-700"></div>
        <div class="lg:hidden w-full h-px bg-slate-700"></div>

        <div class="flex flex-col flex-1 min-w-[200px]">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Distance
          </label>
          <div class="flex flex-wrap gap-2">
            <button
                @click="selectedDistanceTypes = []"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedDistanceTypes.length === 0
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              All
            </button>
            <button
                v-for="d in ['Sprint', 'Mile', 'Medium', 'Long']"
                :key="d"
                @click="toggleDistanceType(d)"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedDistanceTypes.includes(d)
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              {{ d }}
            </button>
          </div>
        </div>

        <div class="hidden lg:block w-px h-16 bg-slate-700"></div>
        <div class="lg:hidden w-full h-px bg-slate-700"></div>

        <div class="flex flex-col flex-1 min-w-[200px]">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Location
          </label>
          <div class="flex flex-wrap gap-2">
            <button
                @click="selectedLocations = []"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedLocations.length === 0
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              All
            </button>
            <button
                v-for="loc in allTrackLocations"
                :key="loc"
                @click="toggleLocation(loc)"
                class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border"
                :class="selectedLocations.includes(loc)
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'">
              {{ loc }}
            </button>
          </div>
        </div>

        <div class="hidden lg:block w-px h-16 bg-slate-700"></div>
        <div class="lg:hidden w-full h-px bg-slate-700"></div>

        <div class="flex flex-col">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Tournament Stage
          </label>
          <div class="flex items-center gap-1 bg-slate-900 rounded-lg p-1">
            <button v-for="s in [{ key: 'total', label: 'Total' }, { key: 'groups', label: 'Groups' }, { key: 'finals', label: 'Finals' }]"
                    :key="s.key"
                    @click="setStage(s.key as 'total' | 'groups' | 'finals')"
                    class="px-3 py-1.5 text-xs font-bold rounded transition-colors"
                    :class="stageView === s.key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'">
              {{ s.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex justify-center gap-2 border-b border-slate-700 overflow-x-auto hide-scrollbar">
        <button
            v-for="tab in [
            { id: 'overview', label: 'Overview', icon: 'ph-chart-line' },
            { id: 'tierlist', label: 'Tier List', icon: 'ph-ranking' },
            { id: 'players', label: 'Players', icon: 'ph-users' },
            { id: 'umas', label: 'Umas', icon: 'ph-horse' },
            { id: 'tournaments', label: 'Tournaments', icon: 'ph-trophy' },
            { id: 'diagrams', label: 'Diagrams', icon: 'ph-trend-up' },
            { id: 'decks', label: 'Decks', icon: 'ph-cards' }
          ]"
            :key="tab.id"
            @click="activeTab = tab.id as any"
            class="px-4 py-3 font-bold transition-all relative whitespace-nowrap shrink-0"
            :class="activeTab === tab.id
            ? 'text-indigo-400 border-b-2 border-indigo-400'
            : 'text-slate-400 hover:text-white'"
        >
          <i :class="tab.icon" class="mr-2"></i>
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'overview'" class="space-y-6">

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div class="text-3xl font-black text-white">{{ overviewStats.totalPlayers }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider mt-1">Players</div>
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div class="text-3xl font-black text-indigo-400">{{ overviewStats.totalTournaments }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider mt-1">Tournaments</div>
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div class="text-3xl font-black text-emerald-400">{{ overviewStats.totalRaces }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider mt-1">Races</div>
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div class="text-3xl font-black text-amber-400">{{ overviewStats.totalParticipations }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider mt-1">Participations</div>
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div class="text-3xl font-black text-purple-400">{{ overviewStats.avgPlayersPerTournament }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider mt-1">Avg Players</div>
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div class="text-3xl font-black text-cyan-400">{{ overviewStats.avgRacesPerTournament }}</div>
            <div class="text-xs text-slate-400 uppercase tracking-wider mt-1">Avg Races</div>
          </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-6">

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold text-white flex items-center gap-2">
                <i class="ph-fill ph-trophy text-amber-400"></i>
                Top 5 Players
              </h3>
              <select
                  v-model="topPlayerCriterion"
                  class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option v-for="(cfg, key) in TOP5_CRITERIA" :key="key" :value="key">{{ cfg.label }}</option>
              </select>
            </div>

            <div class="space-y-3">
              <div
                  v-for="(player, idx) in topPlayers"
                  :key="player.player.id"
                  class="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700"
              >
                <div class="text-2xl" :class="getRankColor(idx)">
                  <i :class="getRankIcon(idx)"></i>
                </div>

                <PlayerAvatar :name="player.player.name" :avatar-url="player.player.avatarUrl" size="md" />

                <div class="flex-1 min-w-0">
                  <div class="font-bold text-white truncate">{{ player.player.name }}</div>
                  <div class="text-xs text-slate-400">
                    {{ player.tournaments }} tournaments • {{ player.races }} races
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-lg font-bold text-white">{{ (player as any)[stageKey(TOP5_CRITERIA[topPlayerCriterion].playerKey)] }}{{ TOP5_CRITERIA[topPlayerCriterion].suffix }}</div>
                  <div class="text-xs text-slate-400">{{ TOP5_CRITERIA[topPlayerCriterion].label.toLowerCase() }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold text-white flex items-center gap-2">
                <i class="ph-fill ph-horse text-indigo-400"></i>
                Top 5 Umas
              </h3>
              <select
                  v-model="topUmaCriterion"
                  class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option v-for="(cfg, key) in TOP5_CRITERIA" :key="key" :value="key">{{ cfg.label }}</option>
              </select>
            </div>

            <div class="space-y-3">
              <div
                  v-for="(uma, idx) in topUmas"
                  :key="uma.name"
                  class="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700"
              >
                <div class="text-2xl" :class="getRankColor(idx)">
                  {{ idx + 1 }}
                </div>

                <img :src="getUmaImagePath(uma.name)" :alt="uma.name" class="w-10 h-10 rounded-full object-cover shrink-0 bg-slate-700" />

                <div class="flex-1 min-w-0">
                  <div class="font-bold text-white truncate">{{ uma.name }}</div>
                  <div class="text-xs text-slate-400">
                    {{ uma.picks }} picks • {{ uma.timesPlayed }} races
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-lg font-bold text-emerald-400">{{ (uma as any)[stageKey(TOP5_CRITERIA[topUmaCriterion].umaKey)] }}{{ TOP5_CRITERIA[topUmaCriterion].suffix }}</div>
                  <div class="text-xs text-slate-400">{{ TOP5_CRITERIA[topUmaCriterion].label.toLowerCase() }}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div v-if="activeTab === 'players'" class="space-y-4">

        <input
            v-model="playerSearchQuery"
            type="text"
            placeholder="Search players..."
            class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        <div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-900 border-b border-slate-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-12">#</th>

                <th @click="togglePlayerSort('name')" class="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none">
                  <div class="flex items-center gap-1">
                    Player
                    <i v-if="playerSortKey === 'name'" class="ph-bold" :class="playerSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                    <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                  </div>
                </th>

                <th v-for="col in [
                  { key: 'tournaments', label: 'Tourneys' },
                  { key: 'tournamentWins', label: 'T. Wins' },
                  { key: 'tournamentWinRate', label: 'T. Win Rate' },
                  { key: 'races', label: 'Races' },
                  { key: 'wins', label: 'Race Wins' },
                  { key: 'winRate', label: 'Win Rate' },
                  { key: 'totalPoints', label: 'Total Pts' },
                  { key: 'avgPoints', label: 'Avg Pts' },
                  { key: 'dominance', label: 'Dominance' },
                  { key: 'avgPosition', label: 'Avg Pos.' },
                ]"
                    :key="col.key"
                    @click="togglePlayerSort(col.key)"
                    class="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1">
                    {{ col.label }}
                    <i v-if="playerSortKey === col.key" class="ph-bold text-indigo-400" :class="playerSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                    <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                  </div>
                </th>
              </tr>
              </thead>
              <tbody class="divide-y divide-slate-700 border-t border-slate-700">
              <template
                  v-for="(player, idx) in playerRankings.filter(p =>
                        !playerSearchQuery || p.player.name.toLowerCase().includes(playerSearchQuery.toLowerCase())
                      )"
                  :key="player.player.id"
              >
                <tr
                    @click="togglePlayerExpand(player.player.id)"
                    class="hover:bg-slate-700/50 transition-colors cursor-pointer group"
                    :class="{'bg-slate-800/80': expandedPlayerId === player.player.id}"
                >
                  <td class="px-4 py-3 text-sm" :class="getRankColor(idx)">
                    <i v-if="idx < 3" :class="getRankIcon(idx)"></i>
                    <span v-else>{{ idx + 1 }}</span>
                  </td>
                  <td class="px-4 py-3 text-sm font-bold text-white flex items-center gap-2">
                    <i class="ph-bold text-slate-500 group-hover:text-indigo-400 transition-transform duration-200"
                       :class="expandedPlayerId === player.player.id ? 'ph-caret-down text-indigo-400' : 'ph-caret-right'"></i>
                    {{ player.player.name }}
                  </td>

                  <td class="px-4 py-3 text-sm text-right text-slate-300">{{ player.tournaments }}</td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-amber-400">{{ player.tournamentWins }}</td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-amber-400">{{ player.tournamentWinRate }}%</td>

                  <td class="px-4 py-3 text-sm text-right text-slate-300">{{ (player as any)[stageKey('races')] }}</td>
                  <td class="px-4 py-3 text-sm text-right text-emerald-400">{{ (player as any)[stageKey('wins')] }}</td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-emerald-400">
                    <div class="flex items-center justify-end gap-1">
                      {{ (player as any)[stageKey('winRate')] }}%
                      <template v-for="pf in [perfIndicator(player.groupWinRate, player.finalsWinRate, false, [10, 3, -3, -10])]">
                        <i v-if="pf" :class="[pf.icon, pf.color, 'text-[10px] shrink-0']" :title="pf.label"></i>
                      </template>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-white">{{ (player as any)[stageKey('totalPoints')] }}</td>
                  <td class="px-4 py-3 text-sm text-right text-indigo-400">
                    <div class="flex items-center justify-end gap-1">
                      {{ (player as any)[stageKey('avgPoints')] }}
                      <template v-for="pf in [perfIndicator(player.avgGroupPoints, player.avgFinalsPoints, false, [3, 1, -1, -3])]">
                        <i v-if="pf" :class="[pf.icon, pf.color, 'text-[10px] shrink-0']" :title="pf.label"></i>
                      </template>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-rose-400">
                    <div class="flex items-center justify-end gap-1">
                      {{ (player as any)[stageKey('dominance')] }}%
                      <template v-for="pf in [perfIndicator(player.groupDominance, player.finalsDominance, false, [10, 3, -3, -10])]">
                        <i v-if="pf" :class="[pf.icon, pf.color, 'text-[10px] shrink-0']" :title="pf.label"></i>
                      </template>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-slate-400">
                    <div class="flex items-center justify-end gap-1">
                      {{ (player as any)[stageKey('avgPosition')] }}
                      <template v-for="pf in [perfIndicator(player.groupAvgPosition, player.finalsAvgPosition, true, [0.5, 0.2, -0.2, -0.5])]">
                        <i v-if="pf" :class="[pf.icon, pf.color, 'text-[10px] shrink-0']" :title="pf.label"></i>
                      </template>
                    </div>
                  </td>
                </tr>

                <tr v-if="expandedPlayerId === player.player.id" class="bg-slate-900/50">
                  <td colspan="11" class="p-0 border-b-2 border-indigo-500/30">
                    <div class="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in-down">

                      <div class="bg-slate-800 border border-slate-700 rounded-lg p-4">
                        <div class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                          <i class="ph-fill ph-trophy text-amber-400"></i> Best Tournament
                        </div>
                        <div v-if="player.bestTournament">
                          <div class="font-bold text-white truncate" :title="player.bestTournament.tName">
                            {{ player.bestTournament.tName }}
                          </div>
                          <div class="text-2xl font-black text-indigo-400 mt-1">
                            {{ player.bestTournament.points }} <span class="text-xs text-slate-500 font-medium">pts</span>
                          </div>
                          <router-link :to="'/t/' + player.bestTournament.tId" class="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-flex items-center gap-1">
                            View Results <i class="ph-bold ph-arrow-right"></i>
                          </router-link>
                        </div>
                        <div v-else class="text-slate-500 text-sm italic">No data yet</div>
                      </div>

                      <div class="bg-slate-800 border border-slate-700 rounded-lg p-4">
                        <div class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                          <i class="ph-fill ph-horse text-purple-400"></i> Most Picked Uma
                        </div>
                        <div v-if="player.mostPickedUmas.length > 0">
                          <div class="font-bold text-white break-words text-sm" :title="player.mostPickedUmas.map(u => u.name).join(', ')">
                            {{ player.mostPickedUmas.map(u => u.name).join(', ') }}
                          </div>
                          <div class="flex items-end gap-3 mt-1">
                            <div class="text-2xl font-black text-purple-400">
                              {{ player.mostPickedUmas[0]!.count }} <span class="text-xs text-slate-500 font-medium">picks</span>
                            </div>
                          </div>
                          <div class="text-xs text-slate-400 mt-2 break-words">
                            Avg. Placement: <span class="font-bold text-white">{{ player.mostPickedUmas.map(u => u.avgPosition).join(' / ') }}</span>
                          </div>
                        </div>
                        <div v-else class="text-slate-500 text-sm italic">No data yet</div>
                      </div>

                      <div class="bg-slate-800 border border-slate-700 rounded-lg p-4">
                        <div class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                          <i class="ph-fill ph-medal text-emerald-400"></i> Best Performing Uma
                        </div>
                        <div v-if="player.mostWinningUmas.length > 0">
                          <div class="font-bold text-white truncate text-sm" :title="player.mostWinningUmas.map(u => u.name).join(', ')">
                            {{ player.mostWinningUmas.map(u => u.name).join(', ') }}
                          </div>
                          <div class="flex items-end gap-3 mt-1">
                            <div class="text-2xl font-black text-emerald-400">
                              {{ player.mostWinningUmas[0]!.wins }} <span class="text-xs text-slate-500 font-medium">wins</span>
                            </div>
                          </div>
                          <div class="text-xs text-slate-400 mt-2 truncate">
                            Win Rate: <span class="font-bold text-white">{{ player.mostWinningUmas.map(u => u.winRate + '%').join(' / ') }}</span>
                          </div>
                        </div>
                        <div v-else class="text-slate-500 text-sm italic">No wins recorded yet</div>
                      </div>

                      <div class="bg-slate-800 border border-slate-700 rounded-lg p-4">
                        <div class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                          <i class="ph-fill ph-trend-up text-blue-400"></i> Career Averages
                        </div>
                        <div class="space-y-2 mt-2">
                          <div class="flex justify-between items-center text-sm">
                            <span class="text-slate-400">Pts / Tournament</span>
                            <span class="font-bold text-white">
                                  {{ player.tournaments > 0 ? Math.round(player.totalPoints / player.tournaments) : 0 }}
                                </span>
                          </div>
                          <div class="flex justify-between items-center text-sm">
                            <span class="text-slate-400">Opponents Beaten</span>
                            <span class="font-bold text-white">
                                  {{ player.opponentsBeaten }} <span class="text-xs text-slate-500">/ {{ player.opponentsFaced }}</span>
                                </span>
                          </div>
                        </div>
                      </div>

                      <div class="col-span-full bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                        <div class="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
                          <button
                              @click="expandedDetailTab = 'tournaments'"
                              class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5"
                              :class="expandedDetailTab === 'tournaments'
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'"
                          >
                            <i class="ph-fill ph-trophy"></i>
                            Tournaments
                            <span class="opacity-60">({{ expandedPlayerTournaments.length }})</span>
                          </button>
                          <button
                              @click="expandedDetailTab = 'umas'"
                              class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5"
                              :class="expandedDetailTab === 'umas'
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'"
                          >
                            <i class="ph-fill ph-horse"></i>
                            Umas
                            <span class="opacity-60">({{ expandedPlayerUmas.length }})</span>
                          </button>
                          <button
                              @click="expandedDetailTab = 'races'"
                              class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5"
                              :class="expandedDetailTab === 'races'
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'"
                          >
                            <i class="ph-fill ph-flag-checkered"></i>
                            Races
                            <span class="opacity-60">({{ expandedPlayerRaces.length }})</span>
                          </button>
                        </div>

                        <div v-if="expandedDetailTab === 'tournaments'" class="overflow-x-auto">
                          <table class="w-full">
                            <thead class="bg-slate-900 border-b border-slate-700">
                            <tr>
                              <th class="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-8">#</th>
                              <th @click="togglePlayerTournamentSort('tournamentName')" class="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none">
                                <div class="flex items-center gap-1">
                                  Tournament
                                  <i v-if="playerTournamentSortKey === 'tournamentName'" class="ph-bold" :class="playerTournamentSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                                  <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                                </div>
                              </th>
                              <th @click="togglePlayerTournamentSort('playedAt')" class="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                <div class="flex items-center gap-1">
                                  Date
                                  <i v-if="playerTournamentSortKey === 'playedAt'" class="ph-bold text-indigo-400" :class="playerTournamentSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                                  <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                                </div>
                              </th>
                              <th v-for="col in [
                                    { key: 'uma', label: 'Uma' },
                                    { key: 'finalsStatus', label: 'Perf.' },
                                    { key: 'races', label: 'Races' },
                                    { key: 'wins', label: 'Wins' },
                                    { key: 'winRate', label: 'Win %' },
                                    { key: 'totalPoints', label: 'Points' },
                                    { key: 'avgPoints', label: 'Avg Pts' },
                                    { key: 'dominance', label: 'Dominance' },
                                    { key: 'avgPosition', label: 'Avg Pos' },
                                  ]"
                                  :key="col.key"
                                  @click="togglePlayerTournamentSort(col.key)"
                                  class="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                              >
                                <div class="flex items-center justify-start gap-1">
                                  {{ col.label }}
                                  <i v-if="playerTournamentSortKey === col.key" class="ph-bold text-indigo-400" :class="playerTournamentSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                                  <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                                </div>
                              </th>
                              <th class="px-3 py-2 w-8"></th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-700">
                            <tr v-for="(t, tIdx) in expandedPlayerTournaments" :key="t.rowKey" class="hover:bg-slate-700/50 transition-colors">
                              <td class="px-3 py-2 text-xs text-slate-500">{{ tIdx + 1 }}</td>
                              <td class="px-3 py-2 text-sm font-bold text-white">
                                {{ t.tournamentName }}
                                <span v-if="t.status === 'active'" class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase">Live</span>
                                <template v-for="track in [t.selectedTrack ? TRACK_DICT[t.selectedTrack] : null]" :key="'pt'">
                                  <span v-if="track" class="block text-[11px] font-normal text-slate-500">{{ track.location }} {{ track.distance }}m</span>
                                </template>
                              </td>
                              <td class="px-3 py-2 text-sm text-slate-400 whitespace-nowrap">{{ t.playedAt ? new Date(t.playedAt).toLocaleDateString() : '—' }}</td>
                              <td class="px-3 py-2 text-sm text-left text-slate-300">
                                <div class="flex items-center justify-start gap-1.5">
                                  <img :src="getUmaImagePath(t.uma)" :alt="t.uma" class="w-5 h-5 rounded-full object-cover shrink-0 bg-slate-700" />
                                  {{ t.uma }}
                                </div>
                              </td>
                              <td class="px-3 py-2 text-sm text-right">
                                <div class="flex items-center justify-end gap-1 flex-wrap">
                                  <span v-if="t.isWildcard" class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold uppercase">WC {{ t.wildcardGroup }}</span>
                                  <span v-if="t.finalsStatus === 'winner'" class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase">Winner</span>
                                  <span v-else-if="t.finalsStatus === 'finals'" class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold uppercase">{{ t.teamRank ? ordinal(t.teamRank) + ' Finals' : 'Finals' }}</span>
                                  <span v-else-if="t.finalsStatus === 'eliminated'" class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold uppercase">{{ t.teamRank ? ordinal(t.teamRank) + ' Grps' : 'Out' }}</span>
                                  <span v-else-if="t.finalsStatus === 'no-groups'" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 font-bold uppercase">{{ t.teamRank ? ordinal(t.teamRank) : '-' }}</span>
                                  <span v-else-if="!t.isWildcard" class="text-slate-600">-</span>
                                </div>
                              </td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400">{{ (t as any)[stageKey('races')] }}</td>
                              <td class="px-3 py-2 text-sm text-right text-emerald-400">{{ (t as any)[stageKey('wins')] }}</td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-emerald-400">
                                <div class="flex items-center justify-end gap-1">
                                  {{ (t as any)[stageKey('winRate')] }}%
                                  <template v-for="pf in [perfIndicator(t.groupWinRate, t.finalsWinRate, false, [10, 3, -3, -10])]">
                                    <i v-if="pf" :class="[pf.icon, pf.color, 'text-[10px] shrink-0']" :title="pf.label"></i>
                                  </template>
                                </div>
                              </td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-white">{{ (t as any)[stageKey('totalPoints')] }}</td>
                              <td class="px-3 py-2 text-sm text-right text-indigo-400">
                                <div class="flex items-center justify-end gap-1">
                                  {{ (t as any)[stageKey('avgPoints')] }}
                                  <template v-for="pf in [perfIndicator(t.avgGroupPoints, t.avgFinalsPoints, false, [3, 1, -1, -3])]">
                                    <i v-if="pf" :class="[pf.icon, pf.color, 'text-[10px] shrink-0']" :title="pf.label"></i>
                                  </template>
                                </div>
                              </td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-purple-400">
                                <div class="flex items-center justify-end gap-1">
                                  {{ (t as any)[stageKey('dominance')] }}%
                                  <template v-for="pf in [perfIndicator(t.groupDominance, t.finalsDominance, false, [10, 3, -3, -10])]">
                                    <i v-if="pf" :class="[pf.icon, pf.color, 'text-[10px] shrink-0']" :title="pf.label"></i>
                                  </template>
                                </div>
                              </td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400">
                                <div class="flex items-center justify-end gap-1">
                                  {{ (t as any)[stageKey('avgPosition')] }}
                                  <template v-for="pf in [perfIndicator(t.groupAvgPosition, t.finalsAvgPosition, true, [0.5, 0.2, -0.2, -0.5])]">
                                    <i v-if="pf" :class="[pf.icon, pf.color, 'text-[10px] shrink-0']" :title="pf.label"></i>
                                  </template>
                                </div>
                              </td>
                              <td class="px-3 py-2 text-right">
                                <router-link :to="'/t/' + t.tournamentId" class="text-indigo-400 hover:text-indigo-300 transition-colors">
                                  <i class="ph-bold ph-arrow-right"></i>
                                </router-link>
                              </td>
                            </tr>
                            </tbody>
                          </table>
                          <div v-if="expandedPlayerTournaments.length === 0" class="px-4 py-6 text-center text-slate-500 text-sm">No tournament data</div>
                        </div>

                        <div v-if="expandedDetailTab === 'umas'" class="overflow-x-auto">
                          <table class="w-full">
                            <thead class="bg-slate-900 border-b border-slate-700">
                            <tr>
                              <th class="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-8">#</th>
                              <th @click="togglePlayerUmaSort('name')" class="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none">
                                <div class="flex items-center gap-1">
                                  Uma
                                  <i v-if="playerUmaSortKey === 'name'" class="ph-bold" :class="playerUmaSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                                  <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                                </div>
                              </th>
                              <th v-for="col in [
                                    { key: 'picks', label: 'Picks' },
                                    { key: 'racesPlayed', label: 'Races' },
                                    { key: 'wins', label: 'Wins' },
                                    { key: 'winRate', label: 'Win %' },
                                    { key: 'avgPoints', label: 'Avg Pts' },
                                    { key: 'dominance', label: 'Dominance' },
                                    { key: 'avgPosition', label: 'Avg Pos' },
                                  ]"
                                  :key="col.key"
                                  @click="togglePlayerUmaSort(col.key)"
                                  class="px-3 py-2 text-right text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                              >
                                <div class="flex items-center justify-end gap-1">
                                  {{ col.label }}
                                  <i v-if="playerUmaSortKey === col.key" class="ph-bold text-indigo-400" :class="playerUmaSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                                  <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                                </div>
                              </th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-700">
                            <tr v-for="(uma, uIdx) in expandedPlayerUmas" :key="uma.name" class="hover:bg-slate-700/50 transition-colors">
                              <td class="px-3 py-2 text-xs text-slate-500">{{ uIdx + 1 }}</td>
                              <td class="px-3 py-2 text-sm font-bold text-white">
                                <div class="flex items-center gap-1.5">
                                  <img :src="getUmaImagePath(uma.name)" :alt="uma.name" class="w-5 h-5 rounded-full object-cover shrink-0 bg-slate-700" />
                                  {{ uma.name }}
                                </div>
                              </td>
                              <td class="px-3 py-2 text-sm text-right text-slate-300">{{ uma.picks }}</td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400">{{ (uma as any)[stageKey('racesPlayed')] }}</td>
                              <td class="px-3 py-2 text-sm text-right text-emerald-400">{{ (uma as any)[stageKey('wins')] }}</td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-emerald-400">{{ (uma as any)[stageKey('winRate')] }}%</td>
                              <td class="px-3 py-2 text-sm text-right text-indigo-400">{{ (uma as any)[stageKey('avgPoints')] }}</td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-purple-400">{{ (uma as any)[stageKey('dominance')] }}%</td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400">{{ (uma as any)[stageKey('avgPosition')] }}</td>
                            </tr>
                            </tbody>
                          </table>
                          <div v-if="expandedPlayerUmas.length === 0" class="px-4 py-6 text-center text-slate-500 text-sm">No uma data</div>
                        </div>

                        <div v-if="expandedDetailTab === 'races'" class="overflow-x-auto">
                          <table class="w-full">
                            <thead class="bg-slate-900 border-b border-slate-700">
                            <tr>
                              <th class="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-8">#</th>
                              <th v-for="col in [
                                    { key: 'tournamentName', label: 'Tournament',  align: 'left'  },
                                    { key: 'date',           label: 'Date',        align: 'left'  },
                                    { key: 'uma',            label: 'Uma',         align: 'left'  },
                                    { key: 'stage',          label: 'Stage',       align: 'left'  },
                                    { key: 'raceNumber',     label: 'Race',        align: 'right' },
                                    { key: 'position',       label: 'Pos.',        align: 'right' },
                                    { key: 'points',         label: 'Pts',         align: 'right' },
                                    { key: 'opponents',      label: 'Players',       align: 'right' },
                                    { key: 'beaten',         label: 'Beaten',      align: 'right' },
                                  ]"
                                  :key="col.key"
                                  @click="togglePlayerRaceSort(col.key)"
                                  class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                                  :class="col.align === 'right' ? 'text-right' : 'text-left'"
                              >
                                <div class="flex items-center gap-1" :class="col.align === 'right' ? 'justify-end' : 'justify-start'">
                                  {{ col.label }}
                                  <i v-if="playerRaceSortKey === col.key" class="ph-bold text-indigo-400" :class="playerRaceSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                                  <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                                </div>
                              </th>
                              <th class="px-3 py-2 w-8"></th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-700">
                            <tr v-for="(race, rIdx) in expandedPlayerRaces" :key="race.key"
                                class="hover:bg-slate-700/50 transition-colors"
                                :class="race.position === 1 ? 'bg-amber-500/5' : ''">
                              <td class="px-3 py-2 text-xs text-slate-500">{{ rIdx + 1 }}</td>
                              <td class="px-3 py-2 text-sm font-bold text-white whitespace-nowrap">{{ race.tournamentName }}</td>
                              <td class="px-3 py-2 text-sm text-slate-400 whitespace-nowrap">{{ race.date ? new Date(race.date).toLocaleDateString() : '—' }}</td>
                              <td class="px-3 py-2 text-sm text-slate-300">
                                <div class="flex items-center gap-1.5">
                                  <img :src="getUmaImagePath(race.uma)" :alt="race.uma" class="w-5 h-5 rounded-full object-cover shrink-0 bg-slate-700" />
                                  {{ race.uma }}
                                </div>
                              </td>
                              <td class="px-3 py-2 text-sm whitespace-nowrap">
                                <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                                      :class="race.stage === 'finals'
                                        ? 'bg-amber-500/10 text-amber-400'
                                        : 'bg-slate-700/60 text-slate-400'">
                                  {{ race.stage === 'finals' ? 'Finals' : `Groups ${race.group}` }}
                                </span>
                              </td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400 font-mono">{{ race.raceNumber }}</td>
                              <td class="px-3 py-2 text-sm text-right font-bold"
                                  :class="race.position === 1 ? 'text-amber-400' : race.position <= 3 ? 'text-emerald-400' : 'text-slate-300'">
                                {{ race.position }}
                              </td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-white">{{ race.points }}</td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400">{{ race.opponents+1 }}</td>
                              <td class="px-3 py-2 text-sm text-right text-purple-400">{{ race.beaten }}</td>
                              <td class="px-3 py-2 text-right">
                                <router-link :to="'/t/' + race.tournamentId" class="text-indigo-400 hover:text-indigo-300 transition-colors">
                                  <i class="ph-bold ph-arrow-right"></i>
                                </router-link>
                              </td>
                            </tr>
                            </tbody>
                          </table>
                          <div v-if="expandedPlayerRaces.length === 0" class="px-4 py-6 text-center text-slate-500 text-sm">No race data</div>
                        </div>
                      </div>

                    </div>
                  </td>
                </tr>
              </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'umas'" class="space-y-4">

        <input
            v-model="umaSearchQuery"
            type="text"
            placeholder="Search umas..."
            class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        <div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-900 border-b border-slate-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-12">#</th>

                <th @click="toggleUmaSort('name')" class="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none">
                  <div class="flex items-center gap-1">
                    Uma
                    <i v-if="umaSortKey === 'name'" class="ph-bold" :class="umaSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                    <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                  </div>
                </th>

                <th v-for="col in [
                      { key: 'tournamentsPicked', label: 'T. Picks' },
                      { key: 'picks', label: 'Picks' },
                      { key: 'pickRate', label: 'Pick %' },
                      { key: 'bans', label: 'Bans' },
                      { key: 'banRate', label: 'Ban %' },
                      { key: 'tournamentCount', label: 'Presence' },
                      { key: 'presence', label: 'Presence %' },
                      { key: 'timesPlayed', label: 'Races' },
                      { key: 'wins', label: 'Race Wins' },
                      { key: 'winRate', label: 'Win Rate' },
                      { key: 'avgPoints', label: 'Avg Pts' },
                      { key: 'dominance', label: 'Dominance' },
                      { key: 'avgPosition', label: 'Avg Pos' }
                    ]"
                    :key="col.key"
                    @click="toggleUmaSort(col.key)"
                    class="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none">
                  <div class="flex items-center justify-end gap-1">
                    {{ col.label }}
                    <i v-if="umaSortKey === col.key" class="ph-bold text-indigo-400" :class="umaSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                    <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                  </div>
                </th>
              </tr>
              </thead>
              <tbody class="divide-y divide-slate-700">
              <template
                  v-for="(uma, idx) in umaStats.filter(u => !umaSearchQuery || u.name.toLowerCase().includes(umaSearchQuery.toLowerCase()))"
                  :key="uma.name"
              >
                <tr
                    @click="toggleUmaExpand(uma.name)"
                    class="hover:bg-slate-700/50 transition-colors cursor-pointer group"
                    :class="{'bg-slate-800/80': expandedUmaName === uma.name}"
                >
                  <td class="px-4 py-3 text-sm text-slate-400">{{ idx + 1 }}</td>
                  <td class="px-4 py-3 text-sm font-bold text-white">
                    <div class="flex items-center gap-2">
                      <i class="ph-bold text-slate-500 group-hover:text-indigo-400 transition-transform duration-200"
                         :class="expandedUmaName === uma.name ? 'ph-caret-down text-indigo-400' : 'ph-caret-right'"></i>
                      <img :src="getUmaImagePath(uma.name)" :alt="uma.name" class="w-6 h-6 rounded-full object-cover shrink-0 bg-slate-700" />
                      {{ uma.name }}
                    </div>
                  </td>

                  <td class="px-4 py-3 text-sm text-right text-slate-300">{{ uma.tournamentsPicked }}/{{ uma.availableTournaments }}</td>
                  <td class="px-4 py-3 text-sm text-right text-slate-300">{{ uma.picks }}/{{uma.totalPicks}}</td>
                  <td class="px-4 py-3 text-sm text-right text-blue-400">{{ uma.pickRate }}%</td>

                  <td class="px-4 py-3 text-sm text-right text-slate-300">{{ uma.bans }}/{{ uma.availableTournaments }} </td>
                  <td class="px-4 py-3 text-sm text-right text-rose-400">{{ uma.banRate }}%</td>

                  <td class="px-4 py-3 text-sm text-right text-slate-300">{{ uma.tournamentCount }}/{{ uma.availableTournaments }}</td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-amber-400">{{ uma.presence }}%</td>

                  <td class="px-4 py-3 text-sm text-right text-slate-400">{{ (uma as any)[stageKey('timesPlayed')] }}</td>
                  <td class="px-4 py-3 text-sm text-right text-emerald-400">{{ (uma as any)[stageKey('wins')] }}</td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-emerald-400">{{ (uma as any)[stageKey('winRate')] }}%</td>
                  <td class="px-4 py-3 text-sm text-right text-indigo-400">{{ (uma as any)[stageKey('avgPoints')] }}</td>
                  <td class="px-4 py-3 text-sm text-right font-bold text-purple-400">{{ (uma as any)[stageKey('dominance')] }}%</td>
                  <td class="px-4 py-3 text-sm text-right text-slate-400">{{ (uma as any)[stageKey('avgPosition')] }}</td>
                </tr>

                <tr v-if="expandedUmaName === uma.name">
                  <td :colspan="14" class="p-0">
                    <div class="bg-slate-900/50 border-t border-slate-700 p-4">
                      <div class="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                        <div class="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
                          <button
                              @click="expandedUmaDetailTab = 'tournaments'"
                              class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5"
                              :class="expandedUmaDetailTab === 'tournaments'
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'"
                          >
                            <i class="ph-fill ph-trophy"></i>
                            Appearances
                            <span class="opacity-60">({{ expandedUmaTournaments.length }})</span>
                          </button>
                          <button
                              @click="expandedUmaDetailTab = 'players'"
                              class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5"
                              :class="expandedUmaDetailTab === 'players'
                                  ? 'bg-indigo-600 border-indigo-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'"
                          >
                            <i class="ph-fill ph-users"></i>
                            Players
                            <span class="opacity-60">({{ expandedUmaPlayers.length }})</span>
                          </button>
                        </div>

                        <div v-if="expandedUmaDetailTab === 'tournaments'" class="overflow-x-auto">
                          <table class="w-full">
                            <thead class="bg-slate-900 border-b border-slate-700">
                            <tr>
                              <th class="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-8">#</th>
                              <th v-for="col in [
                                    { key: 'tournamentName', label: 'Tournament' },
                                    { key: 'playedAt', label: 'Date' },
                                    { key: 'playerName', label: 'Player' },
                                    { key: 'finalsStatus', label: 'Perf.' },
                                    { key: 'races', label: 'Races' },
                                    { key: 'wins', label: 'Wins' },
                                    { key: 'winRate', label: 'Win %' },
                                    { key: 'totalPoints', label: 'Points' },
                                    { key: 'avgPoints', label: 'Avg Pts' },
                                    { key: 'dominance', label: 'Dominance' },
                                    { key: 'avgPosition', label: 'Avg Pos' },
                                  ]"
                                  :key="col.key"
                                  @click="toggleUmaTournamentSort(col.key)"
                                  class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                                  :class="col.key === 'tournamentName' || col.key === 'playedAt' || col.key === 'playerName' || col.key === 'finalsStatus' ? 'text-left' : 'text-right'"
                              >
                                <div class="flex items-center gap-1" :class="col.key === 'tournamentName' || col.key === 'playedAt' || col.key === 'playerName' || col.key === 'finalsStatus' ? '' : 'justify-end'">
                                  {{ col.label }}
                                  <i v-if="umaTournamentSortKey === col.key" class="ph-bold text-indigo-400" :class="umaTournamentSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                                  <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                                </div>
                              </th>
                              <th class="px-3 py-2 w-8"></th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-700">
                            <tr v-for="(row, rIdx) in expandedUmaTournaments" :key="row.tournamentId + '_' + row.playerId" class="hover:bg-slate-700/50 transition-colors">
                              <td class="px-3 py-2 text-xs text-slate-500">{{ rIdx + 1 }}</td>
                              <td class="px-3 py-2 text-sm font-bold text-white">
                                {{ row.tournamentName }}
                                <template v-for="track in [row.selectedTrack ? TRACK_DICT[row.selectedTrack] : null]" :key="'ut'">
                                  <span v-if="track" class="block text-[11px] font-normal text-slate-500">{{ track.location }} {{ track.distance }}m</span>
                                </template>
                              </td>
                              <td class="px-3 py-2 text-sm text-slate-400 whitespace-nowrap">{{ row.playedAt ? new Date(row.playedAt).toLocaleDateString() : '—' }}</td>
                              <td class="px-3 py-2 text-sm text-slate-300">{{ row.playerName }}</td>
                              <td class="px-3 py-2 text-sm text-left">
                                <div class="flex items-center justify-start gap-1 flex-wrap">
                                  <span v-if="row.isWildcard" class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold uppercase">WC {{ row.wildcardGroup }}</span>
                                  <span v-if="row.finalsStatus === 'winner'" class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase">Winner</span>
                                  <span v-else-if="row.finalsStatus === 'finals'" class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold uppercase">{{ row.teamRank ? ordinal(row.teamRank) + ' Finals' : 'Finals' }}</span>
                                  <span v-else-if="row.finalsStatus === 'eliminated'" class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold uppercase">{{ row.teamRank ? ordinal(row.teamRank) + ' Grps' : 'Out' }}</span>
                                  <span v-else-if="row.finalsStatus === 'no-groups'" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 font-bold uppercase">{{ row.teamRank ? ordinal(row.teamRank) : '-' }}</span>
                                  <span v-else-if="!row.isWildcard" class="text-slate-600">-</span>
                                </div>
                              </td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400">{{ (row as any)[stageKey('races')] }}</td>
                              <td class="px-3 py-2 text-sm text-right text-emerald-400">{{ (row as any)[stageKey('wins')] }}</td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-emerald-400">{{ (row as any)[stageKey('winRate')] }}%</td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-white">{{ (row as any)[stageKey('totalPoints')] }}</td>
                              <td class="px-3 py-2 text-sm text-right text-indigo-400">{{ (row as any)[stageKey('avgPoints')] }}</td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-purple-400">{{ (row as any)[stageKey('dominance')] }}%</td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400">{{ (row as any)[stageKey('avgPosition')] }}</td>
                              <td class="px-3 py-2 text-right">
                                <router-link :to="'/t/' + row.tournamentId" class="text-indigo-400 hover:text-indigo-300 transition-colors">
                                  <i class="ph-bold ph-arrow-right"></i>
                                </router-link>
                              </td>
                            </tr>
                            </tbody>
                          </table>
                          <div v-if="expandedUmaTournaments.length === 0" class="px-4 py-6 text-center text-slate-500 text-sm">No tournament data</div>
                        </div>

                        <div v-if="expandedUmaDetailTab === 'players'" class="overflow-x-auto">
                          <table class="w-full">
                            <thead class="bg-slate-900 border-b border-slate-700">
                            <tr>
                              <th class="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-8">#</th>
                              <th v-for="col in [
                                    { key: 'playerName', label: 'Player' },
                                    { key: 'tournaments', label: 'Picks' },
                                    { key: 'racesPlayed', label: 'Races' },
                                    { key: 'wins', label: 'Wins' },
                                    { key: 'winRate', label: 'Win %' },
                                    { key: 'totalPoints', label: 'Points' },
                                    { key: 'avgPoints', label: 'Avg Pts' },
                                    { key: 'dominance', label: 'Dominance' },
                                    { key: 'avgPosition', label: 'Avg Pos' },
                                  ]"
                                  :key="col.key"
                                  @click="toggleUmaPlayerSort(col.key)"
                                  class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap"
                                  :class="col.key === 'playerName' ? 'text-left' : 'text-right'"
                              >
                                <div class="flex items-center gap-1" :class="col.key === 'playerName' ? '' : 'justify-end'">
                                  {{ col.label }}
                                  <i v-if="umaPlayerSortKey === col.key" class="ph-bold text-indigo-400" :class="umaPlayerSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                                  <i v-else class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                                </div>
                              </th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-700">
                            <tr v-for="(row, rIdx) in expandedUmaPlayers" :key="row.playerId" class="hover:bg-slate-700/50 transition-colors">
                              <td class="px-3 py-2 text-xs text-slate-500">{{ rIdx + 1 }}</td>
                              <td class="px-3 py-2 text-sm font-bold text-white">{{ row.playerName }}</td>
                              <td class="px-3 py-2 text-sm text-right text-slate-300">{{ row.tournaments }}</td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400">{{ (row as any)[stageKey('racesPlayed')] }}</td>
                              <td class="px-3 py-2 text-sm text-right text-emerald-400">{{ (row as any)[stageKey('wins')] }}</td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-emerald-400">{{ (row as any)[stageKey('winRate')] }}%</td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-white">{{ (row as any)[stageKey('totalPoints')] }}</td>
                              <td class="px-3 py-2 text-sm text-right text-indigo-400">{{ (row as any)[stageKey('avgPoints')] }}</td>
                              <td class="px-3 py-2 text-sm text-right font-bold text-purple-400">{{ (row as any)[stageKey('dominance')] }}%</td>
                              <td class="px-3 py-2 text-sm text-right text-slate-400">{{ (row as any)[stageKey('avgPosition')] }}</td>
                            </tr>
                            </tbody>
                          </table>
                          <div v-if="expandedUmaPlayers.length === 0" class="px-4 py-6 text-center text-slate-500 text-sm">No player data</div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'tierlist'" class="space-y-4">

        <div class="flex justify-center gap-2 flex-wrap">
          <button
              v-for="(config, key) in TIER_CRITERIA"
              :key="key"
              @click="tierCriterion = key"
              class="px-3 py-1.5 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5"
              :class="tierCriterion === key
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'"
          >
            <i :class="config.icon"></i>
            {{ config.label }}
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div>
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i class="ph-fill ph-users text-indigo-400"></i> Players
            </h3>
            <div class="space-y-3">
              <div
                  v-for="tier in playerTierList"
                  :key="tier.tier"
                  class="rounded-xl border overflow-hidden"
                  :class="tier.border"
              >
                <div class="flex items-stretch">
                  <div
                      class="w-12 md:w-16 flex-shrink-0 flex items-center justify-center bg-gradient-to-r"
                      :class="tier.color"
                  >
                    <span class="text-2xl md:text-3xl font-black" :class="tier.text">{{ tier.tier }}</span>
                  </div>
                  <div class="flex-1 flex flex-wrap gap-2 p-3 bg-slate-900/50">
                    <div
                        v-for="p in tier.entries"
                        :key="p.player.id"
                        @click="openProfile(p.player)"
                        class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2 hover:border-indigo-500 hover:bg-slate-700/50 transition-colors cursor-pointer"
                    >
                      <PlayerAvatar :name="p.player.name" :avatar-url="p.player.avatarUrl" size="sm" />
                      <span class="font-bold text-white text-sm">{{ p.player.name }}</span>
                      <span class="text-xs px-1.5 py-0.5 rounded font-bold" :class="tier.text + ' bg-slate-900'">{{ stageStatValue(p, tierCriterion) }}{{ TIER_CRITERIA[tierCriterion].suffix }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="playerTierList.length === 0" class="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center text-slate-400">
                No players match the current filters.
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i class="ph-fill ph-horse text-indigo-400"></i> Umas
            </h3>
            <div class="space-y-3">
              <div
                  v-for="tier in umaTierList"
                  :key="tier.tier"
                  class="rounded-xl border overflow-hidden"
                  :class="tier.border"
              >
                <div class="flex items-stretch">
                  <div
                      class="w-12 md:w-16 flex-shrink-0 flex items-center justify-center bg-gradient-to-r"
                      :class="tier.color"
                  >
                    <span class="text-2xl md:text-3xl font-black" :class="tier.text">{{ tier.tier }}</span>
                  </div>
                  <div class="flex-1 flex flex-wrap gap-2 p-3 bg-slate-900/50">
                    <div
                        v-for="u in tier.entries"
                        :key="u.name"
                        class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2 hover:border-slate-500 transition-colors"
                    >
                      <img :src="getUmaImagePath(u.name)" :alt="u.name" class="w-6 h-6 rounded-full object-cover shrink-0 bg-slate-700" />
                      <span class="font-bold text-white text-sm">{{ u.name }}</span>
                      <span class="text-xs px-1.5 py-0.5 rounded font-bold" :class="tier.text + ' bg-slate-900'">{{ stageStatValue(u, tierCriterion) }}{{ TIER_CRITERIA[tierCriterion].suffix }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="umaTierList.length === 0" class="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center text-slate-400">
                No umas match the current filters.
              </div>
            </div>
          </div>

        </div>
      </div>

      <div v-if="activeTab === 'tournaments'" class="space-y-4">
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h3 class="text-xl font-bold text-white flex items-center gap-2">
                <i class="ph-fill ph-scales text-amber-400"></i>
                Tournament Comparison
              </h3>
              <p class="text-sm text-slate-400 mt-1">Compare two filtered tournaments side by side.</p>
            </div>
            <div class="text-xs text-slate-500 font-mono">
              {{ comparisonTournamentOptions.length }} eligible events
            </div>
          </div>

          <div class="grid lg:grid-cols-2 gap-4">
            <div class="bg-slate-900/70 border border-slate-700 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between gap-3">
                <div class="text-xs font-bold uppercase tracking-wider text-cyan-400">Slot A</div>
                <select
                    v-model="compareLeftId"
                    class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 w-full max-w-md"
                >
                  <option v-for="option in comparisonTournamentOptions" :key="option.id" :value="option.id">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div v-if="leftTournamentSummary" class="space-y-3">
                <div>
                  <div class="text-lg font-black text-white">{{ leftTournamentSummary.name }}</div>
                  <div class="text-sm text-slate-400">{{ leftTournamentSummary.dateLabel }} · {{ leftTournamentSummary.formatLabel }}</div>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Track</div>
                    <div class="text-slate-200 font-medium">{{ leftTournamentSummary.trackLabel }}</div>
                  </div>
                  <div class="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Conditions</div>
                    <div class="text-slate-200 font-medium">{{ leftTournamentSummary.conditionLabel }}</div>
                  </div>
                  <div class="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Winner(s)</div>
                    <div class="text-amber-400 font-medium">{{ leftTournamentSummary.winners.join(', ') || '—' }}</div>
                  </div>
                  <div class="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Top Scorer</div>
                    <div class="text-slate-200 font-medium">{{ leftTournamentSummary.topScorer }} <span class="text-slate-500">({{ leftTournamentSummary.topScorerPoints }} pts)</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-slate-900/70 border border-slate-700 rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between gap-3">
                <div class="text-xs font-bold uppercase tracking-wider text-fuchsia-400">Slot B</div>
                <select
                    v-model="compareRightId"
                    class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-500 w-full max-w-md"
                >
                  <option v-for="option in comparisonTournamentOptions" :key="option.id" :value="option.id">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div v-if="rightTournamentSummary" class="space-y-3">
                <div>
                  <div class="text-lg font-black text-white">{{ rightTournamentSummary.name }}</div>
                  <div class="text-sm text-slate-400">{{ rightTournamentSummary.dateLabel }} · {{ rightTournamentSummary.formatLabel }}</div>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Track</div>
                    <div class="text-slate-200 font-medium">{{ rightTournamentSummary.trackLabel }}</div>
                  </div>
                  <div class="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Conditions</div>
                    <div class="text-slate-200 font-medium">{{ rightTournamentSummary.conditionLabel }}</div>
                  </div>
                  <div class="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Winner(s)</div>
                    <div class="text-amber-400 font-medium">{{ rightTournamentSummary.winners.join(', ') || '—' }}</div>
                  </div>
                  <div class="bg-slate-950 rounded-lg p-3 border border-slate-800">
                    <div class="text-xs uppercase tracking-wider text-slate-500 mb-1">Top Scorer</div>
                    <div class="text-slate-200 font-medium">{{ rightTournamentSummary.topScorer }} <span class="text-slate-500">({{ rightTournamentSummary.topScorerPoints }} pts)</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="leftTournamentSummary && rightTournamentSummary" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <div
                v-for="metric in tournamentCompareMetrics"
                :key="metric.key"
                class="rounded-xl border border-slate-700 bg-slate-900/70 p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="text-xs uppercase tracking-wider text-slate-500 font-bold">{{ metric.label }}</div>
                <i :class="metric.icon" class="text-slate-500"></i>
              </div>
              <div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
                <div>
                  <div class="text-xs text-cyan-400 uppercase tracking-wider font-bold mb-1">A</div>
                  <div class="text-2xl font-black text-white">{{ metric.left }}</div>
                </div>
                <div class="text-center">
                  <div class="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Delta</div>
                  <div class="text-sm font-bold" :class="metric.deltaClass">{{ metric.deltaLabel }}</div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-fuchsia-400 uppercase tracking-wider font-bold mb-1">B</div>
                  <div class="text-2xl font-black text-white">{{ metric.right }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="leftTournamentSummary && rightTournamentSummary" class="grid xl:grid-cols-2 gap-4">
            <div class="bg-slate-900/70 border border-slate-700 rounded-xl overflow-hidden">
              <div class="px-4 py-3 border-b border-slate-700 bg-slate-950 flex items-center justify-between">
                <h4 class="font-bold text-white">{{ leftTournamentSummary.name }}</h4>
                <span class="text-xs text-slate-500 font-mono">{{ leftTournamentSummary.teams.length }} teams</span>
              </div>
              <div class="divide-y divide-slate-800">
                <div
                    v-for="team in leftTournamentSummary.teams"
                    :key="team.id"
                    class="px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase tracking-wider text-slate-500">#{{ team.rank }}</span>
                      <span class="font-bold text-white">{{ getTournamentTeamName(team) }}</span>
                      <span v-if="team.inFinals" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-bold">Finals</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">Group {{ team.group }} · {{ team.rosterCount }} players</div>
                    <div class="text-xs text-slate-500 mt-1">{{ team.rosterNames.join(', ') }}</div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="text-lg font-black text-white">{{ team.totalPoints }}</div>
                    <div class="text-xs text-slate-500">G {{ team.points }} · F {{ team.finalsPoints }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-slate-900/70 border border-slate-700 rounded-xl overflow-hidden">
              <div class="px-4 py-3 border-b border-slate-700 bg-slate-950 flex items-center justify-between">
                <h4 class="font-bold text-white">{{ rightTournamentSummary.name }}</h4>
                <span class="text-xs text-slate-500 font-mono">{{ rightTournamentSummary.teams.length }} teams</span>
              </div>
              <div class="divide-y divide-slate-800">
                <div
                    v-for="team in rightTournamentSummary.teams"
                    :key="team.id"
                    class="px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase tracking-wider text-slate-500">#{{ team.rank }}</span>
                      <span class="font-bold text-white">{{ getTournamentTeamName(team) }}</span>
                      <span v-if="team.inFinals" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-bold">Finals</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">Group {{ team.group }} · {{ team.rosterCount }} players</div>
                    <div class="text-xs text-slate-500 mt-1">{{ team.rosterNames.join(', ') }}</div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="text-lg font-black text-white">{{ team.totalPoints }}</div>
                    <div class="text-xs text-slate-500">G {{ team.points }} · F {{ team.finalsPoints }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="bg-slate-900 border border-dashed border-slate-700 rounded-xl p-6 text-center text-slate-400">
            Pick two tournaments from the selectors or use the archive buttons below to start comparing.
          </div>
        </div>
        <div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
            <h3 class="font-bold text-white uppercase tracking-wider text-sm">Tournament Archive</h3>
            <span class="text-xs text-slate-500 font-mono">{{ filteredTournaments.length }} Events</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-900 border-b border-slate-700">
              <tr>
                <th v-for="col in [
                  { key: 'date',    label: 'Date',     align: 'left'  },
                  { key: 'name',    label: 'Name',     align: 'left'  },
                  { key: 'track',   label: 'Track',    align: 'left'  },
                  { key: 'winners', label: 'Winner(s)', align: 'left' },
                  { key: 'players', label: 'Players',  align: 'right' },
                  { key: 'compare', label: 'Compare',  align: 'right' },
                ]" :key="col.key"
                    @click="col.key !== 'compare' && toggleTournamentSort(col.key)"
                    class="px-4 py-2 text-xs font-bold text-slate-400 uppercase cursor-pointer hover:text-white transition-colors group select-none"
                    :class="col.align === 'right' ? 'text-right' : 'text-left'">
                  <div class="flex items-center gap-1" :class="col.align === 'right' ? 'justify-end' : ''">
                    {{ col.label }}
                    <i v-if="col.key !== 'compare' && tournamentSortKey === col.key" class="ph-bold text-indigo-400" :class="tournamentSortDesc ? 'ph-caret-down' : 'ph-caret-up'"></i>
                    <i v-else-if="col.key !== 'compare'" class="ph-bold ph-caret-down opacity-0 group-hover:opacity-50"></i>
                  </div>
                </th>
              </tr>
              </thead>
              <tbody class="divide-y divide-slate-700">
              <tr v-for="t in sortedTournaments" :key="t.id" class="hover:bg-slate-750 transition-colors">
                <td class="px-4 py-3 text-sm text-slate-400 font-mono">
                  {{ new Date(t.playedAt ?? t.createdAt).toLocaleDateString() }}
                </td>
                <td class="px-4 py-3 text-sm font-bold text-white">
                  <router-link :to="'/t/' + t.id" class="hover:text-indigo-400 transition-colors">
                    {{ t.name }}
                  </router-link>
                </td>
                <td class="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                  <template v-for="track in [t.selectedTrack ? TRACK_DICT[t.selectedTrack] : null]" :key="'track'">
                    <span v-if="track">{{ track.location }} {{ track.distance }}m</span>
                    <span v-else class="text-slate-600">—</span>
                  </template>
                </td>
                <td class="px-4 py-3 text-sm text-amber-400 font-medium">
                  {{ tournamentWinnerNames.get(t.id)?.join(', ') || '—' }}
                </td>
                <td class="px-4 py-3 text-sm text-right text-slate-300">
                  {{ Object.keys(t.players).length }}
                </td>
                <td class="px-4 py-3 text-sm text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                        @click="assignTournamentSlot('left', t.id)"
                        class="px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors"
                        :class="compareLeftId === t.id
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/40'"
                    >
                      A
                    </button>
                    <button
                        @click="assignTournamentSlot('right', t.id)"
                        class="px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors"
                        :class="compareRightId === t.id
                          ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-fuchsia-500/40'"
                    >
                      B
                    </button>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ==================== DIAGRAMS TAB ==================== -->
      <div v-if="activeTab === 'diagrams'" class="space-y-4">

        <!-- Shared controls: subject + metric + mode -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-wrap gap-3 items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">View</span>
            <div class="flex rounded-lg bg-slate-900 p-1 gap-1">
              <button
                @click="diagramSubject = 'players'"
                class="px-3 py-1.5 text-xs font-bold rounded transition-all"
                :class="diagramSubject === 'players' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'"
              >Players</button>
              <button
                @click="diagramSubject = 'umas'"
                class="px-3 py-1.5 text-xs font-bold rounded transition-all"
                :class="diagramSubject === 'umas' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'"
              >Umas</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Metric</span>
            <div class="flex rounded-lg bg-slate-900 p-1 gap-1">
              <button
                @click="diagramMetric = 'dominance'"
                class="px-3 py-1.5 text-xs font-bold rounded transition-all"
                :class="diagramMetric === 'dominance' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'"
              >Dominance</button>
              <button
                @click="diagramMetric = 'avg-points'"
                class="px-3 py-1.5 text-xs font-bold rounded transition-all"
                :class="diagramMetric === 'avg-points' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'"
              >Avg Points</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Mode</span>
            <div class="flex rounded-lg bg-slate-900 p-1 gap-1">
              <button
                @click="diagramMode = 'per-tournament'"
                class="px-3 py-1.5 text-xs font-bold rounded transition-all"
                :class="diagramMode === 'per-tournament' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'"
              >Per Tournament</button>
              <button
                @click="diagramMode = 'cumulative'"
                class="px-3 py-1.5 text-xs font-bold rounded transition-all"
                :class="diagramMode === 'cumulative' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'"
              >Cumulative</button>
            </div>
          </div>
        </div>

        <!-- Player Timeline Chart -->
        <div v-if="diagramSubject === 'players'" class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div class="p-4 border-b border-slate-700">
            <h3 class="font-bold text-white">
              Player {{ diagramMetric === 'dominance' ? 'Dominance' : 'Avg Points' }} Timeline
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ diagramMetric === 'dominance'
                ? 'Opponents beaten ÷ opponents faced, per tournament'
                : 'Average points scored per race, per tournament' }}
            </p>
          </div>

          <div class="p-4">
            <div v-if="diagramSelectedPlayerIds.length === 0"
                 class="py-16 text-center text-slate-500 space-y-2">
              <i class="ph ph-users text-5xl block"></i>
              <p>Select players below to plot their stats over time.</p>
            </div>
            <LineChart
              v-else
              :datasets="playerTimelineData.datasets"
              :x-labels="playerTimelineData.xLabels"
              :y-max="diagramMetric === 'dominance' ? 100 : undefined"
              :y-unit="diagramMetric === 'dominance' ? '%' : ''"
              :y-label="diagramMetric === 'dominance' ? 'Dominance (%)' : 'Avg Points'"
            />
          </div>
        </div>

        <!-- Player Selector -->
        <div v-if="diagramSubject === 'players'" class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h4 class="font-bold text-sm text-white">Select Players</h4>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-500">{{ diagramSelectedPlayerIds.length }} / {{ MAX_DIAGRAM_PLAYERS }} selected</span>
              <button
                v-if="diagramSelectedPlayerIds.length > 0"
                @click="diagramSelectedPlayerIds = []"
                class="text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >Clear all</button>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 p-3 max-h-64 overflow-y-auto custom-scrollbar">
            <button
              v-for="p in [...playerRankings].sort((a,b) => a.player.name.localeCompare(b.player.name))"
              :key="p.player.id"
              @click="toggleDiagramPlayer(p.player.id)"
              class="flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all"
              :class="diagramSelectedPlayerIds.includes(p.player.id)
                ? 'border-indigo-500/60 bg-indigo-600/15'
                : diagramSelectedPlayerIds.length >= MAX_DIAGRAM_PLAYERS
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  : 'border-slate-700 hover:border-slate-500 text-slate-300'"
              :disabled="!diagramSelectedPlayerIds.includes(p.player.id) && diagramSelectedPlayerIds.length >= MAX_DIAGRAM_PLAYERS"
            >
              <div
                class="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                :style="{ backgroundColor: diagramSelectedPlayerIds.includes(p.player.id) ? diagramColorMap.get(p.player.id) : undefined }"
                :class="!diagramSelectedPlayerIds.includes(p.player.id) ? 'bg-slate-700' : ''"
              ></div>
              <span class="truncate text-xs font-medium">{{ p.player.name }}</span>
              <span class="text-[10px] text-slate-500 font-mono ml-auto shrink-0">{{ p.dominance }}%</span>
            </button>
          </div>
        </div>

        <!-- Uma Timeline Chart -->
        <div v-if="diagramSubject === 'umas'" class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div class="p-4 border-b border-slate-700">
            <h3 class="font-bold text-white">
              Uma {{ diagramMetric === 'dominance' ? 'Dominance' : 'Avg Points' }} Timeline
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ diagramMetric === 'dominance'
                ? 'Opponents beaten ÷ opponents faced per uma, per tournament'
                : 'Average points scored per race per uma, per tournament' }}
            </p>
          </div>

          <div class="p-4">
            <div v-if="diagramSelectedUmaNames.length === 0"
                 class="py-16 text-center text-slate-500 space-y-2">
              <i class="ph ph-horse text-5xl block"></i>
              <p>Select Umas below to plot their stats over time.</p>
            </div>
            <LineChart
              v-else
              :datasets="umaTimelineData.datasets"
              :x-labels="umaTimelineData.xLabels"
              :y-max="diagramMetric === 'dominance' ? 100 : undefined"
              :y-unit="diagramMetric === 'dominance' ? '%' : ''"
              :y-label="diagramMetric === 'dominance' ? 'Dominance (%)' : 'Avg Points'"
            />
          </div>
        </div>

        <!-- Uma Selector -->
        <div v-if="diagramSubject === 'umas'" class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h4 class="font-bold text-sm text-white">Select Umas</h4>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-500">{{ diagramSelectedUmaNames.length }} / {{ MAX_DIAGRAM_UMAS }} selected</span>
              <button
                v-if="diagramSelectedUmaNames.length > 0"
                @click="diagramSelectedUmaNames = []"
                class="text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >Clear all</button>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 p-3 max-h-64 overflow-y-auto custom-scrollbar">
            <button
              v-for="umaName in diagramAvailableUmas"
              :key="umaName"
              @click="toggleDiagramUma(umaName)"
              class="flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all"
              :class="diagramSelectedUmaNames.includes(umaName)
                ? 'border-indigo-500/60 bg-indigo-600/15'
                : diagramSelectedUmaNames.length >= MAX_DIAGRAM_UMAS
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  : 'border-slate-700 hover:border-slate-500 text-slate-300'"
              :disabled="!diagramSelectedUmaNames.includes(umaName) && diagramSelectedUmaNames.length >= MAX_DIAGRAM_UMAS"
            >
              <div
                class="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                :style="{ backgroundColor: diagramSelectedUmaNames.includes(umaName) ? diagramUmaColorMap.get(umaName) : undefined }"
                :class="!diagramSelectedUmaNames.includes(umaName) ? 'bg-slate-700' : ''"
              ></div>
              <img :src="getUmaImagePath(umaName)" :alt="umaName" class="w-4 h-4 rounded-full object-cover shrink-0 bg-slate-700" />
              <span class="truncate text-xs font-medium">{{ umaName }}</span>
            </button>
          </div>
        </div>

      </div>
      <!-- ==================== END DIAGRAMS TAB ==================== -->

      <!-- ==================== DECKS TAB ==================== -->
      <div v-if="activeTab === 'decks'" class="space-y-4">

        <!-- Stats Summary -->
        <div v-if="deckStats" class="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Deck Stats Overview</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div class="text-2xl font-bold text-white">{{ deckStats.totalPlayers }}</div>
              <div class="text-xs text-slate-400">Players with Decks</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-indigo-400">{{ deckStats.avgScore }}</div>
              <div class="text-xs text-slate-400">Avg Score</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-sky-400">{{ deckStats.avgRaceBonus }}</div>
              <div class="text-xs text-slate-400">Avg Race Bonus</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-emerald-400">{{ deckStats.metRaceBonusPct }}%</div>
              <div class="text-xs text-slate-400">Met 50 RB Target</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-yellow-400">{{ deckStats.maxScore }}</div>
              <div class="text-xs text-slate-400">Highest Score</div>
            </div>
          </div>
        </div>

        <!-- Search + Sort -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-wrap gap-3 items-center">
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input v-model="deckSearchQuery" type="text" placeholder="Search player or uma..."
                     class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider mr-1">Sort</span>
            <button v-for="key in ['score', 'raceBonus', 'trainingEff', 'specialtyPri', 'utility', 'composition'] as const"
                    :key="key"
                    @click="toggleDeckSort(key)"
                    class="px-3 py-1.5 text-xs font-bold rounded transition-all"
                    :class="deckSortKey === key
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white bg-slate-900'">
              {{ key === 'raceBonus' ? 'Race Bonus' : key === 'trainingEff' ? 'Training' : key === 'specialtyPri' ? 'Specialty' : key === 'utility' ? 'Utility' : key === 'composition' ? 'Comp' : 'Score' }}
              <i v-if="deckSortKey === key" :class="deckSortDesc ? 'ph-caret-down' : 'ph-caret-up'" class="ml-1"></i>
            </button>
          </div>
        </div>

        <!-- No decks message -->
        <div v-if="filteredDeckRankings.length === 0" class="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <i class="ph ph-cards text-4xl text-slate-500 mb-3"></i>
          <p class="text-slate-400">No player decks found. Players need to add support cards to their profile.</p>
        </div>

        <!-- Player Deck Rankings -->
        <div v-for="(ranking, index) in filteredDeckRankings" :key="ranking.playerId"
             class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">

          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
            <div class="flex items-center gap-3">
              <span class="text-lg font-black w-8 text-center"
                    :class="index < 3 ? 'text-yellow-400' : 'text-slate-400'">#{{ index + 1 }}</span>
              <div>
                <div class="font-bold text-white">{{ ranking.playerName }}</div>
                <div class="text-xs text-slate-400">{{ ranking.umaName }}
                  <span v-if="umaStatBonus[ranking.umaName]" class="text-indigo-400 ml-1">({{ umaStatBonus[ranking.umaName] }})</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-400">
                RB: <span :class="ranking.evaluation?.raceBonusMet ? 'text-emerald-400' : 'text-orange-400'">{{ ranking.evaluation?.totalRaceBonus ?? 0 }}/50</span>
              </span>
              <span class="px-3 py-1 rounded-lg text-sm font-black border"
                    :class="ranking.evaluation ? `border-current ${getTierBg(ranking.evaluation.tier)}` : ''">
                {{ ranking.evaluation?.tier ?? '-' }}
              </span>
              <span class="text-2xl font-black text-white">{{ ranking.evaluation?.score ?? 0 }}</span>
            </div>
          </div>

          <!-- Cards -->
          <div v-if="ranking.evaluation" class="px-4 py-3">
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div v-for="cs in ranking.evaluation.cardScores" :key="cs.card.id"
                   class="flex items-center gap-2 px-3 py-2 rounded-lg border bg-slate-900/50"
                   :class="`border-slate-700`">
                <span class="text-xs font-black w-5 text-center"
                      :class="cs.tier === 'S' ? 'text-yellow-400' : cs.tier === 'A' ? 'text-orange-400' : 'text-slate-500'">{{ cs.tier }}</span>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-bold text-white truncate">{{ cs.card.name }}</div>
                  <div class="text-[10px] text-slate-500 truncate">{{ cs.card.cardName }}</div>
                  <div class="text-[10px] text-indigo-400">{{ cs.score }} pts</div>
                </div>
              </div>
            </div>

            <!-- Breakdown Bar -->
            <div class="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>Stats: <b class="text-white">{{ ranking.evaluation.breakdown.statBonusScore }}</b></span>
              <span>RB Score: <b class="text-white">{{ ranking.evaluation.breakdown.raceBonusScore }}</b></span>
              <span>Training: <b class="text-white">{{ ranking.evaluation.breakdown.trainingEffectivenessScore }}</b></span>
              <span>Specialty: <b class="text-white">{{ ranking.evaluation.breakdown.specialtyPriorityScore }}</b></span>
              <span>Utility: <b class="text-white">{{ ranking.evaluation.breakdown.utilityScore }}</b></span>
              <span v-if="ranking.evaluation.breakdown.compositionPenalty > 0" class="text-red-400">Comp: <b>-{{ ranking.evaluation.breakdown.compositionPenalty }}</b></span>
            </div>
          </div>
        </div>

      </div>
      <!-- ==================== END DECKS TAB ==================== -->

    </main>

  </div>

  <PlayerProfileModal
      :open="profileModalOpen"
      :player-name="profilePlayer?.name ?? ''"
      :global-player="profilePlayer"
      @close="profileModalOpen = false"
  />
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
