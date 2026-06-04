<script setup lang="ts">
import { getUmaImagePath } from '../../utils/umaData';
import { getSupportCardNameByNumericId } from '../../utils/supportCardData';
import {
  resolveSkillName, resolveSupportCardRarity,
  getFactorLabel, getFactorColor, aggregateFactors,
  gradeLetter, gradeColor, moodLabel, moodClass,
} from '../../utils/raceReplayUtils';
import type { SkillEntry } from '../../utils/skillDatabase';

export type HorseDetail = {
  finishPosition: number;
  postNumber: number;
  charaName: string;
  trainerName: string;
  styleNum: number;
  styleName: string;
  motivation: string;
  finishTime: number;
  finishTimeDisplay: string;
  gapDisplay: string;
  speed: number;
  stamina: number;
  power: number;
  guts: number;
  wiz: number;
  startDelayMs: number;
  isLateStart: boolean;
  lastSpurtDist: number;
  spurtDelay: number;
  defeat: number;
  hpCurrent: number;
  hpMax: number;
  hpPercent: number;
  hpDied: boolean;
  hpDeathDist: number | undefined;
  hpDeficit: number | undefined;
  duelDuration: number;
  downhillDuration: number;
  paceUpDuration: number;
  paceDownDuration: number;
  overtakeDuration: number;
  speedUpDuration: number;
  skills: { skill_id: number; level: number; usedCount: number }[];
  factors: { factorId: number; level: number }[];
  supportCards: { id: number; lb: number }[];
  parents: { cardId: number; rarity: number; level: number; positionId: number; charaName: string; factors: { factorId: number; level: number }[] }[];
  properTurf: number;
  properDirt: number;
  properShort: number;
  properMile: number;
  properMiddle: number;
  properLong: number;
  properNige: number;
  properSenko: number;
  properSashi: number;
  properOikomi: number;
  horseIndex: number;
};

const props = defineProps<{
  horsesDetailed: HorseDetail[];
  expandedRow: number | null;
  skillDb: Map<number, SkillEntry> | null | undefined;
  effectColors: Record<string, string>;
  styleColors: Record<string, string>;
  styleNames: Record<string, string>;
}>();

const emit = defineEmits<{
  toggleExpand: [horseIndex: number];
}>();

function toggleRow(horseIndex: number) {
  emit('toggleExpand', horseIndex);
}

function getParentGroup(parents: HorseDetail['parents'], groupIndex: number) {
  return groupIndex === 1
    ? parents.filter(p => p.positionId < 20)
    : parents.filter(p => p.positionId >= 20);
}
</script>

<template>
  <div class="px-6 pb-6">
    <h3 class="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
      <i class="ph-bold ph-list-checks text-indigo-400"></i>
      Race Results
      <span class="text-[10px] text-slate-600 font-normal ml-auto">Click a row for details</span>
    </h3>
    <div class="overflow-x-auto">
      <table class="w-full text-xs font-mono">
        <thead>
          <tr class="text-slate-500 border-b border-slate-700">
            <th class="text-left py-2 pr-1.5">#</th>
            <th class="text-left py-2 pr-1.5">No.</th>
            <th class="text-left py-2 pr-1.5"></th>
            <th class="text-left py-2 pr-1.5">Horse</th>
            <th class="text-left py-2 pr-1.5">Style</th>
            <th class="text-left py-2 pr-1.5">Mood</th>
            <th class="text-right py-2 pr-1.5">Time</th>
            <th class="text-right py-2 pr-1.5">Delay</th>
            <th class="text-right py-2 pr-1.5">Spurt</th>
            <th class="text-right py-2 pr-1.5">HP</th>
            <th class="text-right py-2 pr-1.5">Duel</th>
            <th class="text-right py-2 pr-1.5 text-amber-400/70" title="Downhill Duration">DnH</th>
            <th class="text-right py-2 pr-1.5 text-indigo-400/70" title="Pace Up Duration">P↑</th>
            <th class="text-right py-2 pr-1.5 text-orange-400/70" title="Pace Down Duration">P↓</th>
            <th class="text-right py-2 pr-1.5 text-sky-400">SPD</th>
            <th class="text-right py-2 pr-1.5 text-red-400">STA</th>
            <th class="text-right py-2 pr-1.5 text-orange-400">POW</th>
            <th class="text-right py-2 pr-1.5 text-pink-400">GUTS</th>
            <th class="text-right py-2 text-green-400">WIT</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="h in horsesDetailed" :key="h.horseIndex">
            <tr @click="toggleRow(h.horseIndex)"
                class="border-b border-slate-800 hover:bg-slate-800/30 cursor-pointer select-none"
                :class="{ 'bg-slate-800/20': expandedRow === h.horseIndex }">
              <td class="py-1.5 pr-1.5">
                <span class="font-black" :class="h.finishPosition === 1 ? 'text-amber-500' : h.finishPosition === 2 ? 'text-slate-300' : h.finishPosition === 3 ? 'text-orange-600' : 'text-slate-500'">
                  {{ h.finishPosition }}
                </span>
              </td>
              <td class="py-1.5 pr-1.5 text-slate-500">{{ h.postNumber }}</td>
              <td class="py-1.5 pr-1.5">
                <img :src="getUmaImagePath(h.charaName)" :alt="h.charaName"
                     class="w-6 h-6 rounded-full object-cover bg-slate-700 shrink-0"
                     @error="($event.target as HTMLImageElement).style.display='none'" />
              </td>
              <td class="py-1.5 pr-1.5 text-white font-bold truncate max-w-[120px]">{{ h.charaName }}</td>
              <td class="py-1.5 pr-1.5">
                <span class="px-1 py-0.5 rounded text-[9px] font-bold whitespace-nowrap"
                      :style="{ background: styleColors[h.styleNum] || '#6366f1', color: '#fff' }">
                  {{ h.styleName }}
                </span>
              </td>
              <td class="py-1.5 pr-1.5">
                <span class="text-[10px]" :class="moodClass(h.motivation)">{{ moodLabel(h.motivation) }}</span>
              </td>
              <td class="py-1.5 pr-1.5 text-right">
                <div class="text-slate-300">{{ h.finishTimeDisplay }}</div>
                <div v-if="h.gapDisplay" class="text-[9px] text-rose-400">{{ h.gapDisplay }}</div>
              </td>
              <td class="py-1.5 pr-1.5 text-right">
                <div class="text-sky-300">{{ h.startDelayMs }}ms</div>
                <div class="text-[9px]">
                  <span :class="h.isLateStart ? 'text-rose-400' : 'text-emerald-400'">{{ h.isLateStart ? 'Late' : 'Normal' }}</span>
                </div>
              </td>
              <td class="py-1.5 pr-1.5 text-right">
                <div :class="h.spurtDelay > 0 && h.spurtDelay > 20 ? 'text-rose-400' : h.spurtDelay > 4 ? 'text-amber-400' : 'text-cyan-300'">
                  {{ h.spurtDelay > 0 ? `Delay ${h.spurtDelay.toFixed(1)}m` : (h.lastSpurtDist > 0 ? `${h.lastSpurtDist.toFixed(0)}m` : '-') }}
                </div>
              </td>
              <td class="py-1.5 pr-1.5 text-right">
                <div :class="h.hpDied ? 'text-rose-400' : 'text-emerald-400'">
                  {{ h.hpDied ? `Died (-${(h.hpDeathDist ?? 0).toFixed(0)}m)` : 'Survived' }}
                </div>
                <div class="text-[9px] text-slate-500">
                  {{ h.hpDeficit !== undefined ? `-${h.hpDeficit.toFixed(0)} HP` : `${h.hpCurrent} HP` }} ({{ h.hpPercent.toFixed(1) }}%)
                </div>
              </td>
              <td class="py-1.5 pr-1.5 text-right text-amber-300">{{ h.duelDuration > 0 ? h.duelDuration.toFixed(1) + 's' : '-' }}</td>
              <td class="py-1.5 pr-1.5 text-right text-amber-400/80 text-[10px]">{{ h.downhillDuration > 0.5 ? h.downhillDuration.toFixed(1) + 's' : '-' }}</td>
              <td class="py-1.5 pr-1.5 text-right text-indigo-400/80 text-[10px]">{{ h.paceUpDuration > 0.5 ? h.paceUpDuration.toFixed(1) + 's' : '-' }}</td>
              <td class="py-1.5 pr-1.5 text-right text-orange-400/80 text-[10px]">{{ h.paceDownDuration > 0.5 ? h.paceDownDuration.toFixed(1) + 's' : '-' }}</td>
              <td class="py-1.5 pr-1.5 text-right text-sky-300">{{ h.speed || '-' }}</td>
              <td class="py-1.5 pr-1.5 text-right text-red-300">{{ h.stamina || '-' }}</td>
              <td class="py-1.5 pr-1.5 text-right text-orange-300">{{ h.power || '-' }}</td>
              <td class="py-1.5 pr-1.5 text-right text-pink-300">{{ h.guts || '-' }}</td>
              <td class="py-1.5 text-right text-green-400">{{ h.wiz || '-' }}</td>
            </tr>
            <tr v-if="expandedRow === h.horseIndex" class="border-b border-slate-700/50">
              <td colspan="19" class="py-3 px-4 bg-slate-900/40">
                <div class="space-y-3 text-[11px]">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <span class="text-slate-500 block text-[10px]">Trainer</span>
                      <span class="text-white">{{ h.trainerName }}</span>
                    </div>
                    <div>
                      <span class="text-slate-500 block text-[10px]">Finish Time</span>
                      <span class="text-white">{{ h.finishTimeDisplay }} ({{ h.finishTime.toFixed(3) }}s)</span>
                    </div>
                    <div>
                      <span class="text-slate-500 block text-[10px]">Gap</span>
                      <span class="text-rose-400">{{ h.gapDisplay || '-' }}</span>
                    </div>
                    <div>
                      <span class="text-slate-500 block text-[10px]">Defeat</span>
                      <span :class="h.defeat > 0 ? 'text-rose-400' : 'text-emerald-400'">{{ h.defeat > 0 ? `Defeated (${h.defeat})` : 'Normal' }}</span>
                    </div>
                    <div>
                      <span class="text-slate-500 block text-[10px]">Start Delay</span>
                      <span class="text-sky-300">{{ h.startDelayMs }}ms</span>
                      <span :class="h.isLateStart ? 'text-rose-400' : 'text-emerald-400'" class="text-[10px]">{{ h.isLateStart ? 'Late start' : 'Normal start' }}</span>
                    </div>
                    <div>
                      <span class="text-slate-500 block text-[10px]">HP (Final/Max)</span>
                      <span :class="h.hpDied ? 'text-rose-400' : 'text-emerald-400'">
                        {{ h.hpCurrent }} / {{ h.hpMax }}
                        <span class="text-slate-500">({{ h.hpPercent.toFixed(1) }}%)</span>
                      </span>
                    </div>
                    <div>
                      <span class="text-slate-500 block text-[10px]">Duel</span>
                      <span class="text-amber-300">{{ h.duelDuration > 0 ? `${h.duelDuration.toFixed(1)}s` : 'None' }}</span>
                    </div>
                    <div>
                      <span class="text-slate-500 block text-[10px]">Last Spurt</span>
                      <span class="text-cyan-300">{{ h.lastSpurtDist > 0 ? `${h.lastSpurtDist.toFixed(0)}m` : 'No spurt' }}</span>
                      <span v-if="h.spurtDelay > 0" class="text-rose-400">(delay {{ h.spurtDelay.toFixed(1) }}m)</span>
                    </div>
                  </div>

                  <div v-if="h.properTurf > 0" class="border-t border-slate-700/50 pt-2">
                    <span class="text-slate-400 font-bold text-[10px] tracking-wide">APTITUDES</span>
                    <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span class="text-slate-300">Turf <span class="font-bold" :class="gradeColor(h.properTurf)">{{ gradeLetter(h.properTurf) }}</span></span>
                      <span class="text-slate-300">Dirt <span class="font-bold" :class="gradeColor(h.properDirt)">{{ gradeLetter(h.properDirt) }}</span></span>
                      <span class="text-slate-300">Short <span class="font-bold" :class="gradeColor(h.properShort)">{{ gradeLetter(h.properShort) }}</span></span>
                      <span class="text-slate-300">Mile <span class="font-bold" :class="gradeColor(h.properMile)">{{ gradeLetter(h.properMile) }}</span></span>
                      <span class="text-slate-300">Mid <span class="font-bold" :class="gradeColor(h.properMiddle)">{{ gradeLetter(h.properMiddle) }}</span></span>
                      <span class="text-slate-300">Long <span class="font-bold" :class="gradeColor(h.properLong)">{{ gradeLetter(h.properLong) }}</span></span>
                      <span class="text-slate-300">Front Runner <span class="font-bold" :class="gradeColor(h.properNige)">{{ gradeLetter(h.properNige) }}</span></span>
                      <span class="text-slate-300">Pace Chaser <span class="font-bold" :class="gradeColor(h.properSenko)">{{ gradeLetter(h.properSenko) }}</span></span>
                      <span class="text-slate-300">Late Surger <span class="font-bold" :class="gradeColor(h.properSashi)">{{ gradeLetter(h.properSashi) }}</span></span>
                      <span class="text-slate-300">End Closer <span class="font-bold" :class="gradeColor(h.properOikomi)">{{ gradeLetter(h.properOikomi) }}</span></span>
                    </div>
                  </div>

                  <div v-if="h.skills.length" class="border-t border-slate-700/50 pt-2">
                    <span class="text-slate-400 font-bold text-[10px] tracking-wide">SKILLS ({{ h.skills.length }})</span>
                    <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 max-h-24 overflow-y-auto">
                      <span v-for="sk in h.skills" :key="sk.skill_id"
                            class="text-[10px] whitespace-nowrap"
                            :class="sk.usedCount > 0 ? 'text-emerald-300' : 'text-slate-500'">
                        <span :class="sk.usedCount > 0 ? 'text-emerald-400' : 'text-slate-600'">{{ sk.usedCount > 0 ? '●' : '○' }}</span>
                        <span class="text-white">{{ resolveSkillName(sk.skill_id, skillDb) }}</span>
                        <span v-if="sk.level > 1" class="text-amber-400">({{ sk.level }})</span>
                        <span v-if="sk.usedCount > 0" class="text-emerald-400 ml-0.5">{{ sk.usedCount }}x</span>
                      </span>
                    </div>
                  </div>

                  <div v-if="h.supportCards.length" class="border-t border-slate-700/50 pt-2">
                    <span class="text-slate-400 font-bold text-[10px] tracking-wide">SUPPORT DECK</span>
                    <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                      <span v-for="sc in h.supportCards" :key="sc.id" class="text-slate-400">
                        <span class="text-amber-400 text-[10px]">{{ resolveSupportCardRarity(sc.id) }}</span>
                        <span class="text-white">{{ getSupportCardNameByNumericId(sc.id) }}</span>
                        <span class="text-amber-400">LB{{ sc.lb }}</span>
                      </span>
                    </div>
                  </div>

                  <div v-if="h.parents.length" class="border-t border-slate-700/50 pt-2">
                    <span class="text-slate-400 font-bold text-[10px] tracking-wide">PARENTS</span>
                    <template v-for="gi in [1, 2]" :key="gi">
                      <template v-if="getParentGroup(h.parents, gi).length">
                        <div class="flex flex-wrap items-center gap-1 mt-1.5 mb-0.5">
                          <span class="text-slate-500 text-[10px] mr-1">#{{ gi }}</span>
                          <span v-for="(p, pi) in getParentGroup(h.parents, gi)" :key="pi" class="text-slate-400 text-[11px]">
                            <span class="text-white">{{ p.charaName }}</span>
                            <span class="text-amber-400 text-[10px]"> {{ ['', 'R', 'SR', 'SSR', 'SSR+'][p.rarity] || 'R' }}</span>
                            <span class="text-slate-500">Lv{{ p.level }}</span>
                            <span v-if="pi < getParentGroup(h.parents, gi).length - 1" class="text-slate-600 mx-1">|</span>
                          </span>
                        </div>
                        <div class="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-0.5 mb-1">
                          <span v-for="(f, fi) in aggregateFactors(getParentGroup(h.parents, gi).flatMap(p => p.factors))" :key="gi + '-' + fi"
                                :class="getFactorColor(f.factorId)" class="text-[11px]">
                            {{ getFactorLabel(f.factorId, f.level, skillDb) }}
                          </span>
                        </div>
                      </template>
                    </template>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
