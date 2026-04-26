<script setup lang="ts">
import { ref, toRef, computed } from 'vue';
import type { Tournament, FirestoreUpdate, GlobalPlayer, Season, Team, Player } from '../types';
import { usePlayerDraft } from '../composables/usePlayerDraft';
import { useTournamentFlow } from '../composables/useTournamentFlow';
import { getPlayerName } from "../utils/utils";
import { voicelineVolume, playLocalSfx } from '../composables/useVoicelines';
import PlayerProfileModal from './PlayerProfileModal.vue';
import PlayerAvatar from './shared/PlayerAvatar.vue';
import DraftHeader from './DraftHeader.vue';
import PlayerCard from './PlayerCard.vue';

// 1. Define Props
const props = defineProps<{
  tournament: Tournament;
  isAdmin: boolean;
  secureUpdate: (data: FirestoreUpdate<Tournament> | Record<string, any>) => Promise<void>;
  globalPlayers: GlobalPlayer[];
  seasons: Season[];
  captainTeam?: Team | null;
  isMyTurn?: boolean;
  onCaptainDraftPlayer?: (playerId: string) => Promise<void>;
}>();

const isCaptainTurn = computed(
    () => !props.isAdmin && !!props.isMyTurn && !!props.captainTeam
);

// Season filter for dominance stat
const selectedSeasonId = ref<string>(props.tournament.seasonId || 'all');

const getDominance = (playerId: string): number | null => {
  const gp = props.globalPlayers.find(p => p.id === playerId);
  if (!gp) return null;

  let faced: number | undefined;
  let beaten: number | undefined;

  if (selectedSeasonId.value === 'all') {
    faced = gp.metadata?.opponentsFaced;
    beaten = gp.metadata?.opponentsBeaten;
  } else {
    const seasonData = gp.metadata?.seasons?.[selectedSeasonId.value];
    if (!seasonData) return null;
    faced = seasonData.opponentsFaced;
    beaten = seasonData.opponentsBeaten;
  }

  if (!faced || faced === 0) return null;
  return ((beaten || 0) / faced) * 100;
};

// 2. Convert Prop to Ref for the Composable
const tournamentRef = toRef(props, 'tournament');
const isAdminRef = toRef(props, 'isAdmin');

// 3. Initialize Composable
const {
  startRandomDraft,
  draftPlayer,
  undoLastPick,
  availablePlayers,
  currentDrafter,
  remainingPicks,
  isDraftComplete,
  showRandomModal,
  randomWheelRotation,
  randomCandidates,
  getRandomWheelGradient
} = usePlayerDraft(tournamentRef, props.secureUpdate, isAdminRef);

const { advancePhase, isAdvancing } = useTournamentFlow(tournamentRef, props.secureUpdate);

// ── Player profile modal ──────────────────────────────────────────────────────
const profileModalOpen = ref(false);
const profilePlayerId = ref<string>('');

const openProfile = (playerId: string) => {
    profilePlayerId.value = playerId;
    profileModalOpen.value = true;
};

const profilePlayer = computed(() =>
    props.globalPlayers.find(gp => gp.id === profilePlayerId.value) ?? null
);

const profilePlayerName = computed(() =>
    props.tournament.players[profilePlayerId.value]?.name ?? ''
);

const getAvatarUrl = (playerId: string) =>
    props.globalPlayers.find(gp => gp.id === playerId)?.avatarUrl;

const sortedAvailablePlayers = computed(() => {
  return [...availablePlayers.value].sort((a, b) => {
    const domA = getDominance(a.id) ?? -1;
    const domB = getDominance(b.id) ?? -1;
    if (domA === domB) return a.name.localeCompare(b.name);
    return domB - domA;
  });
});

// Draft handling
const isDrafting = ref(false);
const pickError = ref('');

const handleDraftClick = async (player: Player) => {
  if (isDrafting.value || isAdvancing.value) return;

  if (!props.isAdmin && !isCaptainTurn.value) {
    pickError.value = "It's not your turn to pick!";
    setTimeout(() => { pickError.value = ''; }, 3000);
    return;
  }

  isDrafting.value = true;
  try {
    if (isCaptainTurn.value && props.onCaptainDraftPlayer) {
      await props.onCaptainDraftPlayer(player.id);
    } else {
      await draftPlayer(player);
    }
  } catch (err) {
    console.error("Draft error:", err);
  } finally {
    isDrafting.value = false;
  }
};

const handleRandomDraft = () => {
  if (!props.isAdmin && !isCaptainTurn.value) return;
  startRandomDraft(isCaptainTurn.value ? props.onCaptainDraftPlayer : undefined);
};

</script>

<template>
  <div>
    <div class="space-y-6">
      
      <!-- Error Message Toast -->
      <transition name="fade">
        <div v-if="pickError" class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm border border-red-400 font-bold flex items-center gap-2">
          <i class="ph-bold ph-warning-circle text-xl"></i>
          {{ pickError }}
        </div>
      </transition>

      <!-- Draft in progress -->
      <template v-if="!isDraftComplete">
        <div v-if="isCaptainTurn"
             class="mb-3 px-4 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 text-sm font-bold flex items-center gap-2 animate-pulse"
             role="alert">
          <i class="ph-fill ph-crown text-indigo-400"></i>
          It's your turn to pick! Select a player below.
        </div>

        <DraftHeader
          :can-undo="!!(tournament.draft && tournament.draft.currentIdx > 0)"
          :is-admin="isAdmin"
          :is-busy="isDrafting"
          :remaining-picks="remainingPicks"
          :voiceline-volume="voicelineVolume"
          @undo="undoLastPick"
          @update:voicelineVolume="voicelineVolume = $event"
        />

        <div class="grid md:grid-cols-12 gap-6">
          
          <!-- Players Grid -->
          <div class="md:col-span-8 flex flex-col">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
              <h3 class="text-lg font-bold text-slate-300">Available Players</h3>
              <select v-model="selectedSeasonId"
                      aria-label="Filter by Season"
                      title="Filter Dominance Stat by Season"
                      class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 w-full sm:w-auto">
                <option value="all">All Time (Dominance)</option>
                <option v-for="season in seasons" :key="season.id" :value="season.id">{{ season.name }}</option>
              </select>
            </div>
            
            <!-- Virtual scroll container alternative (fixed height + overflow) -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-fr max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar pb-4" role="list" aria-label="List of available players">
              <button @click="handleRandomDraft"
                      @mouseenter="(isAdmin || isCaptainTurn) && playLocalSfx('/assets/sound-effects/sfx-button-hover.mp3')"
                      :disabled="(!isAdmin && !isCaptainTurn) || isDrafting"
                      aria-label="Draft a random player"
                      class="bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 p-4 rounded-lg shadow-lg border-2 border-amber-300 flex items-center justify-between group relative overflow-hidden transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">

                <div class="relative z-10 text-left">
                  <div class="font-black text-amber-900 text-lg uppercase tracking-wider">Random</div>
                  <div class="text-amber-900/80 text-xs font-bold">I'm feeling lucky</div>
                </div>

                <div class="relative z-10 text-amber-900 p-2 bg-white/20 rounded-full">
                  <i class="ph-bold ph-dice-five text-3xl group-hover:rotate-180 transition-transform duration-500" aria-hidden="true"></i>
                </div>

                <div class="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full shine-effect pointer-events-none"></div>
              </button>

              <PlayerCard
                v-for="player in sortedAvailablePlayers"
                :key="player.id"
                :avatar-url="getAvatarUrl(player.id)"
                :disabled="isDrafting"
                :dominance-pct="getDominance(player.id)"
                :player="player"
                @selected="handleDraftClick(player)"
                @view-profile="openProfile"
                @mouseenter="(isAdmin || isCaptainTurn) && playLocalSfx('/assets/sound-effects/sfx-button-hover.mp3')"
              />
            </div>
          </div>

          <!-- Squads Sidebar -->
          <div class="md:col-span-4 space-y-4">
            <h3 class="text-lg font-bold mb-3 text-slate-300">Squads</h3>
            <div class="flex flex-col gap-3">
              <div v-for="team in tournament.teams" :key="team.id"
                   class="bg-slate-900 border rounded-lg p-4 transition-colors relative overflow-hidden"
                   :class="currentDrafter?.id === team.id ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-800'">
                
                <div v-if="currentDrafter?.id === team.id" class="absolute top-0 right-0 p-1 bg-indigo-500 rounded-bl-lg pointer-events-none">
                  <span class="text-[10px] font-bold text-white uppercase px-1">Picking</span>
                </div>

                <div class="flex justify-between items-center mb-2 pr-6">
                  <span class="font-bold text-white" :style="{ color: team.color }">{{ team.name }}</span>
                  <i v-if="currentDrafter?.id === team.id" class="ph-fill ph-crosshair text-indigo-400 animate-pulse" aria-hidden="true"></i>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center gap-2 text-sm text-amber-400" title="Captain">
                    <PlayerAvatar :name="getPlayerName(tournament, team.captainId)" :avatar-url="getAvatarUrl(team.captainId)" size="sm" />
                    <i class="ph-fill ph-crown text-xs shrink-0" aria-hidden="true"></i>
                    <span class="flex-1 truncate">{{ getPlayerName(tournament, team.captainId) }}</span>
                    <button @click="openProfile(team.captainId)" aria-label="View Captain Profile" class="text-indigo-400/50 hover:text-indigo-400 transition-colors shrink-0">
                      <i class="ph-bold ph-user-circle text-sm" aria-hidden="true"></i>
                    </button>
                  </div>
                  <div v-for="memberId in team.memberIds" :key="memberId" class="flex items-center gap-2 text-sm text-slate-300">
                    <PlayerAvatar :name="getPlayerName(tournament, memberId)" :avatar-url="getAvatarUrl(memberId)" size="sm" />
                    <span class="flex-1 truncate">{{ getPlayerName(tournament, memberId) }}</span>
                    <button @click="openProfile(memberId)" aria-label="View Player Profile" class="text-indigo-400/50 hover:text-indigo-400 transition-colors shrink-0">
                      <i class="ph-bold ph-user-circle text-sm" aria-hidden="true"></i>
                    </button>
                  </div>
                  <div v-for="n in (2 - team.memberIds.length)" :key="n" class="flex items-center gap-2 text-sm text-slate-700 border-dashed border border-slate-800 p-1 rounded" aria-hidden="true">
                    <span class="text-xs">Empty Slot</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Draft complete -->
      <template v-else>
        <div class="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-6 text-center space-y-4">
          <div class="flex items-center justify-center gap-3">
            <i class="ph-fill ph-check-circle text-emerald-400 text-3xl" aria-hidden="true"></i>
            <h3 class="text-2xl font-bold text-white">Player Draft Complete</h3>
          </div>
          <p class="text-slate-400">All players have been drafted. Review the squads below, then continue.</p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button v-if="isAdmin"
                    @click="undoLastPick" :disabled="isAdvancing" role="button" tabindex="0" aria-label="Undo last draft pick"
                    class="text-slate-500 hover:text-white flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 w-full sm:w-auto disabled:opacity-50">
              <i class="ph-bold ph-arrow-u-up-left" aria-hidden="true"></i> Undo Last Pick
            </button>
            <button @click="advancePhase"
                    :disabled="!isAdmin || isAdvancing"
                    aria-label="Advance to Next Phase"
                    class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
              <template v-if="isAdvancing">
                <i class="ph ph-spinner animate-spin" aria-hidden="true"></i> Advancing...
              </template>
              <template v-else>
                <span>Continue</span>
                <i class="ph-bold ph-arrow-right" aria-hidden="true"></i>
              </template>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
          <div v-for="team in tournament.teams" :key="team.id"
               class="relative bg-slate-800/80 backdrop-blur-sm border-t-4 border-b border-x border-slate-700 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1"
               :style="{
                 borderTopColor: team.color,
                 boxShadow: `0 10px 25px -5px ${team.color}20`
               }">

            <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-700/50">
              <h4 class="text-xl font-black tracking-wide drop-shadow-sm truncate pr-2" :style="{ color: team.color }" :title="team.name">
                {{ team.name }}
              </h4>
              <div class="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 uppercase tracking-wider shrink-0" aria-label="Team Size">
                {{ team.memberIds.length + 1 }} Players
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 px-3 py-2 rounded-r-lg" title="Captain">
                <PlayerAvatar :name="getPlayerName(tournament, team.captainId)" :avatar-url="getAvatarUrl(team.captainId)" size="md" />
                <i class="ph-fill ph-crown text-amber-400 text-sm drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] shrink-0" aria-hidden="true"></i>
                <span class="text-sm font-bold text-amber-100 flex-1 truncate">{{ getPlayerName(tournament, team.captainId) }}</span>
                <button @click="openProfile(team.captainId)" aria-label="View Captain Profile" class="text-indigo-400/50 hover:text-indigo-400 transition-colors shrink-0">
                  <i class="ph-bold ph-user-circle text-sm" aria-hidden="true"></i>
                </button>
              </div>

              <div v-if="team.memberIds.length > 0" class="grid grid-cols-2 gap-2 mt-2">
                <div v-for="memberId in team.memberIds" :key="memberId"
                     class="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/30">
                  <PlayerAvatar :name="getPlayerName(tournament, memberId)" :avatar-url="getAvatarUrl(memberId)" size="sm" />
                  <span class="text-sm font-medium text-slate-300 truncate flex-1" :title="getPlayerName(tournament, memberId)">{{ getPlayerName(tournament, memberId) }}</span>
                  <button @click="openProfile(memberId)" aria-label="View Player Profile" class="text-indigo-400/50 hover:text-indigo-400 transition-colors shrink-0">
                    <i class="ph-bold ph-user-circle text-sm" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </template>
    </div>

    <PlayerProfileModal
        :open="profileModalOpen"
        :player-name="profilePlayerName"
        :global-player="profilePlayer"
        @close="profileModalOpen = false"
    />

    <!-- Random Draft Modal Overlay -->
    <div v-if="showRandomModal" class="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Randomly Selecting Player">

      <h2 class="text-3xl font-bold text-white mb-8 animate-pulse text-center">
        <span class="text-amber-400">Fate</span> is deciding...
      </h2>

      <div class="relative">
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 z-20 drop-shadow-xl filter">
          <i class="ph-fill ph-caret-down text-6xl text-white" aria-hidden="true"></i>
        </div>

        <div class="w-80 h-80 sm:w-96 sm:h-96 rounded-full border-8 border-slate-800 shadow-[0_0_60px_rgba(245,158,11,0.3)] relative overflow-hidden transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
             :style="{
            background: getRandomWheelGradient,
            transform: `rotate(${randomWheelRotation}deg)`
          }">
          <div v-for="(player, idx) in randomCandidates" :key="player.id"
               class="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[50%] origin-bottom flex justify-center pt-8"
               :style="{ transform: `rotate(${(idx * (360/randomCandidates.length)) + (360/randomCandidates.length/2)}deg)` }">

            <div class="text-white font-black text-xs uppercase drop-shadow-md px-1 py-2 rounded bg-black/20 backdrop-blur-sm truncate max-h-[120px] whitespace-nowrap">
              {{ player.name }}
            </div>
          </div>
        </div>

        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-800 rounded-full border-4 border-slate-600 z-10 shadow-lg flex items-center justify-center">
          <div class="w-12 h-12 bg-amber-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      <p class="text-slate-500 mt-8 font-mono text-xs" aria-live="polite">
        Choosing from {{ availablePlayers.length }} Players
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles are used here for specific animation keyframes and scrollbar hiding that are not easily mapped to standard Tailwind arbitrary classes without cluttering the template. */
@keyframes shine {
  0% { transform: translateX(-150%) skewX(-12deg); }
  100% { transform: translateX(150%) skewX(-12deg); }
}
.group:hover .shine-effect {
  animation: shine 1s ease-in-out infinite;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5); 
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.5); 
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.8); 
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
