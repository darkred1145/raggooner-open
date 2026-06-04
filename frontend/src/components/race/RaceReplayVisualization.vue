<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, toRef } from 'vue';
import { CHARACTER_ID_TO_NAME } from '../../utils/umaData';
import type { RaceSimulateData } from '../../utils/raceSimDecoder';
import { loadSkillDatabase, buildSkillIndex } from '../../utils/skillDatabase';
import type { SkillEntry } from '../../utils/skillDatabase';
import { courseDataLoader } from '../../utils/courseDataLoader';
import {
  getCourseSegments, getInterpolatedFrame, clamp,
  styleNames, styleColors, styleDisplayNames, effectColors, groundLabels,
  type ReplayData, type ReplayHorse,
} from '../../utils/raceReplayUtils';
import { computeHeuristicEvents, computeHpOutcome, computeDuelDurations } from '../../utils/raceHeuristicEvents';
import type { HeuristicSummary, HeuristicHorseInfo } from '../../utils/raceHeuristicEvents';
import { MOOD_INPUT_MAP } from '../../utils/raceReplayUtils';
import { useRaceCanvas } from '../../composables/useRaceCanvas';
import RaceReplayControls from './RaceReplayControls.vue';
import RaceMinimap from './RaceMinimap.vue';
import RaceResultsTable from './RaceResultsTable.vue';
import type { HorseDetail } from './RaceResultsTable.vue';
import RaceProgressBars from './RaceProgressBars.vue';
import RacePositionsPanel from './RacePositionsPanel.vue';
import RaceActiveSkillsPanel from './RaceActiveSkillsPanel.vue';

export type { ReplayData, ReplayHorse };

const props = defineProps<{
  replayData: ReplayData;
  simData?: RaceSimulateData | null;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const replayWrap = ref<HTMLDivElement | null>(null);
const isFullscreen = ref(false);
const playing = ref(false);
const done = ref(false);
const elapsedTime = ref(0);
const seeking = ref(false);
const playbackSpeed = ref(2);
let animFrame = 0;
let lastTimestamp = 0;

const skillDb = ref<Map<number, SkillEntry> | null>(null);
const skillDbLoaded = ref(false);
const expandedRow = ref<number | null>(null);
const courseDataReady = ref(false);

const horseMap = computed(() => {
  const map = new Map<number, ReplayHorse>();
  for (const h of props.replayData.RaceHorse) {
    map.set(h.horseIndex, h);
  }
  return map;
});

const horsesByFinish = computed(() => {
  const d = props.replayData;
  const order = d.HorseIndexByFinishOrder;
  return order
    .map((idx, i) => ({ ...horseMap.value.get(idx)!, finishPosition: i + 1 }))
    .filter(h => h);
});

const courseInfo = computed(() => {
  const d = props.replayData;
  const cs = d.RaceCourseSet;
  return {
    distance: cs.Distance,
    ground: groundLabels[cs.Ground] || 'Unknown',
    turn: d.RotationCategory,
    distanceType: d.CourseDistanceType,
    weather: d.Weather,
    season: d.Season,
    condition: d.GroundCondition,
  };
});

const totalDistance = computed(() => props.replayData.RaceCourseSet.Distance || 2400);

const lastFrameTime = computed(() => {
  const frames = props.simData?.frames;
  if (!frames || frames.length === 0) return 1;
  return frames[frames.length - 1]!.time;
});

const hasSimData = computed(() => !!props.simData && props.simData.frames.length > 0);

const {
  sortedByDistance,
  activeSkills,
  loadCharImages,
  render: canvasRender,
} = useRaceCanvas({
  canvasRef,
  replayData: props.replayData,
  simData: toRef(props, 'simData'),
  elapsedTime,
  skillDb,
  totalDistance,
  horsesByFinish,
});

const replayTime = computed(() => elapsedTime.value.toFixed(2));

const totalTime = computed(() => {
  if (!props.simData?.frames?.length) return 1;
  return props.simData.frames[props.simData.frames.length - 1]!.time;
});

const phaseMarkers = computed(() => {
  if (!props.simData?.frames?.length) return [];
  const frames = props.simData.frames;
  const segs = getCourseSegments(totalDistance.value, props.replayData.RaceCourseSet?.Id, courseDataReady.value)
    .filter(s => s.type === 'straight' || s.type === 'corner');
  const markers: { time: number; label: string }[] = [];
  for (const seg of segs) {
    let t = 0;
    for (let i = 0; i < frames.length; i++) {
      const maxDist = Math.max(...frames[i]!.horseFrames.map(h => h.distance));
      if (maxDist >= seg.start || i === frames.length - 1) {
        t = frames[i]!.time;
        break;
      }
    }
    markers.push({ time: t, label: seg.label + (seg.type === 'corner' ? ' ↩' : '') });
  }
  return markers;
});

const leaderDistNow = computed(() => {
  if (!props.simData?.frames.length) return 0;
  const hf = getInterpolatedFrame(props.simData, elapsedTime.value);
  if (!hf.length) return 0;
  return Math.max(...hf.map(h => h.distance));
});

const minimapSegments = computed(() => {
  return getCourseSegments(totalDistance.value, props.replayData.RaceCourseSet?.Id, courseDataReady.value);
});

function formatRaceTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(4).padStart(7, '0')}`;
}

function startAnimation(sd: RaceSimulateData, fromTime?: number) {
  playing.value = true;
  done.value = false;
  if (fromTime == null) elapsedTime.value = 0;
  lastTimestamp = 0;

  const step = (timestamp: number) => {
    if (!playing.value) return;
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const rawDt = (timestamp - lastTimestamp) / 1000;
    const dt = Math.min(rawDt, 0.05);
    lastTimestamp = timestamp;
    elapsedTime.value = Math.min(elapsedTime.value + dt * playbackSpeed.value, lastFrameTime.value);
    canvasRender(timestamp, sd);
    if (elapsedTime.value >= lastFrameTime.value) {
      done.value = true;
      playing.value = false;
      return;
    }
    animFrame = requestAnimationFrame(step);
  };
  animFrame = requestAnimationFrame(step);
}

const play = (fromTime?: number) => {
  if (!props.simData) return;
  cancelAnimationFrame(animFrame);
  startAnimation(props.simData, fromTime);
};

const stop = () => {
  playing.value = false;
  cancelAnimationFrame(animFrame);
  elapsedTime.value = 0;
  done.value = false;
  if (props.simData) canvasRender(0, props.simData);
};

const pause = () => { playing.value = false; cancelAnimationFrame(animFrame); };

const togglePlay = () => {
  if (!props.simData) return;
  if (done.value) { resetAnim(); setTimeout(() => play(), 50); return; }
  if (playing.value) { pause(); return; }
  play(elapsedTime.value);
};

const seekTo = (time: number) => {
  elapsedTime.value = clamp(time, 0, totalTime.value);
  if (props.simData) canvasRender(performance.now(), props.simData);
};

const onSeekInput = (value: number) => {
  seeking.value = true;
  elapsedTime.value = value;
};

const onSeekChange = (value: number) => {
  seeking.value = false;
  if (props.simData) seekTo(value);
};

const resetAnim = () => {
  stop();
  elapsedTime.value = 0;
  done.value = false;
  if (props.simData) canvasRender(0, props.simData);
};

const toggleFullscreen = () => {
  if (!replayWrap.value) return;
  if (!document.fullscreenElement) {
    replayWrap.value.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};

function moodToNumber(raw: string): number {
  const labelToNum: Record<string, number> = { Great: 5, Good: 4, Normal: 3, Bad: 2, Awful: 1 };
  const entry = MOOD_INPUT_MAP[raw.toLowerCase().trim()];
  return labelToNum[entry?.label ?? 'Normal'] ?? 3;
}

function getDistanceProficiency(horse: ReplayHorse, distance: number): number {
  const d = horse._responseHorseData;
  if (!d) return 7;
  if (distance <= 1400) return d.proper_distance_short ?? 7;
  if (distance <= 1800) return d.proper_distance_mile ?? 7;
  if (distance <= 2400) return d.proper_distance_middle ?? 7;
  return d.proper_distance_long ?? 7;
}

function getStrategyProficiency(horse: ReplayHorse): number {
  const d = horse._responseHorseData;
  if (!d) return 7;
  const style = d.running_style;
  if (style === 1) return d.proper_running_style_nige ?? 7;
  if (style === 2) return d.proper_running_style_senko ?? 7;
  if (style === 3) return d.proper_running_style_sashi ?? 7;
  if (style === 4) return d.proper_running_style_oikomi ?? 7;
  return 7;
}

const horsesDetailed = computed<HorseDetail[]>(() => {
  const sd = props.simData;
  const frames = sd?.frames ?? [];
  const events = sd?.events ?? [];
  const totalDist = totalDistance.value;

  const deathInfo = new Map<number, ReturnType<typeof computeHpOutcome>>();
  const duelDurations = new Map<number, number>();
  const lateStart = new Map<number, boolean>();
  const usedSkills = new Map<number, Map<number, number>>();

  const slopes = courseDataReady.value && props.replayData.RaceCourseSet.Id
    ? courseDataLoader.getSlopes(props.replayData.RaceCourseSet.Id)
    : [];
  const horseInfoArr: HeuristicHorseInfo[] = horsesByFinish.value.map(h => ({
    horseIndex: h.horseIndex,
    strategy: h._responseHorseData?.running_style ?? 1,
    speed: h._raceParam?.RawSpeed ?? 0,
    stamina: h._raceParam?.RawStamina ?? 0,
    pow: h._raceParam?.RawPow ?? 0,
    guts: h._raceParam?.RawGuts ?? 0,
    wiz: h._raceParam?.RawWiz ?? 0,
    mood: moodToNumber(h._raceParam?.Motivation ?? 'normal'),
    distanceProficiency: getDistanceProficiency(h, totalDist),
    strategyProficiency: getStrategyProficiency(h),
  }));
  const lastSpurtDists = sd?.horseResults?.map(r => r.lastSpurtStartDistance) ?? [];
  const heuristicEvents: Map<number, HeuristicSummary> = slopes.length > 0 && frames.length > 0
    ? computeHeuristicEvents(frames, totalDist, slopes, horseInfoArr, lastSpurtDists)
    : new Map();

  if (frames.length) {
    for (let j = 0; j < (frames[0]?.horseFrames.length ?? 0); j++) {
      deathInfo.set(j, computeHpOutcome(j, frames, totalDist));
      duelDurations.set(j, computeDuelDurations(j, frames, events));
      const accel0 = frames.length > 1 ? ((frames[1]!.horseFrames[j]?.speed ?? 0) / 100 - (frames[0]!.horseFrames[j]?.speed ?? 0) / 100) / (frames[1]!.time - frames[0]!.time) : 0;
      lateStart.set(j, accel0 < 0.0001);
      const horseSkillEvents = events.filter(e => e.type === 3 && e.param[0] === j).map(e => e.param[1]).filter((s): s is number => s != null);
      const counts = new Map<number, number>();
      for (const sid of horseSkillEvents) counts.set(sid, (counts.get(sid) ?? 0) + 1);
      usedSkills.set(j, counts);
    }
  }

  return horsesByFinish.value.map(horse => {
    const hr = sd?.horseResults?.[horse.horseIndex];
    const hpInfo = deathInfo.get(horse.horseIndex) ?? { current: 0, max: 1000, died: false };
    const styleNum = horse._responseHorseData?.running_style ?? 0;
    const phase3Start = totalDist * 2 / 3;
    const spurtDist = hr?.lastSpurtStartDistance ?? 0;
    const spurtDelay = spurtDist > 0 ? spurtDist - phase3Start : 0;
    return {
      finishPosition: horse.finishPosition,
      postNumber: horse.postNumber,
      charaName: horse.charaName,
      trainerName: horse._responseHorseData?.trainer_name || '???',
      styleNum,
      styleName: styleDisplayNames[styleNum] || styleNames[styleNum] || '???',
      motivation: horse._raceParam?.Motivation || '-',
      finishTime: horse.FinishTimeScaled,
      finishTimeDisplay: formatRaceTime(horse.FinishTimeScaled),
      gapDisplay: horse.FinishDiffTimeFromPrev > 0 ? `+${horse.FinishDiffTimeFromPrev.toFixed(1)}m` : '',
      speed: horse._raceParam?.RawSpeed ?? 0,
      stamina: horse._raceParam?.RawStamina ?? 0,
      power: horse._raceParam?.RawPow ?? 0,
      guts: horse._raceParam?.RawGuts ?? 0,
      wiz: horse._raceParam?.RawWiz ?? 0,
      startDelayMs: hr ? Math.round(hr.startDelayTime * 1000) : 0,
      isLateStart: lateStart.get(horse.horseIndex) ?? false,
      lastSpurtDist: spurtDist,
      spurtDelay: spurtDelay,
      defeat: hr?.defeat ?? 0,
      hpCurrent: hpInfo.current, hpMax: hpInfo.max,
      hpPercent: hpInfo.max > 0 ? (hpInfo.current / hpInfo.max * 100) : 0,
      hpDied: hpInfo.died,
      hpDeathDist: hpInfo.deathDist,
      hpDeficit: hpInfo.deficit,
      duelDuration: duelDurations.get(horse.horseIndex) ?? 0,
      downhillDuration: heuristicEvents.get(horse.horseIndex)?.downhillDuration ?? 0,
      paceUpDuration: heuristicEvents.get(horse.horseIndex)?.paceUpDuration ?? 0,
      paceDownDuration: heuristicEvents.get(horse.horseIndex)?.paceDownDuration ?? 0,
      overtakeDuration: heuristicEvents.get(horse.horseIndex)?.overtakeDuration ?? 0,
      speedUpDuration: heuristicEvents.get(horse.horseIndex)?.speedUpDuration ?? 0,
      skills: (horse._responseHorseData?.skill_array ?? []).filter(sk => sk != null).map(sk => ({ ...sk, usedCount: usedSkills.get(horse.horseIndex)?.get(sk.skill_id) ?? 0 })),
      factors: (horse.TrainedCharaData?.FactorDataArray ?? []).filter(f => f != null).map(f => ({ factorId: f.FactorId, level: f.FactorLv })),
      supportCards: (horse.TrainedCharaData?.SupportCardArray ?? []).filter(sc => sc != null).map(sc => ({ id: sc.SupportCardId, lb: sc.LimitBreakCount })),
      parents: (horse.TrainedCharaData?.SuccessionCharaList?._items ?? []).filter(p => p != null).map(p => ({
        cardId: p.CardId, rarity: p.Rarity, level: p.Level,
        charaName: CHARACTER_ID_TO_NAME.get(p.CardId) || `#${p.CardId}`,
        factors: (p.FactorDataArray ?? []).filter(f => f != null).map(f => ({ factorId: f.FactorId, level: f.FactorLv })),
      })),
      properTurf: horse._responseHorseData?.proper_ground_turf ?? 0,
      properDirt: horse._responseHorseData?.proper_ground_dirt ?? 0,
      properShort: horse._responseHorseData?.proper_distance_short ?? 0,
      properMile: horse._responseHorseData?.proper_distance_mile ?? 0,
      properMiddle: horse._responseHorseData?.proper_distance_middle ?? 0,
      properLong: horse._responseHorseData?.proper_distance_long ?? 0,
      properNige: horse._responseHorseData?.proper_running_style_nige ?? 0,
      properSenko: horse._responseHorseData?.proper_running_style_senko ?? 0,
      properSashi: horse._responseHorseData?.proper_running_style_sashi ?? 0,
      properOikomi: horse._responseHorseData?.proper_running_style_oikomi ?? 0,
      horseIndex: horse.horseIndex,
    };
  });
});

onMounted(async () => {
  loadCharImages();
  try {
    skillDb.value = buildSkillIndex(await loadSkillDatabase());
    skillDbLoaded.value = true;
  } catch {
    console.warn('Skill database not available, using fallback names');
  }
  try {
    await courseDataLoader.initialize();
    courseDataReady.value = true;
  } catch {
    console.warn('Course data not available, slope analysis disabled');
  }
  if (hasSimData.value && props.simData) {
    nextTick(() => canvasRender(0, props.simData!));
  }
});

onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
});

onUnmounted(() => {
  cancelAnimationFrame(animFrame);
  document.removeEventListener('fullscreenchange', () => {});
});

watch(() => props.simData, (sd) => {
  if (sd) {
    nextTick(() => canvasRender(0, sd));
  }
});
</script>

<template>
  <div ref="replayWrap" class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
       :class="{ '!max-h-none !rounded-none !border-0': isFullscreen }">
    <div class="p-6 border-b border-slate-700 flex items-start justify-between gap-4">
      <div class="space-y-1 w-full">
        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
          <i class="ph-bold ph-video text-indigo-400"></i>
          Race Replay
        </h2>
        <div v-if="courseInfo" class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
          <span class="flex items-center gap-1"><i class="ph ph-map-pin text-slate-500"></i>{{ courseInfo.distance }}m {{ courseInfo.ground }}</span>
          <span class="flex items-center gap-1"><i class="ph ph-arrows-turn-right text-slate-500"></i>{{ courseInfo.turn }}</span>
          <span class="flex items-center gap-1"><i class="ph ph-sun text-slate-500"></i>{{ courseInfo.weather }} / {{ courseInfo.condition }}</span>
          <span class="flex items-center gap-1"><i class="ph ph-tree text-slate-500"></i>{{ courseInfo.season }}</span>
          <span class="flex items-center gap-1"><i class="ph ph-hash text-slate-500"></i>Seed: {{ replayData.RandomSeed }}</span>
          <span class="flex items-center gap-1"><i class="ph ph-users text-slate-500"></i>{{ horsesByFinish.length }} horses</span>
          <span v-if="hasSimData" class="flex items-center gap-1 text-emerald-400"><i class="ph ph-check-circle"></i>Sim data</span>
        </div>
      </div>
    </div>

    <RaceReplayControls
      :has-sim-data="hasSimData"
      :total-time="totalTime"
      :elapsed-time="elapsedTime"
      :playing="playing"
      :done="done"
      :playback-speed="playbackSpeed"
      :is-fullscreen="isFullscreen"
      :replay-time="replayTime"
      :phase-markers="phaseMarkers"
      @toggle-play="togglePlay"
      @stop="stop"
      @seek-input="onSeekInput"
      @seek-change="onSeekChange"
      @set-speed="playbackSpeed = $event"
      @toggle-fullscreen="toggleFullscreen"
    />

    <div class="p-4 flex items-center justify-center bg-slate-950/50">
      <canvas ref="canvasRef" width="1200" height="500" class="w-full h-auto rounded-lg" style="max-width:1200px"></canvas>
    </div>

    <RaceMinimap
      :leader-dist-now="leaderDistNow"
      :total-distance="totalDistance"
      :minimap-segments="minimapSegments"
    />

    <RaceProgressBars v-if="!hasSimData" :horses-by-finish="horsesByFinish" :is-done="done" />

    <RacePositionsPanel v-if="hasSimData" :sorted-by-distance="sortedByDistance" />

    <RaceActiveSkillsPanel :active-skills="activeSkills" :horse-map="horseMap" />

    <RaceResultsTable
      :horses-detailed="horsesDetailed"
      :expanded-row="expandedRow"
      :skill-db="skillDb"
      :effect-colors="effectColors"
      :style-colors="styleColors"
      :style-names="styleNames"
      @toggle-expand="expandedRow = expandedRow === $event ? null : $event"
    />
  </div>
</template>
