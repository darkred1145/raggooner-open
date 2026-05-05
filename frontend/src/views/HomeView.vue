<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { collection, doc, getDocs, orderBy, query, where, writeBatch, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { APP_ID } from '../config';
import type { Tournament, Season, TournamentCreator, Queue } from '../types';
import { TOURNAMENT_FORMATS } from "../utils/constants.ts";
import { getStatusColor } from "../utils/utils.ts";
import { useUserRoles } from '../composables/useUserRoles';
import { useAuth } from '../composables/useAuth';
import { useGlobalSettings } from '../composables/useGlobalSettings';
import SiteHeader from '../components/shared/SiteHeader.vue';
import SiteNav from '../components/shared/SiteNav.vue';
import QuickMatchQueue from '../components/QuickMatchQueue.vue';


const router = useRouter();
const appId = APP_ID;

const { isOfficialCreator } = useUserRoles();
const { linkedPlayer } = useAuth();
const { settings } = useGlobalSettings();

// State
const newTournamentName = ref('');
const isOfficial = computed({
  get: () => isOfficialCreator.value ? _isOfficial.value : false,
  set: (v) => { _isOfficial.value = v; },
});
const _isOfficial = ref(true);
const joinId = ref('');
const isCreating = ref(false);
const availableSeasons = ref<Season[]>([]);
const selectedSeasonId = ref('');
const selectedFormat = ref(settings.value.defaultFormat);
const banVotingEnabled = ref(false); // Enable captain-proposed + player-voted bans

// Update selectedFormat once when settings finish loading (if different from default)
const stopFormatWatch = watch(() => settings.value.defaultFormat, (fmt) => {
  selectedFormat.value = fmt;
  stopFormatWatch();
});

const homeListLoading = ref(true);
const showHistory = ref(false);

// Only non-completed tournaments — loaded on mount
const activeTournaments = ref<Tournament[]>([]);

// Completed tournaments loaded lazily per season
const seasonTournaments = reactive<Record<string, Tournament[]>>({});
const seasonLoading = reactive<Record<string, boolean>>({});
const seasonLoaded = reactive<Record<string, boolean>>({});

// All seasons start collapsed when history section opens
const collapsedSeasons = ref<string[]>([]);

// Queue state
const queue = ref<Queue | null>(null);
const isJoiningQueue = ref(false);
const partyMembers = ref<string[]>([]);
const partyMembersInput = ref('');

watch(showHistory, (val) => {
  if (val) {
    const allIds = [...availableSeasons.value.map(s => s.id), 'unassigned'];
    allIds.forEach(id => {
      if (!collapsedSeasons.value.includes(id)) collapsedSeasons.value.push(id);
    });
  }
});

const toggleSeasonGroup = async (seasonId: string) => {
  const index = collapsedSeasons.value.indexOf(seasonId);
  if (index === -1) {
    collapsedSeasons.value.push(seasonId);
  } else {
    collapsedSeasons.value.splice(index, 1);
    if (!seasonLoaded[seasonId]) {
      await fetchSeasonTournaments(seasonId);
    }
  }
};

const isScheduledStatus = (t: Tournament) =>
    !!t.scheduledTime && (t.status === 'registration' || t.status === 'track-selection');

const scheduledTournamentsList = computed(() =>
    activeTournaments.value
        .filter(t => isScheduledStatus(t))
        .sort((a, b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime())
);

const activeTournamentsList = computed(() =>
    activeTournaments.value.filter(t => !isScheduledStatus(t))
);

const formatScheduledTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

const groupedPastTournaments = computed(() => {
  const result = availableSeasons.value.map(s => ({
    seasonId: s.id,
    seasonName: s.name,
    tournaments: (seasonTournaments[s.id] || []) as Tournament[],
    loading: !!seasonLoading[s.id],
    loaded: !!seasonLoaded[s.id],
  }));
  result.push({
    seasonId: 'unassigned',
    seasonName: 'Unassigned / Older',
    tournaments: (seasonTournaments['unassigned'] || []) as Tournament[],
    loading: !!seasonLoading['unassigned'],
    loaded: !!seasonLoaded['unassigned'],
  });
  return result;
});

const fetchSeasons = async () => {
  try {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'seasons'), orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
    availableSeasons.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Season));
    if (availableSeasons.value.length > 0) selectedSeasonId.value = availableSeasons.value[0]!.id;
  } catch (e) {
    console.error('Failed to fetch seasons:', e);
  }
};

const NON_COMPLETED_STATUSES = ['track-selection', 'registration', 'draft', 'ban', 'pick', 'active'];

const fetchActiveTournaments = async () => {
  homeListLoading.value = true;
  try {
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'tournaments'),
      where('status', 'in', NON_COMPLETED_STATUSES)
    );
    const snapshot = await getDocs(q);
    activeTournaments.value = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as Tournament))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error("Error fetching active tournaments", e);
  } finally {
    homeListLoading.value = false;
  }
};

const fetchSeasonTournaments = async (seasonId: string) => {
  if (seasonLoaded[seasonId]) return;
  seasonLoading[seasonId] = true;
  try {
    if (seasonId === 'unassigned') {
      // Load all completed, then filter out those belonging to a known season
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'tournaments'),
        where('status', '==', 'completed')
      );
      const snapshot = await getDocs(q);
      const knownSeasonIds = new Set(availableSeasons.value.map(s => s.id));
      seasonTournaments['unassigned'] = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Tournament))
        .filter(t => !t.seasonId || !knownSeasonIds.has(t.seasonId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'tournaments'),
        where('status', '==', 'completed'),
        where('seasonId', '==', seasonId)
      );
      const snapshot = await getDocs(q);
      seasonTournaments[seasonId] = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Tournament))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    seasonLoaded[seasonId] = true;
  } catch (e) {
    console.error(`Error fetching tournaments for season ${seasonId}:`, e);
  } finally {
    seasonLoading[seasonId] = false;
  }
};

const createTournament = async () => {
  if (isCreating.value || !newTournamentName.value) return;
  isCreating.value = true;

  try {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const password = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userId = auth.currentUser!.uid;

    const tournamentRef = doc(db, 'artifacts', appId, 'public', 'data', 'tournaments', id);
    const secretRef = doc(db, 'artifacts', appId, 'public', 'data', 'secrets', id);
    const adminRef = doc(db, 'artifacts', appId, 'public', 'data', 'admins', `${id}_${userId}`);

    const newTourney: Tournament = {
      id,
      name: newTournamentName.value,
      seasonId: selectedSeasonId.value || undefined,
      status: 'track-selection',
      stage: 'groups',
      players: {},
      teams: [],
      races: {},
      playerIds: [],
      format: TOURNAMENT_FORMATS[selectedFormat.value]!.id,
      isOfficial: isOfficialCreator.value ? isOfficial.value : false,
      isSecured: true,
      selfSignupEnabled: settings.value.defaultSelfSignupEnabled,
      captainActionsEnabled: settings.value.defaultCaptainActionsEnabled,
      teamRenamingEnabled: true,
      usePlacementTiebreaker: settings.value.defaultUsePlacementTiebreaker,
      umaDraftMaxCopiesPerUma: 1,
      umaDraftAllowSameGroupDuplicates: false,
      pointsSystem: { ...settings.value.pointsSystem },
      banVotingEnabled: banVotingEnabled.value,
      banVoteThreshold: 0.5, // Simple majority
      createdAt: new Date().toISOString(),
      createdBy: {
        uid: userId,
        ...(linkedPlayer.value && {
          playerId: linkedPlayer.value.id,
          displayName: linkedPlayer.value.name,
          avatarUrl: linkedPlayer.value.avatarUrl,
        }),
      } satisfies TournamentCreator,
    };

    const batch = writeBatch(db);
    batch.set(tournamentRef, newTourney);
    batch.set(secretRef, { password: password });
    await batch.commit();

    await setDoc(adminRef, { tournamentId: id, userId: userId, password: password });
    localStorage.setItem(`admin_pwd_${id}`, password);

    // ROUTER REDIRECT
    router.push(`/t/${id}`);

  } catch (error) {
    console.error("Failed to create:", error);
    alert("Error creating tournament. Please try again.");
  } finally {
    isCreating.value = false;
  }
};

const joinTournament = () => {
  if (!joinId.value) return;
  router.push(`/t/${joinId.value}`);
};

const selectTournamentFromHome = (id: string) => {
  router.push(`/t/${id}`);
};

const formatTournamentStatus = (t: Tournament): string => {
  if (t.status === 'active') {
    return t.stage === 'groups' ? 'Group Stage' : 'Finals';
  }

  const statusMap: Record<Tournament['status'], string> = {
    'track-selection': 'Track Selection',
    registration: 'Registration',
    draft: 'Player Draft',
    ban: 'Uma Ban',
    completed: 'Completed',
    active: '', // Handled above
    pick: 'Uma Draft'
  };

  return statusMap[t.status] || t.status;
};

// Queue functions
const VERCEL_API_URL = import.meta.env.VITE_DISCORD_OAUTH_URL || 'https://raggooner-discord-oauth.vercel.app';

const subscribeToQueue = () => {
  const queueRef = doc(db, 'artifacts', appId, 'public', 'data', 'queues', 'racc-open-queue');
  onSnapshot(queueRef, (docSnap) => {
    if (docSnap.exists()) {
      queue.value = { id: docSnap.id, ...docSnap.data() } as Queue;
    } else {
      // Create queue if it doesn't exist
      const newQueue: Queue = {
        id: 'racc-open-queue',
        name: 'Racc Open Queue',
        parties: [],
        solos: [],
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      setDoc(queueRef, newQueue);
      queue.value = newQueue;
    }
  });
};

const joinQueue = async () => {
  if (isJoiningQueue.value || !linkedPlayer.value) return;
  isJoiningQueue.value = true;

  try {
    const response = await fetch(`${VERCEL_API_URL}/api/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'join',
        queueId: 'racc-open-queue',
        partyMembers: partyMembers.value.length > 0 ? partyMembers.value : undefined,
        authToken: auth.currentUser?.uid,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to join queue');
    }
    partyMembers.value = []; // Reset
  } catch (error: any) {
    console.error('Failed to join queue:', error);
    alert(error.message || 'Failed to join queue');
  } finally {
    isJoiningQueue.value = false;
  }
};

const leaveQueue = async () => {
  if (isJoiningQueue.value || !linkedPlayer.value) return;
  isJoiningQueue.value = true;

  try {
    const response = await fetch(`${VERCEL_API_URL}/api/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'leave',
        queueId: 'racc-open-queue',
        authToken: auth.currentUser?.uid,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to leave queue');
    }
  } catch (error: any) {
    console.error('Failed to leave queue:', error);
    alert(error.message || 'Failed to leave queue');
  } finally {
    isJoiningQueue.value = false;
  }
};

const joinWithParty = async () => {
  if (isJoiningQueue.value || !linkedPlayer.value || !partyMembersInput.value.trim()) return;
  isJoiningQueue.value = true;

  try {
    const members = partyMembersInput.value.split(',').map(id => id.trim()).filter(id => id);
    if (members.length !== 2) {
      alert('Please enter exactly 2 additional player IDs (total 3 players)');
      return;
    }

    const response = await fetch(`${VERCEL_API_URL}/api/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'join',
        queueId: 'racc-open-queue',
        partyMembers: members,
        authToken: auth.currentUser?.uid,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to join queue');
    }
    partyMembersInput.value = ''; // Reset
  } catch (error: any) {
    console.error('Failed to join queue with party:', error);
    alert(error.message || 'Failed to join queue');
  } finally {
    isJoiningQueue.value = false;
  }
};

const isInQueue = computed(() => {
  if (!queue.value || !linkedPlayer.value) return false;
  return queue.value.solos.some(s => s.playerId === linkedPlayer.value!.id) ||
         queue.value.parties.some(p => p.memberIds.includes(linkedPlayer.value!.id));
});

const totalQueuedPlayers = computed(() => {
  if (!queue.value) return 0;
  return queue.value.parties.reduce((sum, p) => sum + p.memberIds.length, 0) + queue.value.solos.length;
});

onMounted(() => {
  fetchSeasons();
  fetchActiveTournaments();
  subscribeToQueue();
});
</script>

<template>
  <div class="w-full flex flex-col min-h-full">

    <SiteHeader />

    <main class="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div class="max-w-3xl mx-auto">

        <SiteNav />

        <div class="max-w-lg mx-auto mt-8 space-y-12">

          <div class="text-center space-y-4">
            <h1 class="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Racc Open</h1>
            <p class="text-xl text-slate-400 max-w-2xl mx-auto">Organize Racc Open. Draft a Team, low-roll your career, mald a lot and race against the other teams.</p>
          </div>

          <div class="glass-panel p-6 rounded-2xl grid  gap-8 items-center bg-slate-800/40 border border-slate-700/50 shadow-2xl">
            <div class="space-y-4">
              <h2 class="text-2xl font-bold text-white mb-4">Create New Tournament</h2>
              <div class="space-y-3">
                <input v-model="newTournamentName"
                       @keydown.enter="createTournament"
                       :disabled="isCreating"
                       type="text"
                       placeholder="Tournament Name"
                       class="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all disabled:opacity-50">

                <select v-model="selectedSeasonId"
                        :disabled="isCreating || availableSeasons.length === 0"
                        class="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all disabled:opacity-50 appearance-none cursor-pointer">
                  <option v-if="availableSeasons.length === 0" value="" class="text-slate-500">No Season</option>
                  <option v-for="season in availableSeasons" :key="season.id" :value="season.id">
                    {{ season.name }}
                  </option>
                </select>

                <div class="flex gap-2">
                  <button v-for="(fmt, key) in TOURNAMENT_FORMATS" :key="key"
                          @click="selectedFormat = key"
                          :disabled="isCreating"
                          class="flex-1 p-3 rounded-lg border-2 text-left transition-all"
                          :class="selectedFormat === key
                            ? 'border-indigo-500 bg-indigo-900/30'
                            : 'border-slate-700 bg-slate-900 hover:border-slate-600'">
                    <span class="block text-sm font-bold" :class="selectedFormat === key ? 'text-indigo-300' : 'text-slate-300'">{{ fmt.name }}</span>
                    <span class="block text-[10px] mt-0.5" :class="selectedFormat === key ? 'text-indigo-400/70' : 'text-slate-500'">{{ fmt.description }}</span>
                  </button>
                </div>

                <div class="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <button @click="banVotingEnabled = !banVotingEnabled"
                          :disabled="isCreating"
                          class="relative w-12 h-6 rounded-full transition-colors shrink-0"
                          :class="banVotingEnabled ? 'bg-indigo-600' : 'bg-slate-600'">
                    <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                          :class="banVotingEnabled ? 'translate-x-6' : 'translate-x-0'"></span>
                  </button>
                  <div class="flex-1">
                    <div class="text-sm font-semibold text-white">Ban Voting System</div>
                    <div class="text-[11px] text-slate-400">Captains propose bans, players vote (simple majority)</div>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <div class="flex gap-2" :class="!isOfficialCreator ? 'opacity-50 pointer-events-none' : ''">
                    <button @click="isOfficial = false"
                            :disabled="isCreating"
                            class="flex-1 p-3 rounded-lg border-2 text-left transition-all"
                            :class="!isOfficial ? 'border-slate-500 bg-slate-800/60' : 'border-slate-700 bg-slate-900 hover:border-slate-600'">
                      <span class="block text-sm font-bold" :class="!isOfficial ? 'text-slate-200' : 'text-slate-400'">Unofficial</span>
                      <span class="block text-[10px] mt-0.5 text-slate-500">Does not count in stats</span>
                    </button>
                    <button @click="isOfficial = true"
                            :disabled="isCreating"
                            class="flex-1 p-3 rounded-lg border-2 text-left transition-all"
                            :class="isOfficial ? 'border-amber-500 bg-amber-900/20' : 'border-slate-700 bg-slate-900 hover:border-slate-600'">
                      <span class="block text-sm font-bold" :class="isOfficial ? 'text-amber-300' : 'text-slate-400'">Official</span>
                      <span class="block text-[10px] mt-0.5" :class="isOfficial ? 'text-amber-400/70' : 'text-slate-500'">Counts toward player stats</span>
                    </button>
                  </div>
                  <p v-if="!isOfficialCreator" class="text-[11px] text-slate-500 flex items-center gap-1">
                    <i class="ph ph-lock-simple"></i>
                    Only tournament creators can create official tournaments.
                  </p>
                </div>

                <button @click="createTournament"
                        :disabled="!newTournamentName || isCreating"
                        class="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2">

                  <template v-if="isCreating">
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating...</span>
                  </template>

                  <template v-else>
                    <i class="ph-bold ph-plus-circle"></i>
                    <span>Start</span>
                  </template>

                </button>
              </div>

            <div class="relative">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-700"></div></div>
              <div class="relative flex justify-center text-sm"><span class="px-2 bg-slate-800 text-slate-500 rounded">Quick Play</span></div>
            </div>
          </div>

            <div class="space-y-4">
              <div class="text-center space-y-2">
                <h2 class="text-2xl font-bold text-white">3v3v3 Quick Play</h2>
                <p class="text-sm text-slate-400">
                  Fast queue, instant teams, no tournament setup.
                </p>
              </div>

              <QuickMatchQueue
                  v-if="linkedPlayer"
                  :current-user="linkedPlayer"
              />

              <div v-else class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-200 text-center">
                Link your player profile first to use Quick Play.
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-white">Racc Open Queue</h2>
                <div class="text-sm text-slate-400">
                  {{ totalQueuedPlayers }} / 9 players
                </div>
              </div>
              <div v-if="queue && queue.status === 'open'" class="space-y-3">
                <div v-if="!isInQueue" class="space-y-3">
                  <div class="text-sm text-slate-300">
                    Join the queue to play Racc Opens instantly. Solo or with friends!
                  </div>
                  <div class="space-y-2">
                    <button @click="joinQueue"
                            :disabled="isJoiningQueue || !linkedPlayer"
                            class="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                      <template v-if="isJoiningQueue">
                        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </template>
                      <template v-else>
                        <i class="ph-bold ph-users"></i>
                        Join Solo
                      </template>
                    </button>
                    <div class="text-center text-slate-500 text-sm">or</div>
                    <div class="space-y-2">
                      <div class="text-sm text-slate-300">Create party (enter player IDs, comma-separated):</div>
                      <input v-model="partyMembersInput"
                             type="text"
                             placeholder="player1,player2"
                             class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:outline-none text-sm">
                      <button @click="joinWithParty"
                              :disabled="isJoiningQueue || !linkedPlayer || !partyMembersInput.trim()"
                              class="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                        <template v-if="isJoiningQueue">
                          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Joining...
                        </template>
                        <template v-else>
                          <i class="ph-bold ph-user-plus"></i>
                          Join with Party
                        </template>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-4">
                  <div class="text-green-400 font-semibold mb-2">You're in the queue!</div>
                  <button @click="leaveQueue"
                          :disabled="isJoiningQueue"
                          class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                    Leave Queue
                  </button>
                </div>
              </div>
              <div v-else-if="queue && queue.status === 'forming'" class="text-center py-4 text-yellow-400">
                <i class="ph-bold ph-spinner animate-spin text-2xl mb-2"></i>
                <div>Forming tournament...</div>
              </div>
              <div v-else-if="queue && queue.status === 'closed'" class="text-center py-4 text-slate-400">
                Queue closed - tournament created!
              </div>
            </div>

            <div class="relative">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-700"></div></div>
              <div class="relative flex justify-center text-sm"><span class="px-2 bg-slate-800 text-slate-500 rounded">Or join existing</span></div>
            </div>
          </div>

            <div class="space-y-4">
              <h2 class="text-2xl font-bold text-white mb-4">Join by ID</h2>
              <div class="flex gap-2">
                <input v-model="joinId" type="text" placeholder="Enter Tournament ID" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-mono">
                <button @click="joinTournament" :disabled="!joinId" class="bg-slate-700 hover:bg-slate-600 text-white px-8 rounded-lg font-bold transition-colors">
                  Join
                </button>
              </div>
            </div>

          <div v-if="scheduledTournamentsList.length > 0">
            <div class="flex items-center gap-3 mb-6">
              <div class="h-8 w-2 bg-violet-500 rounded-full"></div>
              <h2 class="text-2xl font-bold text-white">Scheduled Events</h2>
            </div>
            <div class="grid lg:grid-cols-2 gap-4">
              <div v-for="t in scheduledTournamentsList" :key="t.id"
                   @click="selectTournamentFromHome(t.id)"
                   class="group relative bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-violet-500/50 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col h-full">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex items-center gap-1.5 text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/30 px-2 py-1 rounded-md">
                    <i class="ph-bold ph-calendar-check"></i>
                    {{ formatScheduledTime(t.scheduledTime!) }}
                  </div>
                  <div :class="`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(t.status)}`">
                    {{ t.status }}
                  </div>
                </div>
                <h3 class="text-xl font-bold text-white mb-auto group-hover:text-violet-400 transition-colors line-clamp-2">
                  {{ t.name }}
                </h3>
                <div class="flex flex-col gap-1 text-sm text-slate-400 mt-6 pt-4 border-t border-slate-700/50">
                  <div class="flex items-center gap-2"><i class="ph-fill ph-users"></i> {{ Object.keys(t.players || {}).length }} Players</div>
                  <div class="flex items-center gap-2"><i class="ph-fill ph-tree-structure"></i> {{ t.format ? TOURNAMENT_FORMATS[t.format]?.name || 'Blind Pick' : 'Blind Pick' }}</div>
                  <div class="flex items-center gap-2" :class="t.isOfficial ? 'text-amber-400' : 'text-slate-500'">
                    <i :class="t.isOfficial ? 'ph-fill ph-seal-check' : 'ph ph-seal'"></i>
                    {{ t.isOfficial ? 'Official' : 'Unofficial' }}
                  </div>
                  <div class="flex items-center gap-2 mt-1 text-xs text-slate-600">ID: <span class="font-mono text-slate-500">{{ t.id }}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center gap-3 mb-6">
              <div class="h-8 w-2 bg-indigo-500 rounded-full"></div>
              <h2 class="text-2xl font-bold text-white">Ongoing Events</h2>
            </div>

            <div v-if="homeListLoading" class="text-center py-12">
              <i class="ph ph-spinner animate-spin text-4xl text-indigo-500"></i>
            </div>

            <div v-else-if="activeTournamentsList.length === 0" class="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No active tournaments found. Start one above!
            </div>

            <div v-else class="grid lg:grid-cols-2 gap-4">
              <div v-for="t in activeTournamentsList" :key="t.id"
                   @click="selectTournamentFromHome(t.id)"
                   class="group relative bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/10 flex flex-col h-full">

                <div class="flex justify-between items-start mb-3">
                  <div class="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <i class="ph-bold ph-calendar-blank"></i>
                    {{ new Date(t.createdAt).toLocaleDateString() }}
                  </div>

                  <div :class="`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(t.status)}`">
                    {{ t.status }}
                  </div>
                </div>

                <h3 class="text-xl font-bold text-white mb-auto group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {{ t.name }}
                </h3>

                <div class="flex flex-col gap-1 text-sm text-slate-400 mt-6 pt-4 border-t border-slate-700/50">
                  <div class="flex items-center gap-2">
                    <i class="ph-fill ph-users"></i> {{ Object.keys(t.players || {}).length }} Players
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="ph-fill ph-tree-structure"></i> {{ t.format ? TOURNAMENT_FORMATS[t.format]?.name || 'Blind Pick' : 'Blind Pick' }}
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="ph-fill ph-trophy"></i> {{ formatTournamentStatus(t) }}
                  </div>
                  <div class="flex items-center gap-2" :class="t.isOfficial ? 'text-amber-400' : 'text-slate-500'">
                    <i :class="t.isOfficial ? 'ph-fill ph-seal-check' : 'ph ph-seal'"></i>
                    {{ t.isOfficial ? 'Official' : 'Unofficial' }}
                  </div>
                  <div class="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    ID: <span class="font-mono text-slate-500">{{ t.id }}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div class="border-t border-slate-800 pt-8 pb-12">
            <button
                @click="showHistory = !showHistory"
                class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mx-auto px-4 py-2 hover:bg-slate-800 rounded-lg"
            >
              <span>{{ showHistory ? 'Hide' : 'Show' }} Past Tournaments</span>
              <i class="ph-bold ph-caret-down transition-transform duration-300" :class="{ 'rotate-180': showHistory }"></i>
            </button>

            <div v-if="showHistory" class="mt-8 space-y-8 animate-fade-in-down">

              <div v-if="groupedPastTournaments.length === 0" class="text-center text-slate-600 py-4">
                No seasons found.
              </div>

              <div v-for="group in groupedPastTournaments" :key="group.seasonId" class="mb-6">

                <div
                    @click="toggleSeasonGroup(group.seasonId)"
                    class="flex items-center justify-between cursor-pointer group/season mb-4 px-2 py-1.5 -mx-2 hover:bg-slate-800/50 rounded-lg transition-colors select-none"
                >
                  <div class="flex items-center gap-3">
                    <div class="h-5 w-1.5 bg-slate-600 rounded-full group-hover/season:bg-indigo-500 transition-colors"></div>
                    <h3 class="text-lg font-bold text-slate-300 group-hover/season:text-white transition-colors">
                      {{ group.seasonName }}
                    </h3>
                    <span v-if="group.loaded" class="text-xs text-slate-500 font-mono">({{ group.tournaments.length }})</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <i v-if="group.loading" class="ph ph-spinner animate-spin text-slate-500 text-sm"></i>
                    <i v-else class="ph-bold ph-caret-down text-slate-500 group-hover/season:text-slate-300 transition-transform duration-300"
                       :class="{ '-rotate-90': collapsedSeasons.includes(group.seasonId) }"></i>
                  </div>
                </div>

                <div v-show="!collapsedSeasons.includes(group.seasonId)">

                  <!-- Loading state for this season -->
                  <div v-if="group.loading" class="flex items-center justify-center py-8 text-slate-500 gap-2">
                    <i class="ph ph-spinner animate-spin"></i>
                    <span class="text-sm">Loading...</span>
                  </div>

                  <!-- Empty state after load -->
                  <div v-else-if="group.loaded && group.tournaments.length === 0"
                       class="text-center text-slate-600 py-6 text-sm border border-dashed border-slate-800 rounded-xl">
                    No completed tournaments in this season.
                  </div>

                  <!-- Tournament list -->
                  <div v-else-if="group.loaded" class="grid md:grid-cols-2 gap-3">
                    <div v-for="t in group.tournaments" :key="t.id"
                         @click="selectTournamentFromHome(t.id)"
                         class="flex items-center justify-between bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-lg p-4 cursor-pointer transition-colors">
                      <div>
                        <h4 class="font-bold text-slate-300">{{ t.name }}</h4>
                        <p class="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span>{{ new Date(t.createdAt).toLocaleDateString() }}</span>
                          <span class="text-slate-600">•</span>
                          <span class="font-mono text-[10px] text-slate-600 tracking-wider">{{ t.id }}</span>
                        </p>
                      </div>
                      <div class="flex flex-col items-end gap-1 flex-shrink-0">
                        <span class="text-[10px] uppercase font-bold bg-slate-800 text-slate-500 px-2 py-1 rounded border border-slate-700">Completed</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1"
                              :class="t.isOfficial ? 'text-amber-400 border-amber-500/30 bg-amber-900/20' : 'text-slate-500 border-slate-700 bg-slate-800'">
                          <i :class="t.isOfficial ? 'ph-fill ph-seal-check' : 'ph ph-seal'"></i>
                          {{ t.isOfficial ? 'Official' : 'Unofficial' }}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>
