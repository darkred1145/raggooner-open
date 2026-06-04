<script setup lang="ts">
defineProps<{
  hasSimData: boolean;
  totalTime: number;
  elapsedTime: number;
  playing: boolean;
  done: boolean;
  playbackSpeed: number;
  isFullscreen: boolean;
  replayTime: string;
  phaseMarkers: { time: number; label: string }[];
}>();

const emit = defineEmits<{
  togglePlay: [];
  stop: [];
  seekInput: [value: number];
  seekChange: [value: number];
  setSpeed: [speed: number];
  toggleFullscreen: [];
}>();

function onInput(e: Event) {
  emit('seekInput', parseFloat((e.target as HTMLInputElement).value));
}

function onChange(e: Event) {
  emit('seekChange', parseFloat((e.target as HTMLInputElement).value));
}
</script>

<template>
  <div id="race-controls" v-if="hasSimData" class="px-6 py-3 bg-slate-950/30 border-t border-slate-700/50 space-y-2">
    <div class="relative h-7 flex items-center">
      <input type="range" :min="0" :max="totalTime" :step="0.01" :value="elapsedTime"
             @input="onInput" @change="onChange"
             class="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-10
                    [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full
                    [&::-webkit-slider-runnable-track]:bg-slate-700
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900
                    [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-slate-700
                    [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-indigo-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900" />
      <div class="absolute inset-0 pointer-events-none flex items-center">
        <div class="h-1.5 rounded-full bg-slate-700 w-full relative overflow-hidden mx-1">
          <div class="h-full rounded-full bg-indigo-500 transition-none" :style="{ width: (elapsedTime / totalTime * 100) + '%' }"></div>
        </div>
      </div>
      <div v-for="m in phaseMarkers" :key="m.label"
           class="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
           :style="{ left: (m.time / totalTime * 100) + '%' }">
        <div class="h-2 w-px bg-amber-400/60 mt-0.5"></div>
        <span class="text-[8px] font-mono text-amber-400/70 whitespace-nowrap -ml-1 mt-0.5">{{ m.label }}</span>
      </div>
    </div>
    <div class="flex items-center gap-2 text-sm">
      <button @click="emit('togglePlay')" class="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-700 transition-colors"
              :class="playing ? 'text-rose-400 hover:text-rose-300' : done ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-400 hover:text-emerald-300'">
        <i :class="playing ? 'ph-bold ph-pause' : done ? 'ph-bold ph-arrows-clockwise' : 'ph-bold ph-play'"></i>
      </button>
      <button @click="emit('stop')" class="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
        <i class="ph-bold ph-stop"></i>
      </button>
      <span class="font-mono text-xs text-slate-400 w-28">{{ replayTime }}s / {{ totalTime.toFixed(2) }}s</span>
      <div class="flex items-center gap-1 ml-auto">
        <button v-for="s in [1, 2, 4]" :key="s"
                @click="emit('setSpeed', s)"
                class="px-2 py-0.5 rounded text-xs font-mono transition-colors"
                :class="playbackSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'">
          {{ s }}x
        </button>
      </div>
      <button @click="emit('toggleFullscreen')" class="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors ml-1" :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'">
        <i :class="isFullscreen ? 'ph-bold ph-compress' : 'ph-bold ph-arrows-out'"></i>
      </button>
      <div class="flex items-center gap-3 ml-2 text-[10px] text-slate-500 hidden lg:flex">
        <span class="flex items-center gap-1" title="✦ Skill name shown above horse during activation"><span class="w-2 h-2 rounded-full inline-block" style="background:#22d3ee"></span>Skillⓘ</span>
        <span class="flex items-center gap-1" title="Countdown timer on skill labels"><span class="w-2 h-2 rounded-full inline-block" style="background:#22d3ee"></span>Timerⓘ</span>
        <span class="flex items-center gap-1" title="HP bar below each horse icon"><span class="w-2 h-2 rounded-full inline-block" style="background:#34d399"></span>HPⓘ</span>
        <span class="flex items-center gap-1" title="⛔ indicator when blocked by another horse"><span class="w-2 h-2 rounded-full inline-block" style="background:#ef4444"></span>Blockⓘ</span>
        <span class="flex items-center gap-1" title="Green/amber bands on track indicate slopes"><span class="w-2 h-2 rounded-full inline-block" style="background:#84cc16"></span>Slopesⓘ</span>
        <span class="flex items-center gap-1" title="Speed in m/s shown near each horse"><span class="w-2 h-2 rounded-full inline-block" style="background:#22d3ee"></span>Speedⓘ</span>
        <span class="flex items-center gap-1" title="Acceleration in m/s² computed from speed delta"><span class="w-2 h-2 rounded-full inline-block" style="background:#f97316"></span>Accelⓘ</span>
        <span class="flex items-center gap-1" title="Pace up/down/downhill heuristics based on speed thresholds"><span class="w-2 h-2 rounded-full inline-block" style="background:#a78bfa"></span>Modeⓘ</span>
        <span class="flex items-center gap-1" title="Course segments: corners (↩) and straights"><span class="w-2 h-2 rounded-full inline-block" style="background:#c08b5b"></span>Courseⓘ</span>
        <span class="flex items-center gap-1" title="Position Keep phase (first 10/24 of race distance)"><span class="w-2 h-2 rounded-full inline-block" style="background:#fbbf24"></span>PKⓘ</span>
        <span class="flex items-center gap-1" title="Track map with distance markers and phase labels"><span class="w-2 h-2 rounded-full inline-block" style="background:#c08b5b"></span>Mapⓘ</span>
      </div>
    </div>
  </div>
</template>
