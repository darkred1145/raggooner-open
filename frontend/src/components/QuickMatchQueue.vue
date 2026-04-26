<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useAuth } from '../composables/useAuth';
import type { GlobalPlayer } from '../types';

const VERCEL_API_URL = import.meta.env.VITE_DISCORD_OAUTH_URL || 'https://raggooner-discord-oauth.vercel.app';
const QUEUE_SIZE = 9;

type QueueStatus = 'idle' | 'searching' | 'match_found';
type MatchResult = { teamA: GlobalPlayer[]; teamB: GlobalPlayer[]; teamC: GlobalPlayer[] };
type QueueAction = 'join' | 'leave' | 'status' | 'clear_match';

const props = defineProps<{
  currentUser: GlobalPlayer;
}>();

const { user } = useAuth();

const queueStatus = ref<QueueStatus>('idle');
const queuedCount = ref(0);
const matchResult = ref<MatchResult | null>(null);
const errorMessage = ref('');
const isBusy = ref(false);

let pollInterval: number | null = null;

const progressPercent = computed(() => Math.min(100, Math.round((queuedCount.value / QUEUE_SIZE) * 100)));

onUnmounted(() => {
  stopPolling();

  if (queueStatus.value === 'searching') {
    void pingBackend('leave');
  }
});

const pingBackend = async (action: QueueAction) => {
  try {
    const res = await fetch(`${VERCEL_API_URL}/api/matchmaking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        authToken: user.value?.uid,
        discordId: props.currentUser.discordId,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || 'Unable to reach matchmaking right now.');
    }

    return data;
  } catch (error) {
    console.error('Queue API Error:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Unable to reach matchmaking right now.';
    return null;
  }
};

const applyQueuePayload = (data: { status?: string; queuedCount?: number; matchResult?: MatchResult | null } | null) => {
  if (!data) return false;

  queuedCount.value = data.queuedCount ?? 0;

  if (data.status === 'match_found' && data.matchResult) {
    matchResult.value = data.matchResult;
    queueStatus.value = 'match_found';
    stopPolling();
    return true;
  }

  return false;
};

const startPolling = () => {
  if (pollInterval) return;

  pollInterval = window.setInterval(async () => {
    if (queueStatus.value !== 'searching') {
      stopPolling();
      return;
    }

    await checkQueueStatus();
  }, 3000);
};

const stopPolling = () => {
  if (pollInterval !== null) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

const checkQueueStatus = async () => {
  const data = await pingBackend('status');
  applyQueuePayload(data);
};

const joinQueue = async () => {
  if (isBusy.value || queueStatus.value === 'searching') return;

  isBusy.value = true;
  errorMessage.value = '';
  matchResult.value = null;
  queueStatus.value = 'searching';

  const data = await pingBackend('join');

  if (!data) {
    queueStatus.value = 'idle';
    isBusy.value = false;
    return;
  }

  if (!applyQueuePayload(data)) {
    startPolling();
  }

  isBusy.value = false;
};

const leaveQueue = async () => {
  if (isBusy.value && queueStatus.value !== 'searching') return;

  isBusy.value = true;
  errorMessage.value = '';
  queueStatus.value = 'idle';
  queuedCount.value = 0;
  stopPolling();
  await pingBackend('leave');
  isBusy.value = false;
};

const resetMatch = async () => {
  errorMessage.value = '';
  matchResult.value = null;
  queueStatus.value = 'idle';
  await pingBackend('clear_match');
};
</script>

<template>
  <div class="bg-slate-800 border border-indigo-500/30 rounded-xl p-6 text-center max-w-md mx-auto shadow-2xl">
    <div class="mb-6">
      <i class="ph-fill ph-sword text-indigo-400 text-5xl mb-2"></i>
      <h2 class="text-2xl font-black text-white uppercase tracking-wider">3v3v3 Quick Play</h2>
      <p class="text-sm text-slate-400 mt-1">Jump instantly into a match without a tournament.</p>
    </div>

    <div v-if="errorMessage" class="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
      {{ errorMessage }}
    </div>

    <div v-if="queueStatus === 'idle'">
      <button
        @click="joinQueue"
        :disabled="isBusy"
        class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 text-lg"
      >
        <i :class="isBusy ? 'ph-bold ph-spinner animate-spin' : 'ph-bold ph-play'"></i>
        {{ isBusy ? 'Joining Queue...' : 'Find Match' }}
      </button>
    </div>

    <div v-else-if="queueStatus === 'searching'" class="space-y-4">
      <div class="text-indigo-400 font-bold flex items-center justify-center gap-2 animate-pulse">
        <i class="ph-bold ph-spinner animate-spin text-xl"></i> Searching for players...
      </div>

      <div class="bg-slate-900 rounded-lg p-4 font-mono text-xl text-white border border-slate-700">
        <span :class="queuedCount >= QUEUE_SIZE ? 'text-emerald-400' : 'text-amber-400'">{{ queuedCount }}</span> / {{ QUEUE_SIZE }} Players
      </div>

      <div class="h-2 overflow-hidden rounded-full bg-slate-900 border border-slate-700">
        <div class="h-full bg-indigo-500 transition-all duration-300" :style="{ width: `${progressPercent}%` }"></div>
      </div>

      <p class="text-xs text-slate-400">The queue checks every 3 seconds and will keep your spot until you cancel.</p>

      <button
        @click="leaveQueue"
        :disabled="isBusy"
        class="w-full border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 disabled:opacity-60 disabled:cursor-not-allowed font-bold py-3 rounded-lg transition-all"
      >
        Cancel Search
      </button>
    </div>

    <div v-else-if="queueStatus === 'match_found' && matchResult" class="space-y-4 text-left">
      <div class="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-center font-bold mb-4">
        Match Found!
      </div>

      <div v-for="(team, teamName) in matchResult" :key="teamName" class="bg-slate-900 p-3 rounded border border-slate-700">
        <div class="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Team {{ teamName.replace('team', '') }}</div>
        <div class="flex flex-col gap-1.5">
          <div v-for="player in team" :key="player.id" class="text-sm font-medium text-slate-200 flex items-center gap-2">
            <i class="ph-fill ph-user text-slate-600"></i> {{ player.name || 'Player' }}
          </div>
        </div>
      </div>

      <button
        @click="resetMatch"
        class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all mt-4"
      >
        Return to Lobby
      </button>
    </div>
  </div>
</template>
