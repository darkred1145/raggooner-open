<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { normalizeReplayData, extractSimDataBase64 } from '../../utils/replayUtils';
import { decodeRaceSimData, type RaceSimulateData } from '../../utils/raceSimDecoder';
import RaceReplayVisualization, { type ReplayData } from './RaceReplayVisualization.vue';

const props = defineProps<{
  replayData: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const loading = ref(true);
const error = ref(false);
const parsedReplayData = ref<ReplayData | null>(null);
const simData = ref<RaceSimulateData | null>(null);

onMounted(async () => {
  try {
    const data = JSON.parse(props.replayData);
    const normalized = normalizeReplayData(data) as ReplayData;
    parsedReplayData.value = normalized;

    const simB64 = extractSimDataBase64(data);
    if (simB64) {
      try {
        simData.value = await decodeRaceSimData(simB64);
      } catch (e) {
        console.warn('Failed to decode sim data', e);
      }
    }
  } catch (e) {
    console.error('Failed to load replay', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="emit('close')">
    <div v-if="loading" class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-20 flex flex-col items-center gap-4">
      <i class="ph ph-spinner text-4xl text-indigo-400 animate-spin"></i>
      <span class="text-slate-400 text-sm font-mono">Loading replay data...</span>
    </div>

    <div v-else-if="error" class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-20 flex flex-col items-center gap-4">
      <i class="ph-bold ph-file-x text-5xl text-rose-400"></i>
      <span class="text-slate-400 text-lg">Failed to load replay data</span>
      <button @click="emit('close')" class="px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700">Close</button>
    </div>

    <div v-else-if="parsedReplayData" class="max-h-[90vh] mx-4 relative">
      <button @click="emit('close')" class="absolute -top-3 -right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-600 transition-colors shadow-lg">
        <i class="ph-bold ph-x"></i>
      </button>
      <RaceReplayVisualization :replay-data="parsedReplayData" :sim-data="simData" />
    </div>
  </div>
</template>
