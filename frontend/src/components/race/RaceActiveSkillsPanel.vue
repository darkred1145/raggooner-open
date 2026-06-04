<script setup lang="ts">
import { computed } from 'vue';
import { effectColors } from '../../utils/raceReplayUtils';
import type { ReplayHorse } from '../../utils/raceReplayUtils';

const props = defineProps<{
  activeSkills: {
    frameTime: number;
    horseIndex: number;
    skillId: number;
    name: string;
    category: string;
    desc: string;
    remaining: number;
  }[];
  horseMap: Map<number, ReplayHorse>;
}>();

const sortedSkills = computed(() =>
  [...props.activeSkills].sort((a, b) => a.frameTime - b.frameTime)
);
</script>

<template>
  <div v-if="activeSkills.length > 0" class="px-6 pb-2">
    <div class="flex items-center gap-2 text-xs text-cyan-400 mb-1.5">
      <i class="ph-bold ph-lightning"></i>
      <span>Active Skills</span>
      <span class="text-slate-600 ml-auto">{{ activeSkills.length }} active</span>
    </div>
    <div class="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1">
      <div v-for="(skill, idx) in sortedSkills" :key="skill.frameTime + '-' + skill.horseIndex + '-' + skill.skillId"
           class="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/40 border border-slate-700/40 rounded text-xs font-mono transition-all duration-300"
           :style="{ borderLeftColor: effectColors[skill.category] || '#22d3ee', borderLeftWidth: '3px' }">
        <span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black"
              :style="{ background: effectColors[skill.category] || '#22d3ee' }">{{ idx + 1 }}</span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-bold truncate" :style="{ color: effectColors[skill.category] || '#22d3ee' }">{{ skill.name }}</span>
            <span class="text-[9px] text-slate-600 shrink-0">{{ horseMap.get(skill.horseIndex)?.charaName || 'H' + skill.horseIndex }}</span>
          </div>
          <div class="flex items-center gap-2 text-[10px] text-slate-600">
            <span>@{{ skill.frameTime.toFixed(2) }}s</span>
            <span v-if="skill.remaining > 0" class="text-cyan-500/70">{{ skill.remaining.toFixed(1) }}s</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

