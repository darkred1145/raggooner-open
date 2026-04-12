<script setup lang="ts">
import { toRef, ref, computed, onMounted, onUnmounted } from 'vue';
import type { Tournament, FirestoreUpdate } from '../types';
import { usePlayerDraft } from '../composables/usePlayerDraft';
import { useGameLogic } from '../composables/useGameLogic';
import { useTournamentFlow } from '../composables/useTournamentFlow';
import { useBanVoting } from '../composables/useBanVoting';
import { voicelineVolume, playLocalSfx } from '../composables/useVoicelines';
import { getPlayerName } from '../utils/utils';
import { UMA_DICT } from '../utils/umaData';
import { TRACK_DICT } from '../utils/trackData';
import UmaCard from './UmaCard.vue';

const props = defineProps<{
  tournament: Tournament;
  isAdmin: boolean;
  secureUpdate: (data: FirestoreUpdate<Tournament> | Record<string, any>) => Promise<void>;
}>();

const tournamentRef = toRef(props, 'tournament');
const isAdminRef = toRef(props, 'isAdmin');

// Initialize Draft (for Undo)
const { undoLastPick, currentDrafter } = usePlayerDraft(tournamentRef, props.secureUpdate, isAdminRef);

// Initialize Game Logic (for Banning)
const { toggleBan, isBanned } = useGameLogic(tournamentRef, props.secureUpdate);

// Initialize Tournament Flow (for phase transitions)
const { advancePhase, isAdvancing: isAdvancingPhase } = useTournamentFlow(tournamentRef, props.secureUpdate);

// Initialize Ban Voting
const {
  isCaptain,
  hasCaptainProposed,
  captainProposedUma,
  proposedBans,
  banPhaseStatus,
  hasPlayerVoted,
  getPlayerVote,
  captainProposeBan,
  playerVoteOnBan,
} = useBanVoting(tournamentRef);

// Local State for Search
const banSearch = ref('');

// Computed for Search
const filteredUmas = computed(() => {
  const query = banSearch.value.toLowerCase();
  return Object.keys(UMA_DICT).sort().filter(u => u.toLowerCase().includes(query));
});

const selectedTrackData = computed(() => {
  if (!props.tournament.selectedTrack) return null;
  return TRACK_DICT[props.tournament.selectedTrack] || null;
});

// Determine if we're using voting mode
const isVotingMode = computed(() => {
  return props.tournament.banVotingEnabled === true;
});

// Check if captain can still propose (captain who hasn't voted yet)
const canCaptainPropose = computed(() => {
  return isCaptain.value && !hasCaptainProposed.value && banPhaseStatus.value === 'captain-voting';
});

// Selected uma for captain proposal
const selectedUmaForProposal = ref<string | null>(null);

// --- Debug / Test Panel ---
const showDebugPanel = ref(false);
const debugSimulateProposalCaptain = ref<string>('');
const debugSimulateVoteUma = ref<string>('');
const debugSimulateVotePlayer = ref<string>('');
const debugSimulateVoteYes = ref<boolean>(true);

// Get captains who haven't proposed yet
const unproposedCaptains = computed(() => {
  if (!props.tournament) return [];
  const proposals = props.tournament.captainBanProposals ?? {};
  return props.tournament.teams
    .map((t: any) => ({ captainId: t.captainId, name: getPlayerName(props.tournament, t.captainId), color: t.color }))
    .filter((c: any) => !proposals[c.captainId]);
});

// Simulate a captain proposal (admin debug)
const simulateCaptainProposal = async () => {
  const captainId = debugSimulateProposalCaptain.value;
  if (!captainId) return;
  const umaOptions = Object.keys(UMA_DICT).filter((u) => !props.tournament?.bans?.includes(u));
  const uma = umaOptions[Math.floor(Math.random() * umaOptions.length)];
  if (!uma) return;

  const currentProposals = props.tournament?.captainBanProposals ?? {};
  const updated = { ...currentProposals, [captainId]: uma };
  const captainIds = props.tournament!.teams.map((t: any) => t.captainId);
  const allDone = captainIds.every((cid: string) => updated[cid]);
  const update: Record<string, any> = { captainBanProposals: updated };
  if (allDone) update.banPhaseStatus = 'player-voting';
  await props.secureUpdate(update);
};

// Simulate a player vote (admin debug)
const simulatePlayerVote = async () => {
  const umaId = debugSimulateVoteUma.value;
  const playerId = debugSimulateVotePlayer.value;
  if (!umaId || !playerId) return;

  const votes = props.tournament?.banVotes ?? {};
  const umaVotes = votes[umaId] ?? {};
  const updatedUmaVotes = { ...umaVotes, [playerId]: debugSimulateVoteYes.value };
  const updatedVotes = { ...votes, [umaId]: updatedUmaVotes };

  const playerIds = props.tournament?.playerIds ?? [];
  const totalVoters = playerIds.length;
  const yesVotes = Object.values(updatedUmaVotes).filter((v) => v === true).length;
  const threshold = props.tournament?.banVoteThreshold ?? 0.5;
  const banPassed = totalVoters > 0 && yesVotes / totalVoters > threshold;
  const allVoted = totalVoters > 0 && playerIds.every((pid: string) => updatedUmaVotes[pid] !== undefined);

  const update: Record<string, any> = { banVotes: updatedVotes };
  if (banPassed || allVoted) {
    if (banPassed) {
      const currentBans = props.tournament?.bans ?? [];
      if (!currentBans.includes(umaId)) update.bans = [...currentBans, umaId];
    }
    const proposals = props.tournament?.captainBanProposals ?? {};
    const proposedUmas = Object.values(proposals) as string[];
    const allResolved = proposedUmas.every((proposedUma: string) => {
      const v = votes[proposedUma] ?? {};
      if (proposedUma === umaId) return true;
      return playerIds.every((pid: string) => v[pid] !== undefined);
    });
    if (allResolved) update.banPhaseStatus = 'resolved';
  }
  await props.secureUpdate(update);
};

// Mass vote for all players on a selected uma
const massVote = async (vote: boolean) => {
  const umaId = debugSimulateVoteUma.value;
  if (!umaId) return;
  const playerIds = props.tournament?.playerIds ?? [];
  const votes = props.tournament?.banVotes ?? {};
  const umaVotes = votes[umaId] ?? {};
  const updatedUmaVotes = { ...umaVotes };
  playerIds.forEach((pid: string) => { updatedUmaVotes[pid] = vote; });
  const updatedVotes = { ...votes, [umaId]: updatedUmaVotes };

  const totalVoters = playerIds.length;
  const yesVotes = Object.values(updatedUmaVotes).filter((v) => v === true).length;
  const threshold = props.tournament?.banVoteThreshold ?? 0.5;
  const banPassed = totalVoters > 0 && yesVotes / totalVoters > threshold;
  const allVoted = totalVoters > 0 && playerIds.every((pid: string) => updatedUmaVotes[pid] !== undefined);

  const update: Record<string, any> = { banVotes: updatedVotes };
  if (banPassed || allVoted) {
    if (banPassed) {
      const currentBans = props.tournament?.bans ?? [];
      if (!currentBans.includes(umaId)) update.bans = [...currentBans, umaId];
    }
    const proposals = props.tournament?.captainBanProposals ?? {};
    const proposedUmas = Object.values(proposals) as string[];
    const allResolved = proposedUmas.every((proposedUma: string) => {
      const v = votes[proposedUma] ?? {};
      if (proposedUma === umaId) return true;
      return playerIds.every((pid: string) => v[pid] !== undefined);
    });
    if (allResolved) update.banPhaseStatus = 'resolved';
  }
  await props.secureUpdate(update);
};

// Reset ban voting state for re-testing
const resetBanVoting = async () => {
  await props.secureUpdate({
    captainBanProposals: null,
    banVotes: null,
    banPhaseStatus: 'captain-voting',
    bans: [],
  });
};

// --- TIMER LOGIC ---
const now = ref(Date.now());
let timerInterval: number | null = null;

// Action: Start the Timer (Admin Only)
const startBanTimer = async () => {
  await props.secureUpdate({ banTimerStart: new Date().toISOString() });
};

onMounted(() => {
  // 1. Start the local ticking for UI updates
  timerInterval = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

// Calculate Elapsed Time
const elapsedSeconds = computed(() => {
  if (!props.tournament.banTimerStart) return 0;
  const start = new Date(props.tournament.banTimerStart).getTime();
  return Math.floor((now.value - start) / 1000);
});

// Format as MM:SS
const formattedTime = computed(() => {
  const total = elapsedSeconds.value;
  // Prevent negative numbers if client clock is slightly off server time
  if (total < 0) return "00:00";
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

// Action: Reset Timer (Optional, if they messed up)
const resetBanTimer = async () => {
  await props.secureUpdate({ banTimerStart: null });
};

// Captain proposes a ban
const handleCaptainPropose = async () => {
  if (!selectedUmaForProposal.value) return;
  await captainProposeBan(selectedUmaForProposal.value);
  selectedUmaForProposal.value = null;
};

// Player votes on a ban
const handlePlayerVote = async (umaId: string, vote: boolean) => {
  await playerVoteOnBan(umaId, vote);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Timer Display -->
    <div class="flex flex-col items-center justify-center py-8">

      <div v-if="tournament.banTimerStart || isAdminRef" class="text-center relative group">

        <div class="text-8xl md:text-9xl font-black font-mono tracking-widest tabular-nums leading-none transition-colors duration-500"
             :class="{
            'text-white': elapsedSeconds < 180,
            'text-amber-400': elapsedSeconds >= 180 && elapsedSeconds < 300,
            'text-red-500 animate-pulse': elapsedSeconds >= 300
         }">
          {{ formattedTime }}
        </div>

        <button v-if="isAdminRef"
                @click="tournament.banTimerStart ? resetBanTimer() : startBanTimer()"
                :title="tournament.banTimerStart ? 'Reset Timer' : 'Start Timer'"
                class="absolute -right-16 top-1/2 -translate-y-1/2 p-2 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                :class="tournament.banTimerStart ? 'text-slate-600 hover:text-red-400' : 'text-slate-600 hover:text-emerald-400'">

          <i class="ph-bold text-3xl"
             :class="tournament.banTimerStart ? 'ph-arrow-counter-clockwise' : 'ph-play-circle'"></i>

        </button>
      </div>

      <div v-else class="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl">
        <h3 class="text-xl font-bold text-slate-500 animate-pulse">Waiting for Uma Ban...</h3>
      </div>

    </div>

    <!-- Header Bar -->
    <div class="sticky top-20 z-30 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
      <div>
        <h2 class="text-3xl font-bold text-white flex items-center gap-3">
          <i class="ph-fill ph-prohibit text-red-500"></i>
          Uma Ban
          <span v-if="isVotingMode" class="text-sm font-normal px-3 py-1 rounded-full bg-indigo-600/50 border border-indigo-400/30">
            Voting Mode
          </span>
        </h2>
        <p v-if="!isVotingMode" class="text-slate-400 text-sm">Select Umas to exclude from the tournament.</p>
        <p v-else-if="banPhaseStatus === 'captain-voting'" class="text-slate-400 text-sm">
          Captains: Propose your ban. Players will vote afterwards.
        </p>
        <p v-else-if="banPhaseStatus === 'player-voting'" class="text-slate-400 text-sm">
          Vote on proposed bans. Majority decides.
        </p>
        <p v-else-if="banPhaseStatus === 'resolved'" class="text-emerald-400 text-sm">
          Ban phase resolved. Ready to advance.
        </p>
      </div>

      <!-- Admin: Toggle voting mode -->
      <div v-if="isAdmin && !isVotingMode" class="flex items-center gap-2">
        <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" :checked="tournament.banVotingEnabled"
                 @change="props.secureUpdate({ banVotingEnabled: !tournament.banVotingEnabled, banPhaseStatus: 'captain-voting' })"
                 class="accent-indigo-500" />
          <span>Enable Ban Voting</span>
        </label>
      </div>

      <div class="flex items-center gap-4 w-full sm:w-auto">
        <button v-if="isAdmin && (!tournament.bans || tournament.bans.length === 0) && !isVotingMode"
                @click="undoLastPick"
                class="text-slate-500 hover:text-white flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-800 transition-colors mr-2">
          <i class="ph-bold ph-arrow-u-up-left"></i>
          <span class="sm:inline">Back to Player Draft</span>
        </button>

        <div class="flex items-center gap-1.5 text-slate-500 mr-2">
          <i class="ph-bold text-lg shrink-0"
             :class="voicelineVolume === 0 ? 'ph-speaker-x' : voicelineVolume < 0.5 ? 'ph-speaker-low' : 'ph-speaker-high'"></i>
          <input type="range" min="0" max="1" step="0.05" v-model.number="voicelineVolume"
                 class="w-20 accent-indigo-500 cursor-pointer" />
        </div>

        <div class="text-right hidden sm:block">
          <div class="text-2xl font-mono font-bold text-red-400">
            {{ tournament.bans?.length || 0 }}
          </div>
          <div class="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Banned</div>
        </div>

        <button @click="advancePhase"
                :disabled="!isAdmin || isAdvancingPhase"
                class="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2">
          <template v-if="isAdvancingPhase">
            <i class="ph ph-spinner animate-spin"></i> Advancing...
          </template>
          <template v-else>
            <span>Continue</span>
            <i class="ph-bold ph-arrow-right"></i>
          </template>
        </button>
      </div>
    </div>

    <!-- Admin Debug / Test Panel -->
    <div v-if="isAdmin && isVotingMode" class="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
      <button @click="showDebugPanel = !showDebugPanel"
              class="text-sm font-semibold text-slate-300 hover:text-white flex items-center gap-2">
        <i :class="showDebugPanel ? 'ph-bold ph-caret-down' : 'ph-bold ph-caret-right'"></i>
        Test Panel (simulate proposals &amp; votes)
      </button>

      <div v-if="showDebugPanel" class="mt-4 space-y-4">
        <div class="flex gap-2">
          <button @click="resetBanVoting" class="text-xs bg-red-600/20 text-red-400 px-3 py-1.5 rounded hover:bg-red-600/30">
            <i class="ph-bold ph-arrow-counter-clockwise mr-1"></i> Reset All Voting
          </button>
        </div>

        <!-- Simulate Captain Proposal -->
        <div v-if="banPhaseStatus === 'captain-voting'" class="space-y-2">
          <h4 class="text-sm font-semibold text-amber-400">Simulate Captain Proposals</h4>
          <div v-for="cap in unproposedCaptains" :key="cap.captainId" class="flex items-center gap-3">
            <span class="text-sm text-slate-300" :style="{ color: cap.color }">{{ cap.name }}</span>
            <button @click="debugSimulateProposalCaptain = cap.captainId; simulateCaptainProposal()"
                    class="text-xs bg-amber-600/30 text-amber-300 px-3 py-1.5 rounded hover:bg-amber-600/50">
              <i class="ph-bold ph-play mr-1"></i>Propose (random uma)
            </button>
          </div>
          <div v-if="unproposedCaptains.length === 0" class="text-xs text-slate-500">All captains have proposed!</div>
        </div>

        <!-- Simulate Player Vote -->
        <div v-if="banPhaseStatus === 'player-voting'" class="space-y-2">
          <h4 class="text-sm font-semibold text-indigo-400">Simulate Player Votes</h4>
          <div class="flex flex-wrap gap-2 items-center">
            <span class="text-xs text-slate-400">Uma:</span>
            <select v-model="debugSimulateVoteUma" class="bg-slate-800 text-white text-sm px-2 py-1 rounded border border-slate-600">
              <option value="">-- select --</option>
              <option v-for="ban in proposedBans" :key="ban.umaId" :value="ban.umaId">{{ ban.umaId }}</option>
            </select>
            <span class="text-xs text-slate-400">Player:</span>
            <select v-model="debugSimulateVotePlayer" class="bg-slate-800 text-white text-sm px-2 py-1 rounded border border-slate-600">
              <option value="">-- select --</option>
              <option v-for="pid in tournament.playerIds" :key="pid" :value="pid">{{ getPlayerName(tournament, pid) }}</option>
            </select>
            <button @click="debugSimulateVoteYes = true; simulatePlayerVote()"
                    :disabled="!debugSimulateVoteUma || !debugSimulateVotePlayer"
                    class="text-xs bg-emerald-600/30 text-emerald-300 px-3 py-1.5 rounded hover:bg-emerald-600/50 disabled:opacity-40">
              <i class="ph-bold ph-thumbs-up mr-1"></i>Yes
            </button>
            <button @click="debugSimulateVoteYes = false; simulatePlayerVote()"
                    :disabled="!debugSimulateVoteUma || !debugSimulateVotePlayer"
                    class="text-xs bg-slate-600/30 text-slate-300 px-3 py-1.5 rounded hover:bg-slate-600/50 disabled:opacity-40">
              <i class="ph-bold ph-thumbs-down mr-1"></i>No
            </button>
          </div>
          <!-- Mass vote buttons -->
          <div class="flex gap-2 flex-wrap">
            <button @click="massVote(true)"
                    class="text-xs bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded hover:bg-emerald-600/40">
              Vote YES for all players on selected uma
            </button>
            <button @click="massVote(false)"
                    class="text-xs bg-slate-600/20 text-slate-400 px-3 py-1 rounded hover:bg-slate-600/40">
              Vote NO for all players on selected uma
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Voting Mode UI -->
    <template v-if="isVotingMode">
      <!-- Captain Proposal Phase -->
      <div v-if="banPhaseStatus === 'captain-voting'" class="space-y-6">
        <!-- Captain Proposal Panel -->
        <div v-if="canCaptainPropose" class="bg-slate-800/50 border border-amber-500/50 rounded-xl p-6">
          <h3 class="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
            <i class="ph-fill ph-crown"></i>
            Your Turn to Propose a Ban
          </h3>
          <p class="text-slate-400 mb-4">Select an uma from the grid below and confirm your ban proposal.</p>

          <div v-if="selectedUmaForProposal" class="bg-slate-900/50 rounded-lg p-4 mb-4">
            <p class="text-white font-semibold">Selected: {{ selectedUmaForProposal }}</p>
            <div class="flex gap-3 mt-3">
              <button @click="handleCaptainPropose"
                      class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                <i class="ph-bold ph-prohibit"></i> Confirm Ban Proposal
              </button>
              <button @click="selectedUmaForProposal = null"
                      class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
          <p v-else class="text-slate-500 italic">Click on an uma below to select your ban proposal.</p>
        </div>

        <div v-else-if="hasCaptainProposed" class="bg-slate-800/50 border border-emerald-500/50 rounded-xl p-6">
          <h3 class="text-xl font-bold text-emerald-400 mb-2 flex items-center gap-2">
            <i class="ph-fill ph-check-circle"></i>
            Ban Proposed
          </h3>
          <p class="text-slate-300">You proposed: <span class="font-semibold text-white">{{ captainProposedUma }}</span></p>
          <p class="text-slate-500 text-sm mt-2">Waiting for other captains to propose...</p>
        </div>
      </div>

      <!-- Player Voting Phase -->
      <div v-else-if="banPhaseStatus === 'player-voting'" class="space-y-6">
        <div class="bg-indigo-900/30 border border-indigo-500/50 rounded-xl p-4">
          <h3 class="text-lg font-bold text-indigo-300 flex items-center gap-2">
            <i class="ph-fill ph-ballot"></i>
            Player Voting Phase
          </h3>
          <p class="text-slate-400 text-sm">Vote Yes or No on each proposed ban. Majority decides.</p>
        </div>

        <!-- Proposed Bans with Voting -->
        <div v-for="ban in proposedBans" :key="ban.umaId"
             class="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="text-xl font-bold text-white">{{ ban.umaId }}</h4>
              <p class="text-slate-500 text-sm">Proposed by Captain</p>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="ban.banPassed" class="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                <i class="ph-fill ph-prohibit"></i> PASSED
              </span>
              <span v-else-if="ban.allVoted" class="bg-slate-600/20 text-slate-400 px-3 py-1 rounded-full text-sm font-bold">
                REJECTED
              </span>
            </div>
          </div>

          <!-- Vote Progress Bar -->
          <div class="mb-4">
            <div class="flex justify-between text-sm text-slate-400 mb-2">
              <span class="text-emerald-400">{{ ban.yesVotes }} Yes</span>
              <span class="text-red-400">{{ ban.noVotes }} No</span>
              <span>{{ ban.totalVotes }} / {{ ban.totalVoters }}</span>
            </div>
            <div class="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                   :style="{ width: `${(ban.yesVotes / ban.totalVoters) * 100}%` }"></div>
            </div>
          </div>

          <!-- Vote Buttons -->
          <div v-if="!hasPlayerVoted(ban.umaId) && !ban.banPassed && !ban.allVoted" class="flex gap-3">
            <button @click="handlePlayerVote(ban.umaId, true)"
                    class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors">
              <i class="ph-bold ph-check"></i> Yes, Ban
            </button>
            <button @click="handlePlayerVote(ban.umaId, false)"
                    class="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-bold transition-colors">
              <i class="ph-bold ph-x"></i> No, Skip
            </button>
          </div>
          <div v-else class="text-center text-slate-500 py-2">
            <span v-if="hasPlayerVoted(ban.umaId)">
              Your vote: <span class="font-semibold" :class="getPlayerVote(ban.umaId) ? 'text-emerald-400' : 'text-red-400'">
                {{ getPlayerVote(ban.umaId) ? 'Yes' : 'No' }}
              </span>
            </span>
            <span v-else-if="ban.banPassed">Ban approved by majority</span>
            <span v-else>Voting complete</span>
          </div>
        </div>

        <div v-if="proposedBans.length === 0" class="text-center py-12 text-slate-500">
          <i class="ph ph-clock text-4xl mb-3"></i>
          <p>Waiting for captains to propose bans...</p>
        </div>
      </div>

      <!-- Resolved Phase -->
      <div v-else-if="banPhaseStatus === 'resolved'" class="space-y-4">
        <div class="bg-emerald-900/30 border border-emerald-500/50 rounded-xl p-6 text-center">
          <i class="ph-fill ph-check-circle text-5xl text-emerald-400 mb-3"></i>
          <h3 class="text-2xl font-bold text-emerald-400 mb-2">Ban Phase Resolved</h3>
          <p class="text-slate-400">All votes have been counted. Final bans:</p>
          <div v-if="tournament.bans && tournament.bans.length > 0" class="mt-4 space-y-2">
            <div v-for="ban in tournament.bans" :key="ban" class="bg-red-900/30 text-red-400 px-4 py-2 rounded-lg font-semibold">
              <i class="ph-fill ph-prohibit"></i> {{ ban }}
            </div>
          </div>
          <p v-else class="text-slate-500 mt-2">No bans were approved.</p>
        </div>
      </div>

      <!-- Uma Grid for Captain Selection -->
      <div v-if="canCaptainPropose" class="relative">
        <i class="ph-bold ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl"></i>
        <input v-model="banSearch"
               type="text"
               placeholder="Search Umas..."
               class="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm">
      </div>

      <div v-if="canCaptainPropose" class="grid md:grid-cols-12 gap-6">
        <div class="md:col-span-8">
          <div v-if="filteredUmas.length === 0" class="text-center py-12 text-slate-500">
            No Umas found matching "{{ banSearch }}"
          </div>
          <div v-else class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            <UmaCard v-for="uma in filteredUmas" :key="uma"
                     :uma-name="uma"
                     :is-banned="isBanned(uma)"
                     :disabled="!canCaptainPropose"
                     action-type="ban"
                     :surface-aptitude="selectedTrackData?.surface"
                     :distance-aptitude="selectedTrackData?.distanceType"
                     @click="canCaptainPropose && (selectedUmaForProposal = uma)"
                     @mouseenter="canCaptainPropose && playLocalSfx('/assets/sound-effects/sfx-button-hover.mp3')" />
          </div>
        </div>

        <div class="md:col-span-4 space-y-4">
          <h3 class="text-lg font-bold mb-3 text-slate-300">Squads</h3>
          <div v-for="team in tournament.teams" :key="team.id"
               class="bg-slate-900 border rounded-lg p-4 transition-colors"
               :class="currentDrafter?.id === team.captainId ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-800'">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-white" :style="{ color: team.color }">{{ team.name }}</span>
              <i v-if="currentDrafter?.id === team.captainId" class="ph-fill ph-pencil-simple text-amber-500 animate-pulse"></i>
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-amber-400">
                <i class="ph-fill ph-crown"></i> {{ getPlayerName(tournament, team.captainId) }}
              </div>
              <div v-for="memberId in team.memberIds" :key="memberId" class="flex items-center gap-2 text-sm text-slate-300">
                <i class="ph-fill ph-user"></i> {{ getPlayerName(tournament, memberId) }}
              </div>
              <div v-for="n in (2 - team.memberIds.length)" :key="n" class="flex items-center gap-2 text-sm text-slate-700 border-dashed border border-slate-800 p-1 rounded">
                <span class="text-xs">Empty Slot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Classic Admin Mode UI (Non-Voting) -->
    <template v-else>
      <div class="relative">
        <i class="ph-bold ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl"></i>
        <input v-model="banSearch"
               type="text"
               placeholder="Search Umas..."
               class="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm">
      </div>

      <div class="grid md:grid-cols-12 gap-6">
        <div class="md:col-span-8">
          <div v-if="filteredUmas.length === 0" class="text-center py-12 text-slate-500">
            No Umas found matching "{{ banSearch }}"
          </div>
          <div v-else class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            <UmaCard v-for="uma in filteredUmas" :key="uma"
                     :uma-name="uma"
                     :is-banned="isBanned(uma)"
                     :disabled="!isAdmin"
                     action-type="ban"
                     :surface-aptitude="selectedTrackData?.surface"
                     :distance-aptitude="selectedTrackData?.distanceType"
                     @click="isAdmin && toggleBan(uma)"
                     @mouseenter="isAdminRef && playLocalSfx('/assets/sound-effects/sfx-button-hover.mp3')" />
          </div>
        </div>

        <div class="md:col-span-4 space-y-4">
          <h3 class="text-lg font-bold mb-3 text-slate-300">Squads</h3>
          <div v-for="team in tournament.teams" :key="team.id"
               class="bg-slate-900 border rounded-lg p-4 transition-colors"
               :class="currentDrafter?.id === team.captainId ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-800'">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-white" :style="{ color: team.color }">{{ team.name }}</span>
              <i v-if="currentDrafter?.id === team.captainId" class="ph-fill ph-pencil-simple text-amber-500 animate-pulse"></i>
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-amber-400">
                <i class="ph-fill ph-crown"></i> {{ getPlayerName(tournament, team.captainId) }}
              </div>
              <div v-for="memberId in team.memberIds" :key="memberId" class="flex items-center gap-2 text-sm text-slate-300">
                <i class="ph-fill ph-user"></i> {{ getPlayerName(tournament, memberId) }}
              </div>
              <div v-for="n in (2 - team.memberIds.length)" :key="n" class="flex items-center gap-2 text-sm text-slate-700 border-dashed border border-slate-800 p-1 rounded">
                <span class="text-xs">Empty Slot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>
