<script setup lang="ts">
import { getUmaImagePath } from '../../utils/umaData';

defineProps<{
  sortedByDistance: {
    horseIndex: number;
    distance: number;
    speed: number;
    name: string;
    style: number;
    lanePos: number;
    blocked: boolean;
    blockingHorse: number;
    hp: number;
  }[];
}>();
</script>

<template>
  <div class="px-6 pb-2">
    <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
      <i class="ph-bold ph-list-numbers"></i>
      <span>Positions</span>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
      <div v-for="(entry, idx) in sortedByDistance" :key="entry.horseIndex"
           class="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/40"
           :class="{ 'ring-1 ring-red-500/30': entry.blocked, 'ring-1 ring-yellow-500/20': !entry.blocked && entry.hp > 0 && entry.hp < 200 }">
        <span class="font-mono font-black w-4 text-right shrink-0"
              :class="idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-500' : 'text-slate-500'">
          {{ idx + 1 }}
        </span>
        <img :src="getUmaImagePath(entry.name)" :alt="entry.name"
             class="w-4 h-4 rounded-full object-cover bg-slate-700 shrink-0"
             @error="($event.target as HTMLImageElement).style.display='none'" />
        <span class="text-white truncate flex-1 min-w-0">{{ entry.name }}</span>
        <span v-if="entry.blocked" class="text-red-400 font-mono shrink-0 text-[9px]" :title="'Blocked by horse #' + entry.blockingHorse">
          &#x26D4;{{ entry.blockingHorse }}
        </span>
        <span class="font-mono text-slate-400 shrink-0">{{ entry.distance.toFixed(0) }}m</span>
        <span class="font-mono text-sky-300 w-8 text-right shrink-0">{{ entry.speed }}</span>
      </div>
    </div>
  </div>
</template>
