<script setup lang="ts">
import { ref, watch } from 'vue';

type RemainingPick = {
  id: string;
  captainName: string;
  color: string;
  isCurrent: boolean;
};

const props = defineProps<{
  remainingPicks: RemainingPick[];
  isAdmin: boolean;
  canUndo: boolean;
  isBusy?: boolean;
  voicelineVolume: number;
}>();

const emit = defineEmits<{
  undo: [];
  'update:voicelineVolume': [value: number];
}>();

const localVolume = ref(props.voicelineVolume);

watch(
  () => props.voicelineVolume,
  (newValue) => {
    localVolume.value = newValue;
  }
);

watch(localVolume, (newValue) => {
  emit('update:voicelineVolume', newValue);
});
</script>

<template>
  <div class="sticky top-20 z-30 flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900/95 shadow-xl backdrop-blur-md">
    <div class="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
      <div>
        <h2 class="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
          <i class="ph-fill ph-users-three text-indigo-400" aria-hidden="true"></i>
          Player Draft
        </h2>
        <p class="text-sm text-slate-400">Captains draft their team members.</p>
      </div>

      <div class="flex w-full items-center gap-4 sm:w-auto">
        <button
          v-if="isAdmin && canUndo"
          :disabled="isBusy"
          aria-label="Undo last draft pick"
          class="flex items-center gap-2 rounded px-3 py-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          title="Undo Last Pick"
          @click="emit('undo')"
        >
          <i class="ph-bold ph-arrow-u-up-left" aria-hidden="true"></i>
          <span class="hidden sm:inline">Undo</span>
        </button>

        <div class="flex items-center gap-1.5 text-slate-500" title="Adjust Sound Volume">
          <i
            class="ph-bold shrink-0 text-lg"
            :class="
              localVolume === 0
                ? 'ph-speaker-x'
                : localVolume < 0.5
                  ? 'ph-speaker-low'
                  : 'ph-speaker-high'
            "
            aria-hidden="true"
          ></i>
          <input
            v-model.number="localVolume"
            aria-label="Volume Control"
            class="w-20 cursor-pointer accent-indigo-500"
            max="1"
            min="0"
            step="0.05"
            type="range"
          />
        </div>

        <div class="hidden text-right sm:block">
          <div class="font-mono text-2xl font-bold text-indigo-400">
            {{ remainingPicks.length }}
          </div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining</div>
        </div>
      </div>
    </div>

    <div class="flex flex-col items-center gap-4 border-t border-slate-700/50 bg-slate-800/50 px-4 py-3 shadow-inner md:flex-row">
      <div class="hide-scrollbar flex w-full flex-1 items-center gap-3 overflow-x-auto overflow-y-hidden" aria-label="Draft Order">
        <span class="shrink-0 text-xs font-bold uppercase tracking-wider text-slate-400">Draft Order:</span>

        <div
          v-for="(pick, idx) in remainingPicks"
          :key="pick.id"
          class="flex shrink-0 items-center transition-all duration-300"
          :class="pick.isCurrent ? 'mx-3 scale-110 opacity-100' : 'scale-90 opacity-50'"
        >
          <span
            class="whitespace-nowrap font-bold tracking-wide"
            :class="pick.isCurrent ? 'text-xl drop-shadow-md' : 'text-sm'"
            :style="{ color: pick.color }"
          >
            {{ pick.captainName }}
          </span>

          <i
            v-if="idx < remainingPicks.length - 1"
            class="ph-bold ph-caret-right ml-3 text-slate-600"
            :class="pick.isCurrent ? 'text-lg' : 'text-xs'"
            aria-hidden="true"
          ></i>
        </div>
      </div>
    </div>
  </div>
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
