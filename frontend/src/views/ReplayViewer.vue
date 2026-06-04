<script setup lang="ts">
import { ref } from 'vue';
import RaceReplayVisualization, { type ReplayData } from '../components/race/RaceReplayVisualization.vue';
import { normalizeReplayData, extractSimDataBase64 } from '../utils/replayUtils';
import { decodeRaceSimData, parseRaceSimDataFromJson, extendFramesToFinish, type RaceSimulateData } from '../utils/raceSimDecoder';

const props = defineProps<{ standalone?: boolean }>();
const loading = ref(false);
const fileInputEl = ref<HTMLInputElement | null>(null);
const triggerFileInput = () => fileInputEl.value?.click();
const decoding = ref(false);
const error = ref<string | null>(null);
const replayData = ref<ReplayData | null>(null);
const simData = ref<RaceSimulateData | null>(null);
const dragOver = ref(false);
const fileName = ref<string | null>(null);

const loadFile = (file: File) => {
  loading.value = true;
  decoding.value = false;
  error.value = null;
  replayData.value = null;
  simData.value = null;
  fileName.value = file.name;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target?.result as string;
      const parsed = JSON.parse(text);
      const normalized = normalizeReplayData(parsed);

      if (normalized.RaceHorse && normalized.HorseIndexByFinishOrder) {
        replayData.value = normalized as ReplayData;
        const simB64 = extractSimDataBase64(parsed);
        if (simB64) {
          decoding.value = true;
          try {
            const sd = await decodeRaceSimData(simB64);
            const td = normalized.RaceCourseSet?.Distance;
            console.log('[ReplayViewer] totalDistance from JSON:', td, 'horses:', sd.horseNum, 'last frame time:', sd.frames[sd.frames.length-1]?.time);
            if (td > 0) extendFramesToFinish(sd, td);
            else console.warn('[ReplayViewer] no totalDistance, skip extend');
            simData.value = sd;
          } catch (e) {
            console.warn('Failed to decode sim data', e);
          }
          decoding.value = false;
        }
      } else if (parsed.frame || parsed.frames) {
        decoding.value = true;
        try {
          const sd = parseRaceSimDataFromJson(parsed);
          simData.value = sd;
          const horseResults = sd.horseResults;
          const horseNum = sd.horseNum;
          const maxDist = Math.max(...sd.frames.map(f => Math.max(...f.horseFrames.map(h => h.distance))));
          const horses = horseResults.map((hr: any, i: number) => ({
            horseIndex: i,
            postNumber: i + 1,
            charaId: 0,
            charaName: `Horse ${i}`,
            FinishOrder: hr.finishOrder ?? 0,
            FinishTimeRaw: hr.finishTimeRaw ?? 0,
            FinishTimeScaled: hr.finishTime ?? 0,
            FinishDiffTimeFromPrev: hr.finishDiffTime ?? 0,
            _raceParam: { RawSpeed: 0, RawStamina: 0, RawPow: 0, RawGuts: 0, RawWiz: 0, Motivation: 'normal' },
            _responseHorseData: {
              trainer_name: '', card_id: 0, chara_id: 0, rarity: 0, talent_level: 0, frame_order: 0,
              running_style: hr.runningStyle ?? 0, speed: 0, stamina: 0, pow: 0, guts: 0, wiz: 0,
            },
          }));
          const idxWithOrder = horseResults.map((hr: any, idx: number) => ({ hr, idx }));
          idxWithOrder.sort((a: any, b: any) => (a.hr.finishOrder ?? 0) - (b.hr.finishOrder ?? 0));
          replayData.value = {
            RaceType: '',
            RandomSeed: 0,
            RaceCourseSet: { Distance: Math.round(maxDist), Ground: 0, Turn: 0 },
            RotationCategory: '', CourseDistanceType: '', GroundCondition: '', Weather: '', Season: '',
            HorseIndexByFinishOrder: idxWithOrder.map((x: any) => x.idx),
            HorseIndexByPopularity: Array.from({ length: horseNum }, (_, i) => i),
            RaceHorse: horses,
            PlayerTeamMemberArray: horses,
          } as any;
        } catch (e) {
          console.warn('Failed to decode JSON sim data', e);
          error.value = 'Failed to parse simulation data from JSON.';
          loading.value = false;
          return;
        }
        decoding.value = false;
      } else {
        error.value = 'Invalid replay file — no race data found.';
        loading.value = false;
        return;
      }
    } catch {
      error.value = 'Invalid JSON file.';
    } finally {
      loading.value = false;
    }
  };
  reader.onerror = () => {
    error.value = 'Failed to read file.';
    loading.value = false;
  };
  reader.readAsText(file);
};

const onFileDrop = (e: DragEvent) => {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    loadFile(file);
  }
};

const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) loadFile(file);
  input.value = '';
};

const reset = () => {
  replayData.value = null;
  error.value = null;
  fileName.value = null;
  loading.value = false;
};
</script>

<template>
  <div v-if="standalone !== false" class="min-h-screen bg-slate-950 text-white">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <slot name="header">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-2xl font-bold flex items-center gap-3">
            <i class="ph-bold ph-video text-indigo-400"></i>
            Race Replay Viewer
          </h1>
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-500">Local only — no data saved</span>
            <label class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold cursor-pointer transition-colors flex items-center gap-2">
              <i class="ph-bold ph-folder-open"></i>
              Open File
              <input type="file" accept=".json,application/json" class="hidden" @change="onFileSelected" />
            </label>
          </div>
        </div>
      </slot>
      <div v-if="!replayData && !loading && !error" class="border-2 border-dashed rounded-2xl p-20 text-center transition-all"
           :class="dragOver ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'"
           @dragover.prevent="dragOver = true"
           @dragleave="dragOver = false"
           @drop.prevent="onFileDrop">
        <div class="flex flex-col items-center gap-4">
          <i class="ph-bold ph-cloud-arrow-up text-5xl" :class="dragOver ? 'text-indigo-400' : 'text-slate-600'"></i>
          <div>
            <p class="text-lg font-bold" :class="dragOver ? 'text-indigo-300' : 'text-slate-300'">
              {{ dragOver ? 'Drop your replay file here' : 'Drag & drop a replay JSON file' }}
            </p>
            <p class="text-sm text-slate-500 mt-1">or click <strong class="text-indigo-400">Open File</strong> above</p>
          </div>
        </div>
      </div>
      <div v-else-if="loading || decoding" class="flex flex-col items-center justify-center p-20 gap-4">
        <i class="ph ph-spinner text-4xl text-indigo-400 animate-spin"></i>
        <span class="text-slate-400 text-sm font-mono">{{ decoding ? 'Decoding simulation data...' : 'Parsing ' + fileName + '...' }}</span>
      </div>
      <div v-else-if="error" class="border-2 border-rose-500/30 border-dashed rounded-2xl bg-rose-500/5 flex flex-col items-center justify-center p-20 gap-4">
        <i class="ph-bold ph-warning-circle text-5xl text-rose-400"></i>
        <span class="text-rose-300 text-lg">{{ error }}</span>
        <button @click="reset" class="px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition-colors">
          Try another file
        </button>
      </div>
      <div v-else-if="replayData" class="space-y-4">
        <slot name="loaded-header">
          <div class="flex items-center gap-2 text-sm text-slate-400">
            <i class="ph-bold ph-arrow-left"></i>
            <button @click="reset" class="hover:text-white transition-colors">
              Load a different file
            </button>
            <span class="mx-2 text-slate-600">|</span>
            <span class="text-slate-500">{{ fileName }}</span>
          </div>
        </slot>
        <RaceReplayVisualization :replay-data="replayData" :sim-data="simData" />
      </div>
    </div>
  </div>
  <div v-else class="flex flex-col" style="min-height:calc(100vh - 140px)">
    <div v-if="!replayData && !loading && !error"
         class="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all flex-grow"
         :class="dragOver ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'"
         @dragover.prevent="dragOver = true"
         @dragleave="dragOver = false"
         @drop.prevent="onFileDrop">
      <div class="flex flex-col items-center gap-4">
        <i class="ph-bold ph-cloud-arrow-up text-5xl" :class="dragOver ? 'text-indigo-400' : 'text-slate-600'"></i>
        <div class="text-center">
          <p class="text-lg font-bold" :class="dragOver ? 'text-indigo-300' : 'text-slate-300'">
            {{ dragOver ? 'Drop your replay file here' : 'Drag & drop a replay JSON file' }}
          </p>
          <p class="text-sm text-slate-500 mt-1">or <strong class="text-indigo-400 cursor-pointer" @click="triggerFileInput">browse for a file</strong></p>
        </div>
      </div>
      <input ref="fileInputEl" type="file" accept=".json,application/json" class="hidden" @change="onFileSelected" />
    </div>
    <div v-else-if="loading || decoding" class="flex flex-col items-center justify-center flex-grow gap-3">
      <i class="ph ph-spinner text-4xl text-indigo-400 animate-spin"></i>
      <span class="text-slate-400 text-sm font-mono">{{ decoding ? 'Decoding simulation data...' : 'Parsing ' + fileName + '...' }}</span>
    </div>
    <div v-else-if="error" class="flex flex-col items-center justify-center flex-grow border-2 border-rose-500/30 border-dashed rounded-2xl bg-rose-500/5 gap-4">
      <i class="ph-bold ph-warning-circle text-5xl text-rose-400"></i>
      <span class="text-rose-300 text-lg">{{ error }}</span>
      <button @click="reset" class="px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition-colors">
        Try another file
      </button>
    </div>
    <div v-else-if="replayData" class="space-y-3">
      <div class="flex items-center justify-between gap-2 text-sm text-slate-400">
        <div class="flex items-center gap-2">
          <i class="ph-bold ph-arrow-left"></i>
          <button @click="reset" class="hover:text-white transition-colors">
            Back
          </button>
          <span class="mx-2 text-slate-600">|</span>
          <span class="text-slate-500">{{ fileName }}</span>
        </div>
        <label class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold cursor-pointer transition-colors flex items-center gap-2">
          <i class="ph-bold ph-folder-open"></i>
          Open File
          <input type="file" accept=".json,application/json" class="hidden" @change="onFileSelected" />
        </label>
      </div>
      <div class="flex justify-center">
        <RaceReplayVisualization :replay-data="replayData" :sim-data="simData" />
      </div>
    </div>
  </div>
</template>
