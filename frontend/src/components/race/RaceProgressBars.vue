<script setup lang="ts">
import { getUmaImagePath } from '../../utils/umaData';
import { styleNames, styleColors } from '../../utils/raceReplayUtils';
import type { ReplayHorse } from '../../utils/raceReplayUtils';

defineProps<{
  horsesByFinish: (ReplayHorse & { finishPosition: number })[];
  isDone: boolean;
}>();
</script>

<template>
  <div class="px-6 py-6">
    <div class="relative">
      <div class="h-8 flex items-end mb-2 bg-slate-800/20 rounded-lg px-2">
        <div v-for="n in 12" :key="n" class="flex-1 flex flex-col items-center">
          <span class="text-[10px] text-slate-600 font-mono">{{ String((n - 1) * 200) }}m</span>
        </div>
      </div>
      <div class="relative space-y-1.5">
        <div v-for="(horse, idx) in horsesByFinish" :key="horse.horseIndex"
             class="h-9 bg-slate-800/50 rounded overflow-hidden relative border border-slate-700/50 transition-all duration-200"
             :class="{ 'ring-1 ring-indigo-500/30': idx < 3 }">
          <div class="absolute inset-0 rounded"
               :style="{
                 width: isDone ? '100%' : '0%',
                 background: `linear-gradient(90deg, ${styleColors[horse._responseHorseData?.running_style] || '#6366f1'}33, ${styleColors[horse._responseHorseData?.running_style] || '#6366f1'}15)`,
                 borderRight: `2px solid ${styleColors[horse._responseHorseData?.running_style] || '#6366f1'}88`,
               }">
          </div>
          <div class="relative z-10 flex items-center h-full px-3 gap-2">
            <div class="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black font-mono"
                 :class="horse.finishPosition === 1 ? 'bg-amber-500 text-slate-900' : horse.finishPosition === 2 ? 'bg-slate-300 text-slate-800' : horse.finishPosition === 3 ? 'bg-orange-700 text-white' : 'bg-slate-700 text-slate-400'">
              {{ horse.finishPosition }}
            </div>
            <img :src="getUmaImagePath(horse.charaName)" :alt="horse.charaName"
                 class="shrink-0 w-6 h-6 rounded-full object-cover bg-slate-700"
                 @error="($event.target as HTMLImageElement).style.display='none'" />
            <span class="text-sm font-bold text-white truncate min-w-0">{{ horse.charaName }}</span>
            <span class="text-[11px] text-slate-500 font-mono shrink-0">{{ horse._responseHorseData?.trainer_name || '???' }}</span>
            <div class="ml-auto flex items-center gap-3 shrink-0">
              <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
                    :style="{ background: styleColors[horse._responseHorseData?.running_style] || '#6366f1' }">
                {{ styleNames[horse._responseHorseData?.running_style] || '???' }}
              </span>
              <span class="text-xs font-mono text-slate-400 w-16 text-right">{{ horse.FinishTimeScaled.toFixed(2) }}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
