<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { getUmaImagePath } from '../../utils/umaData';
import type { RaceSimulateData, FrameData, HorseFrameData, EventData } from '../../utils/raceSimDecoder';
import { loadSkillDatabase, buildSkillIndex } from '../../utils/skillDatabase';
import type { SkillEntry, SkillEffectCategory } from '../../utils/skillDatabase';
import { getSkillName } from '../../utils/skillData';
import { courseDataLoader } from '../../utils/courseDataLoader';
import {
  BASE_SPEED_CONSTANT, BASE_SPEED_COURSE_OFFSET, BASE_SPEED_COURSE_SCALE,
  HP_CONSUMPTION_SCALE, HP_CONSUMPTION_SPEED_OFFSET, HP_CONSUMPTION_DIVISOR,
  DOWNHILL_BONUS_BASE, DOWNHILL_BONUS_DIVISOR,
  DOWNHILL_HP_RATIO_THRESHOLD, DOWNHILL_HP_RATIO_STRONG,
  PACE_UP_MULTIPLIER, PACE_DOWN_MULTIPLIER,
  MIN_EVENT_DURATION,
} from '../../utils/raceConstants';
import { getSkillName as getSkillNameFromData } from '../../utils/skillData';
import { getSupportCardNameByNumericId } from '../../utils/supportCardData';

const GRADE_LETTERS = ['', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];
const GRADE_COLORS: Record<string, string> = {
  'S': 'text-yellow-300', 'A': 'text-green-400', 'B': 'text-blue-400',
  'C': 'text-slate-300', 'D': 'text-slate-400', 'E': 'text-slate-500',
  'F': 'text-slate-500', 'G': 'text-slate-600',
};

function gradeLetter(val: number): string {
  return GRADE_LETTERS[val] || '?';
}

function gradeColor(val: number): string {
  const letter = GRADE_LETTERS[val];
  return (letter ? GRADE_COLORS[letter] : undefined) || 'text-slate-500';
}

const MOOD_INPUT_MAP: Record<string, { label: string; cls: string }> = {
  'great':            { label: 'Great', cls: 'text-amber-400' },
  'good':             { label: 'Good',  cls: 'text-lime-400' },
  'normal':           { label: 'Normal', cls: 'text-slate-400' },
  'bad':              { label: 'Bad',   cls: 'text-blue-400' },
  'awful':            { label: 'Awful', cls: 'text-slate-500' },
  'very motivated':   { label: 'Great', cls: 'text-amber-400' },
  'motivated':        { label: 'Good',  cls: 'text-lime-400' },
  'unmotivated':      { label: 'Bad',   cls: 'text-blue-400' },
  'very unmotivated': { label: 'Awful', cls: 'text-slate-500' },
  'very high':        { label: 'Great', cls: 'text-amber-400' },
  'high':             { label: 'Good',  cls: 'text-lime-400' },
  'medium':           { label: 'Normal', cls: 'text-slate-400' },
  'low':              { label: 'Bad',   cls: 'text-blue-400' },
  'very low':         { label: 'Awful', cls: 'text-slate-500' },
  '絶好調':            { label: 'Great', cls: 'text-amber-400' },
  '好調':             { label: 'Good',  cls: 'text-lime-400' },
  '普通':             { label: 'Normal', cls: 'text-slate-400' },
  '不調':             { label: 'Bad',   cls: 'text-blue-400' },
  '絶不調':            { label: 'Awful', cls: 'text-slate-500' },
};
function moodLabel(v: string): string {
  return MOOD_INPUT_MAP[v.toLowerCase().trim()]?.label ?? v;
}
function moodClass(v: string): string {
  return MOOD_INPUT_MAP[v.toLowerCase().trim()]?.cls ?? 'text-slate-500';
}

function resolveSkillName(skillId: number): string {
  const se = skillDb.value?.get(skillId);
  return se?.name_en || se?.enname || getSkillNameFromData(skillId) || `Skill #${skillId}`;
}

function resolveSupportCardRarity(cardId: number): string {
  if (cardId >= 30000) return 'SSR';
  if (cardId >= 20000) return 'SR';
  return 'R';
}

export type ReplayHorse = {
  horseIndex: number;
  postNumber: number;
  charaId: number;
  charaName: string;
  FinishOrder: number;
  FinishTimeRaw: number;
  FinishTimeScaled: number;
  FinishDiffTimeFromPrev: number;
  _raceParam: {
    RawSpeed: number;
    RawStamina: number;
    RawPow: number;
    RawGuts: number;
    RawWiz: number;
    Motivation: string;
  };
  _responseHorseData: {
    trainer_name: string;
    card_id: number;
    chara_id: number;
    rarity: number;
    talent_level: number;
    frame_order: number;
    running_style: number;
    speed: number;
    stamina: number;
    pow: number;
    guts: number;
    wiz: number;
    skill_array?: { skill_id: number; level: number }[];
    proper_ground_turf?: number;
    proper_ground_dirt?: number;
    proper_distance_short?: number;
    proper_distance_mile?: number;
    proper_distance_middle?: number;
    proper_distance_long?: number;
    proper_running_style_nige?: number;
    proper_running_style_senko?: number;
    proper_running_style_sashi?: number;
    proper_running_style_oikomi?: number;
    popularity?: number;
  };
  TrainedCharaData?: {
    _cardId?: number;
    AcquiredSkillArray?: { _masterId: number; _level: number }[];
    FactorDataArray?: { FactorId: number; FactorLv: number }[];
    SupportCardArray?: { SupportCardId: number; LimitBreakCount: number }[];
    SuccessionCharaList?: {
      _items?: {
        _positionId: number;
        CardId: number;
        Rarity: number;
        Level: number;
        _rank: number;
        FactorDataArray?: { FactorId: number; FactorLv: number }[];
      }[];
    };
    _properGroundTurf?: number;
    _properGroundDirt?: number;
    _properDistanceShort?: number;
    _properDistanceMile?: number;
    _properDistanceMiddle?: number;
    _properDistanceLong?: number;
    _properRunningStyleNige?: number;
    _properRunningStyleSenko?: number;
    _properRunningStyleSashi?: number;
    _properRunningStyleOikomi?: number;
  };
};

export type ReplayData = {
  RaceType: string;
  RandomSeed: number;
  RaceCourseSet: { Distance: number; Ground: number; Turn: number; FloatLaneMax?: number; Id?: number; RaceTrackId?: number; };
  RotationCategory: string;
  CourseDistanceType: string;
  GroundCondition: string;
  Weather: string;
  Season: string;
  HorseIndexByFinishOrder: number[];
  HorseIndexByPopularity: number[];
  RaceHorse: ReplayHorse[];
  PlayerTeamMemberArray: ReplayHorse[];
};

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

const styleNames: Record<number, string> = { 1: 'Nige', 2: 'Senko', 3: 'Sashi', 4: 'Oikomi' };
const styleColors: Record<number, string> = { 1: '#ef4444', 2: '#3b82f6', 3: '#22c55e', 4: '#a855f7' };
const groundLabels: Record<number, string> = { 1: 'Turf', 2: 'Dirt' };

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

const skillDb = ref<Map<number, SkillEntry> | null>(null);
const skillDbLoaded = ref(false);

const sortedByDistance = ref<{ horseIndex: number; distance: number; speed: number; name: string; style: number; lanePos: number; blocked: boolean; blockingHorse: number; hp: number; }[]>([]);
const activeSkills = ref<{ frameTime: number; horseIndex: number; skillId: number; name: string; category: string; desc: string; remaining: number; }[]>([]);
const charImages = ref<Map<number, HTMLImageElement>>(new Map());

const CW = 1200;
const CH = 500;
const CX = 0;
const TRACK_Y = 44;
const TRACK_H = 14;
const ICON_R = 24;
const VIEWPORT_M = 120;

const HORSE_Y_MIN = TRACK_Y + TRACK_H + 22;
const HORSE_Y_RANGE = CH - 14 - HORSE_Y_MIN;

const effectColors: Record<string, string> = {
  speed: '#22d3ee',
  stamina: '#34d399',
  accel: '#f97316',
  buff: '#818cf8',
  debuff: '#f43f5e',
  other: '#94a3b8',
};

const getXFromDist = (dist: number, leaderDist: number) => {
  const half = VIEWPORT_M / 2;
  const leftEdge = Math.max(0, leaderDist - half);
  const rightEdge = Math.min(totalDistance.value, leftEdge + VIEWPORT_M);
  const visible = rightEdge - leftEdge;
  if (visible <= 0) return CX + 10;
  return CX + 10 + ((dist - leftEdge) / visible) * (CW - 20);
};

const getViewportBounds = (leaderDist: number) => {
  const half = VIEWPORT_M / 2;
  let left = Math.max(0, leaderDist - half);
  let right = Math.min(totalDistance.value, left + VIEWPORT_M);
  if (right - left < VIEWPORT_M) left = Math.max(0, right - VIEWPORT_M);
  return { left, right, span: right - left };
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function bisectFrameIndex(frames: FrameData[], time: number): number {
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (frames[mid]!.time <= time) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function getInterpolatedFrame(simData: RaceSimulateData, time: number): HorseFrameData[] {
  const frames = simData.frames;
  if (frames.length === 0) return [];
  if (time <= frames[0]!.time) return frames[0]!.horseFrames;
  if (time >= frames[frames.length - 1]!.time) return frames[frames.length - 1]!.horseFrames;

  const idx = bisectFrameIndex(frames, time);
  const a = frames[idx]!;
  const b = frames[Math.min(idx + 1, frames.length - 1)]!;
  const t = a.time === b.time ? 0 : (time - a.time) / (b.time - a.time);

  return a.horseFrames.map((hf, i) => ({
    distance: lerp(hf.distance, b.horseFrames[i]!.distance, t),
    lanePosition: Math.round(lerp(hf.lanePosition, b.horseFrames[i]!.lanePosition, t)),
    speed: Math.round(lerp(hf.speed, b.horseFrames[i]!.speed, t)),
    hp: Math.round(lerp(hf.hp, b.horseFrames[i]!.hp, t)),
    temptationMode: hf.temptationMode,
    blockFrontHorseIndex: hf.blockFrontHorseIndex,
  }));
}

function getCourseSegments(totalDist: number): { start: number; end: number; type: 'straight' | 'corner'; label: string }[] {
  if (totalDist <= 0) return [];
  const s15 = totalDist * 0.15;
  const s25 = totalDist * 0.25;
  const s60 = totalDist * 0.60;
  const s70 = totalDist * 0.70;
  return [
    { start: 0, end: s15, type: 'straight', label: 'Start' },
    { start: s15, end: s25, type: 'corner', label: 'C1' },
    { start: s25, end: s60, type: 'straight', label: 'Back' },
    { start: s60, end: s70, type: 'corner', label: 'C2' },
    { start: s70, end: totalDist, type: 'straight', label: 'Final' },
  ];
}

const STRAIGHT_COLOR = 'rgba(79, 109, 122, 0.15)';
const CORNER_COLOR = 'rgba(192, 139, 91, 0.13)';

function drawCourseBands(ctx: CanvasRenderingContext2D, leaderDist: number) {
  const segments = getCourseSegments(totalDistance.value);
  for (const seg of segments) {
    const x1 = getXFromDist(seg.start, leaderDist);
    const x2 = getXFromDist(seg.end, leaderDist);
    if (x2 < CX + 8 || x1 > CX + CW - 8) continue;
    const lx = Math.max(CX + 8, x1);
    const rx = Math.min(CX + CW - 8, x2);
    const w = rx - lx;
    if (w < 1) continue;
    ctx.fillStyle = seg.type === 'corner' ? CORNER_COLOR : STRAIGHT_COLOR;
    ctx.fillRect(lx, TRACK_Y, w, CH - TRACK_Y - 8);
    ctx.fillStyle = seg.type === 'corner' ? 'rgba(192, 139, 91, 0.35)' : 'rgba(79, 109, 122, 0.25)';
    ctx.fillRect(lx, TRACK_Y, w, TRACK_H);
    ctx.fillStyle = seg.type === 'corner' ? 'rgba(192, 139, 91, 0.55)' : 'rgba(148, 163, 184, 0.35)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const cx = (lx + rx) / 2;
    ctx.fillText(seg.label + (seg.type === 'corner' ? '↩' : ''), cx, TRACK_Y + TRACK_H + 22);
  }
}

function drawTrack(ctx: CanvasRenderingContext2D, leaderDist: number) {
  drawCourseBands(ctx, leaderDist);

  ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
  ctx.fillRect(CX + 10, TRACK_Y, CW - 20, TRACK_H);
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(CX + 10, TRACK_Y, CW - 20, TRACK_H);

  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (let m = 0; m <= totalDistance.value; m += 50) {
    const x = getXFromDist(m, leaderDist);
    if (x < CX + 8 || x > CX + CW - 8) continue;
    ctx.beginPath();
    ctx.moveTo(x, TRACK_Y);
    ctx.lineTo(x, TRACK_Y + TRACK_H);
    ctx.strokeStyle = m === 0 || m === totalDistance.value ? 'rgba(251, 191, 36, 0.6)' : 'rgba(100, 116, 139, 0.25)';
    ctx.lineWidth = m === 0 || m === totalDistance.value ? 2 : 1;
    ctx.stroke();
    if (m > 0 && m < totalDistance.value) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.fillText(m + 'm', x, TRACK_Y - 4);
    }
  }

  const goalX = getXFromDist(totalDistance.value, leaderDist);
  if (goalX >= CX + 8 && goalX <= CX + CW - 8) {
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('GOAL', goalX, TRACK_Y - 14);
  }
}

function loadCharImages() {
  for (const h of props.replayData.RaceHorse) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      charImages.value.set(h.charaId, img);
      if (canvasRef.value) charImages.value = new Map(charImages.value);
    };
    img.onerror = () => {
      const fallback = new Image();
      fallback.src = `https://gametora.com/images/umamusume/characters/chara_stand_${Math.floor(h.charaId / 100)}_${h.charaId}.png`;
      fallback.crossOrigin = 'anonymous';
      fallback.onload = () => {
        charImages.value.set(h.charaId, fallback);
        if (canvasRef.value) charImages.value = new Map(charImages.value);
      };
    };
    img.src = getUmaImagePath(h.charaName);
  }
}

const HP_WARN_THRESHOLD = 200;

function drawHorses(ctx: CanvasRenderingContext2D, horseFrames: HorseFrameData[]) {
  const entries = horseFrames.map((hf, i) => ({
    hf, meta: horseMap.value.get(i), horseIndex: i,
  }));
  entries.sort((a, b) => b.hf.distance - a.hf.distance);

  const leaderDist = entries[0]?.hf.distance ?? 0;

  let minLane = Infinity, maxLane = 0;
  for (const e of horseFrames) {
    if (e.lanePosition < minLane) minLane = e.lanePosition;
    if (e.lanePosition > maxLane) maxLane = e.lanePosition;
  }
  maxLane = Math.max(maxLane, 1);
  const laneSpread = maxLane - minLane;

  sortedByDistance.value = entries.map((e) => ({
    horseIndex: e.horseIndex,
    distance: e.hf.distance,
    speed: e.hf.speed,
    name: e.meta?.charaName ?? `Horse ${e.horseIndex}`,
    style: e.meta?._responseHorseData?.running_style ?? 0,
    lanePos: e.hf.lanePosition,
    blocked: e.hf.blockFrontHorseIndex >= 0,
    blockingHorse: e.hf.blockFrontHorseIndex,
    hp: e.hf.hp,
  }));

  const horseRects: { x: number; y: number; name: string; trainer: string; isTop3: boolean; color: string; postNumber: number; style: number; blocked: boolean; blockingHorse: number; hp: number; speed: number; charaId: number; meta: ReplayHorse }[] = [];

  for (const e of entries) {
    const meta = e.meta;
    if (!meta) continue;

    const x = getXFromDist(e.hf.distance, leaderDist);
    if (x < CX - 40 || x > CX + CW + 40) continue;

    const laneRatio = laneSpread > 0 ? clamp((e.hf.lanePosition - minLane) / laneSpread, 0, 1) : 0.5;
    const y = HORSE_Y_MIN + (1 - laneRatio) * HORSE_Y_RANGE;
    const isTop3 = horsesByFinish.value.indexOf(meta as any) < 3;
    const style = meta._responseHorseData?.running_style ?? 0;
    const color = styleColors[style] || '#6366f1';

    horseRects.push({
      x, y, name: meta.charaName, trainer: meta._responseHorseData?.trainer_name || '',
      isTop3, color, postNumber: meta.postNumber,
      style, blocked: e.hf.blockFrontHorseIndex >= 0,
      blockingHorse: e.hf.blockFrontHorseIndex,
      hp: e.hf.hp, speed: e.hf.speed,
      charaId: meta.charaId, meta,
    });
  }

  const labelUsedRanges: { top: number; bottom: number }[] = [];

  function labelYOffset(cy: number): number {
    const margin = 14;
    let offset = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = cy + offset;
      const overlap = labelUsedRanges.some(r =>
        candidate + margin > r.top && candidate - margin < r.bottom
      );
      if (!overlap) {
        labelUsedRanges.push({ top: candidate - margin, bottom: candidate + margin });
        return offset;
      }
      offset = offset <= 0 ? -offset + 14 : -offset;
    }
    const fallback = cy;
    labelUsedRanges.push({ top: fallback - margin, bottom: fallback + margin });
    return 0;
  }

  for (const hr of horseRects) {
    const { x, y } = hr;
    const isBlocked = hr.blocked;
    const isLowHp = hr.hp > 0 && hr.hp < HP_WARN_THRESHOLD;

    const img = charImages.value.get(hr.charaId);
    const imgSize = ICON_R * 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, isBlocked ? ICON_R + 3 : ICON_R, 0, Math.PI * 2);
    if (isBlocked) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (isLowHp) {
      ctx.beginPath();
      ctx.arc(x, y, ICON_R + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, ICON_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    ctx.strokeStyle = hr.isTop3 ? '#fbbf24' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = hr.isTop3 ? 2.5 : 1;
    ctx.stroke();
    ctx.closePath();
    ctx.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      const s = Math.max(img.naturalWidth, img.naturalHeight);
      const sw = (imgSize / s) * img.naturalWidth;
      const sh = (imgSize / s) * img.naturalHeight;
      ctx.drawImage(img, x - sw / 2, y - sh / 2, sw, sh);
    } else {
      ctx.fillStyle = hr.color;
      ctx.fillRect(x - ICON_R, y - ICON_R, ICON_R * 2, ICON_R * 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(hr.postNumber), x, y + 0.5);
    }
    ctx.restore();

    const ly = y + labelYOffset(y);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(hr.name, x + ICON_R + 8, ly - 6);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '9px sans-serif';
    ctx.fillText(hr.trainer, x + ICON_R + 8, ly + 11);

    const rankIdx = entries.findIndex(e2 => e2.horseIndex === hr.meta.horseIndex);
    ctx.fillStyle = rankIdx === 0 ? '#fbbf24' : rankIdx === 1 ? '#94a3b8' : rankIdx === 2 ? '#f97316' : 'rgba(100, 116, 139, 0.4)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('#' + (rankIdx + 1), CX + CW - 8, y);

    const hpPct = clamp(hr.hp / 1000, 0, 1);
    ctx.fillStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.fillRect(x - 20, y + 17, 40, 8);
    ctx.fillStyle = hpPct > 0.5 ? 'rgba(34, 197, 94, 0.8)' : hpPct > 0.2 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    ctx.fillRect(x - 20, y + 17, 40 * hpPct, 8);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('HP ' + hr.hp, x, y + 27);

    const speedMs = (hr.speed / 100).toFixed(1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.roundRect(x + ICON_R + 2, y - 28, 56, 22, 5);
    ctx.fill();
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(speedMs + 'm/s', x + ICON_R + 30, y - 17);

    if (isBlocked) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.font = '7px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('BLOCKED by #' + hr.blockingHorse, x + ICON_R + 8, y + 18);
    }
    if (isLowHp) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.fillRect(x - ICON_R - 2, y - ICON_R - 2, ICON_R * 2 + 4, ICON_R * 2 + 4);
    }
  }

  drawSkillEvents(ctx, horseFrames, leaderDist);
}

function getSkillDurationSecs(skillId: number, frameTime: number, reportedDuration?: number): number {
  'use strict';
  const isInitial = Math.abs(frameTime) < 1e-9;
  const entry = skillDb.value?.get(skillId);
  const baseTime = entry?.condition_groups?.[0]?.base_time ?? 0;

  if (isInitial && baseTime > 0) {
    return (baseTime / 10000) * (totalDistance.value / 1000);
  }

  if (!isInitial && reportedDuration != null && reportedDuration > 0) {
    return reportedDuration / 10000;
  }

  if (baseTime > 0) return baseTime / 10000;

  return 2;
}

function _catSkill(s: SkillEntry): SkillEffectCategory {
  if (s.rarity && s.rarity >= 5) return 'unique';
  const d = (s.endesc || s.desc_en || '').toLowerCase();
  if (d.includes('decrease')) return 'debuff';
  if (d.includes('recover endurance') || d.includes('recover stamina')) return 'stamina';
  if (d.includes('acceleration')) return 'accel';
  if (d.includes('increase velocity') || d.includes('speed')) return 'speed';
  if (d.includes('increase') || d.includes('boost') || d.includes('improve')) return 'buff';
  return 'other';
}

const _skillDurCache = new Map<string, number>();
let _type3Events: EventData[] | null = null;
let _skillTick = 0;

function _getCachedSkillDur(skillId: number, frameTime: number, reportedDuration?: number): number {
  const key = `${frameTime}:${skillId}`;
  let d = _skillDurCache.get(key);
  if (d === undefined) {
    d = getSkillDurationSecs(skillId, frameTime, reportedDuration);
    _skillDurCache.set(key, d);
  }
  return d;
}

function drawSkillEvents(ctx: CanvasRenderingContext2D, horseFrames: HorseFrameData[], leaderDist: number) {
  if (!props.simData) return;
  const time = elapsedTime.value;
  let smin = Infinity, smax = 0;
  for (const hf of horseFrames) {
    if (hf.lanePosition < smin) smin = hf.lanePosition;
    if (hf.lanePosition > smax) smax = hf.lanePosition;
  }
  const sSpread = Math.max(smax - smin, 1);

  const db = skillDb.value;

  if (!_type3Events) {
    _type3Events = props.simData.events.filter(e => e.type === 3 && e.param[0] != null);
  }

  const windowed = _type3Events.filter(e => {
    const dt = time - e.frameTime;
    const dur = _getCachedSkillDur(e.param[1] ?? 0, e.frameTime, e.param[2]);
    return dt >= 0 && dt < dur;
  });
  _skillTick++;
  if (_skillTick % 2 === 1) {
    activeSkills.value = windowed.map(e => {
      const sid = e.param[1] ?? 0;
      const dur = _getCachedSkillDur(sid, e.frameTime, e.param[2]);
      const se = db?.get(sid);
      const sname = se?.name_en || se?.enname || getSkillName(sid) || '';
      const cat = se ? _catSkill(se) : 'other';
      const desc = se?.endesc || se?.desc_en || '';
      return {
        frameTime: e.frameTime,
        horseIndex: e.param[0]!,
        skillId: sid,
        name: sname || `Skill #${sid}`,
        category: cat,
        desc,
        remaining: Math.max(0, dur - (time - e.frameTime)),
      };
    });
  }

  const usedLabelAreas: { left: number; right: number; top: number; bottom: number }[] = [];
  for (const evt of windowed) {
    const horseIdx = evt.param[0]!;
    const hf = horseFrames[horseIdx];
    if (!hf) continue;
    const x = getXFromDist(hf.distance, leaderDist);
    if (x < CX - 40 || x > CX + CW + 40) continue;
    const laneRatio = sSpread > 0 ? clamp((hf.lanePosition - smin) / sSpread, 0, 1) : 0.5;
    const y = HORSE_Y_MIN + (1 - laneRatio) * HORSE_Y_RANGE;
    const se = db?.get(evt.param[1] ?? 0);
    const cat = se ? _catSkill(se) : 'other';
    const ecolor = effectColors[cat] || '#22d3ee';
    const sname = se?.name_en || se?.enname || getSkillName(evt.param[1] ?? 0) || `Skill #${evt.param[1]}`;
    const label = '✦ ' + sname;
    ctx.font = 'bold 12px sans-serif';
    const lblW = Math.min(ctx.measureText(label).width + 10, 170);
    const lblH = 18;

    let lx = x - lblW / 2;
    let ly = y - ICON_R - 24;

    for (let attempt = 0; attempt < 6; attempt++) {
      const overlap = usedLabelAreas.some(a =>
        lx < a.right && lx + lblW > a.left && ly < a.bottom && ly + lblH > a.top
      );
      if (!overlap) break;
      if (attempt < 3) ly -= lblH + 2;
      else lx += (attempt % 2 === 0 ? -1 : 1) * (lblW + 4);
    }
    usedLabelAreas.push({ left: lx, right: lx + lblW, top: ly, bottom: ly + lblH });

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(lx, ly, lblW, lblH, 4);
    ctx.fill();
    ctx.fillStyle = ecolor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, x, ly + lblH);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    const remaining = Math.max(0, _getCachedSkillDur(evt.param[1] ?? 0, evt.frameTime, evt.param[2]) - (time - evt.frameTime));
    ctx.fillText(remaining > 0 ? remaining.toFixed(1) + 's' : '', lx + lblW - 2, ly + 1);
  }
}

function render(_timestamp: number, simData: RaceSimulateData) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, CW, CH);

  const horseFrames = getInterpolatedFrame(simData, elapsedTime.value);

  const leaderDist = horseFrames.length > 0
    ? Math.max(...horseFrames.map(hf => hf.distance))
    : 0;

  drawTrack(ctx, leaderDist);
  if (horseFrames.length > 0) {
    drawHorses(ctx, horseFrames);
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.beginPath();
  ctx.roundRect(CX + 8, 6, 130, 22, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(elapsedTime.value.toFixed(2) + 's', CX + 14, 18);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.font = '8px monospace';
  const vb = getViewportBounds(leaderDist);
  ctx.fillText(Math.round(vb.left) + '-' + Math.round(vb.right) + 'm', CX + 64, 18);
}

function startAnimation(simData: RaceSimulateData, fromTime?: number) {
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
    render(timestamp, simData);
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

const stop = () => { playing.value = false; cancelAnimationFrame(animFrame); elapsedTime.value = 0; done.value = false; if (props.simData) render(0, props.simData); };

const pause = () => { playing.value = false; cancelAnimationFrame(animFrame); };

const onSeekInput = (e: Event) => {
  seeking.value = true;
  elapsedTime.value = parseFloat((e.target as HTMLInputElement).value);
};
const onSeekChange = (e: Event) => {
  seeking.value = false;
  const t = parseFloat((e.target as HTMLInputElement).value);
  if (props.simData) { seekTo(t); }
};

const resetAnim = () => {
  stop();
  elapsedTime.value = 0;
  done.value = false;
  if (props.simData) render(0, props.simData);
};

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
    nextTick(() => render(0, props.simData!));
  }
});

const toggleFullscreen = () => {
  if (!replayWrap.value) return;
  if (!document.fullscreenElement) {
    replayWrap.value.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};

onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
});

onUnmounted(() => {
  cancelAnimationFrame(animFrame);
  document.removeEventListener('fullscreenchange', () => {});
});

watch(() => props.simData, (sd) => { if (sd) nextTick(() => render(0, sd)); });

const replayTime = computed(() => elapsedTime.value.toFixed(2));

const totalTime = computed(() => {
  if (!props.simData?.frames?.length) return 1;
  return props.simData.frames[props.simData.frames.length - 1]!.time;
});

const phaseMarkers = computed(() => {
  if (!props.simData?.frames?.length) return [];
  const frames = props.simData.frames;
  const segs = getCourseSegments(totalDistance.value);
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

const seekTo = (time: number) => {
  elapsedTime.value = clamp(time, 0, totalTime.value);
  if (props.simData) render(performance.now(), props.simData);
};

const togglePlay = () => {
  if (!props.simData) return;
  if (done.value) { resetAnim(); setTimeout(() => play(), 50); return; }
  if (playing.value) { pause(); return; }
  play(elapsedTime.value);
};

const horseProgress = (horseIndex: number) => {
  if (!hasSimData.value) return done.value ? 1 : 0;
  const hf = sortedByDistance.value.find(s => s.horseIndex === horseIndex);
  if (!hf) return 0;
  return clamp(hf.distance / totalDistance.value, 0, 1);
};

const styleDisplayNames: Record<number, string> = {
  1: 'Front Runner', 2: 'Pace Chaser', 3: 'End Closer', 4: 'Late Surger',
};

function formatRaceTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(4).padStart(7, '0')}`;
}

const expandedRow = ref<number | null>(null);
const courseDataReady = ref(false);

const DUEL_HP_THRESHOLD_RATIO = 0.05;
const DEATH_EPSILON = 0.1;

function getCurrentSlope(dist: number, slopes: { start: number; length: number; slope: number }[]): number {
  const seg = slopes.find(s => dist >= s.start && dist < s.start + s.length);
  return seg?.slope ?? 0;
}

function computeReferenceHpConsumption(speed: number, courseDistance: number): number {
  const baseSpeed = BASE_SPEED_CONSTANT - (courseDistance - BASE_SPEED_COURSE_OFFSET) / BASE_SPEED_COURSE_SCALE;
  return HP_CONSUMPTION_SCALE * Math.pow(Math.max(0, speed - baseSpeed + HP_CONSUMPTION_SPEED_OFFSET), 2) / HP_CONSUMPTION_DIVISOR;
}

function computeHeuristicEvents(
  frames: import('../../utils/raceSimDecoder').FrameData[],
  courseDistance: number,
  slopes: { start: number; length: number; slope: number }[],
  horseCount: number,
): Map<number, { downhillDuration: number; paceUpDuration: number; paceDownDuration: number; overtakeDuration: number; speedUpDuration: number }> {
  const result = new Map<number, { downhillDuration: number; paceUpDuration: number; paceDownDuration: number; overtakeDuration: number; speedUpDuration: number }>();
  if (!frames.length || courseDistance <= 0) return result;

  for (let i = 0; i < horseCount; i++) {
    let dhActive = false, dhStart = 0, dhTotal = 0;
    let puActive = false, puStart = 0, puTotal = 0;
    let pdActive = false, pdStart = 0, pdTotal = 0;
    let otActive = false, otStart = 0, otTotal = 0;
    let suActive = false, suStart = 0, suTotal = 0;

    const baseSpeed = BASE_SPEED_CONSTANT - (courseDistance - BASE_SPEED_COURSE_OFFSET) / BASE_SPEED_COURSE_SCALE;

    for (let f = 0; f < frames.length - 1; f++) {
      const frame = frames[f]!;
      const nextFrame = frames[f + 1]!;
      if (!frame.horseFrames[i] || !nextFrame.horseFrames[i]) continue;
      const time = frame.time;
      const dt = nextFrame.time - time;
      if (dt <= 0) continue;

      const h = frame.horseFrames[i]!;
      const hn = nextFrame.horseFrames[i]!;

      const dist = h.distance;
      const speed = h.speed / 100;
      const nextSpeed = hn.speed / 100;
      const accel = (nextSpeed - speed) / dt;
      const hpDiff = (h.hp - hn.hp) / dt;

      const slope = getCurrentSlope(dist, slopes);
      const expected = computeReferenceHpConsumption(speed, courseDistance);
      const hpRatio = expected > 0 && hpDiff > 0 ? hpDiff / expected : 1;

      let leaderDist = 0;
      for (const hf of frame.horseFrames) {
        if (hf && hf.distance > leaderDist) leaderDist = hf.distance;
      }
      const distFromLeader = leaderDist - dist;

      const positionKeepEnd = courseDistance * (10 / 24);
      const isPastPK = dist >= positionKeepEnd;

      const paceUpThreshold = baseSpeed * PACE_UP_MULTIPLIER;
      const paceDownThreshold = baseSpeed * PACE_DOWN_MULTIPLIER;

      // Downhill Mode detection
      let isDownhill = false;
      if (slope < 0) {
        const downhillBonus = DOWNHILL_BONUS_BASE + Math.abs(slope) / DOWNHILL_BONUS_DIVISOR;
        if (expected > 0 && hpDiff > 0 && hpRatio < DOWNHILL_HP_RATIO_THRESHOLD) {
          if (hpRatio < DOWNHILL_HP_RATIO_STRONG) {
            isDownhill = true;
          } else {
            const refMax = baseSpeed + downhillBonus;
            const diffDownhill = Math.abs(speed - refMax);
            const diffNormal = Math.abs(speed - baseSpeed);
            if (diffDownhill < diffNormal + 0.2) {
              isDownhill = true;
            }
          }
        }
      }

      if (isDownhill && !dhActive) { dhActive = true; dhStart = time; }
      else if (!isDownhill && dhActive) { dhActive = false; if (time - dhStart > MIN_EVENT_DURATION) dhTotal += time - dhStart; }

      if (!isPastPK) {
        let isPaceUp = false, isPaceDown = false, isOvertake = false, isSpeedUp = false;

        if (speed > paceUpThreshold * 1.02 || (speed > paceUpThreshold && accel > 0.2)) {
          if (distFromLeader < 0.05) {
            isSpeedUp = true;
          } else {
            isPaceUp = true;
          }
        }

        if (speed < paceDownThreshold * 0.98 || (speed < paceDownThreshold && accel < -0.2)) {
          isPaceDown = true;
        }

        if (isPaceUp && distFromLeader < 0.05) {
          isOvertake = true;
          isPaceUp = false;
        }

        if (isPaceUp && !puActive) { puActive = true; puStart = time; }
        else if (!isPaceUp && puActive) { puActive = false; if (time - puStart > MIN_EVENT_DURATION) puTotal += time - puStart; }

        if (isPaceDown && !pdActive) { pdActive = true; pdStart = time; }
        else if (!isPaceDown && pdActive) { pdActive = false; if (time - pdStart > MIN_EVENT_DURATION) pdTotal += time - pdStart; }

        if (isOvertake && !otActive) { otActive = true; otStart = time; }
        else if (!isOvertake && otActive) { otActive = false; if (time - otStart > MIN_EVENT_DURATION) otTotal += time - otStart; }

        if (isSpeedUp && !suActive) { suActive = true; suStart = time; }
        else if (!isSpeedUp && suActive) { suActive = false; if (time - suStart > MIN_EVENT_DURATION) suTotal += time - suStart; }
      } else {
        if (puActive) { puActive = false; if (time - puStart > MIN_EVENT_DURATION) puTotal += time - puStart; }
        if (pdActive) { pdActive = false; if (time - pdStart > MIN_EVENT_DURATION) pdTotal += time - pdStart; }
        if (otActive) { otActive = false; if (time - otStart > MIN_EVENT_DURATION) otTotal += time - otStart; }
        if (suActive) { suActive = false; if (time - suStart > MIN_EVENT_DURATION) suTotal += time - suStart; }
      }
    }

    // Close any remaining active events
    const lastTime = frames[frames.length - 1]!.time;
    if (dhActive) { dhActive = false; if (lastTime - dhStart > MIN_EVENT_DURATION) dhTotal += lastTime - dhStart; }
    if (puActive) { puActive = false; if (lastTime - puStart > MIN_EVENT_DURATION) puTotal += lastTime - puStart; }
    if (pdActive) { pdActive = false; if (lastTime - pdStart > MIN_EVENT_DURATION) pdTotal += lastTime - pdStart; }
    if (otActive) { otActive = false; if (lastTime - otStart > MIN_EVENT_DURATION) otTotal += lastTime - otStart; }
    if (suActive) { suActive = false; if (lastTime - suStart > MIN_EVENT_DURATION) suTotal += lastTime - suStart; }

    result.set(i, {
      downhillDuration: dhTotal,
      paceUpDuration: puTotal,
      paceDownDuration: pdTotal,
      overtakeDuration: otTotal,
      speedUpDuration: suTotal,
    });
  }

  return result;
}

function computeHpOutcome(horseIndex: number, frames: import('../../utils/raceSimDecoder').FrameData[], raceDistance: number): { current: number; max: number; died: boolean; deathDist?: number; deficit?: number } {
  if (!frames.length) return { current: 0, max: 1000, died: false };
  const startHp = frames[0]!.horseFrames[horseIndex]?.hp ?? 1000;
  let minHp = startHp;
  let deathDist: number | undefined;
  for (const f of frames) {
    const hp = f.horseFrames[horseIndex]?.hp ?? 0;
    if (hp < minHp) minHp = hp;
    if (hp <= 0 && deathDist === undefined) {
      deathDist = f.horseFrames[horseIndex]?.distance ?? 0;
    }
  }
  const finalHp = frames[frames.length - 1]!.horseFrames[horseIndex]?.hp ?? 0;
  const died = deathDist !== undefined && deathDist < raceDistance - DEATH_EPSILON;
  let deficit: number | undefined;
  if (died && deathDist !== undefined) {
    const dist = raceDistance - deathDist;
    const lostSpeed = (deathDist > 0) ? (frames.find(f => (f.horseFrames[horseIndex]?.distance ?? 0) >= deathDist)?.horseFrames[horseIndex]?.speed ?? 0) / 100 : BASE_SPEED_CONSTANT;
    const currentSpeed = Math.max(lostSpeed, BASE_SPEED_CONSTANT * 0.8);
    const baseSpeed = BASE_SPEED_CONSTANT - (raceDistance - BASE_SPEED_COURSE_OFFSET) / BASE_SPEED_COURSE_SCALE;
    const hpPerSec = HP_CONSUMPTION_SCALE * Math.pow(currentSpeed - baseSpeed + HP_CONSUMPTION_SPEED_OFFSET, 2) / HP_CONSUMPTION_DIVISOR;
    const time = dist / currentSpeed;
    deficit = time * hpPerSec;
  }
  return { current: died ? 0 : finalHp, max: startHp, died, deathDist, deficit };
}

function computeDuelDurations(horseIndex: number, frames: import('../../utils/raceSimDecoder').FrameData[], events: import('../../utils/raceSimDecoder').EventData[]): number {
  const COMPETE_FIGHT = 5;
  const duelEvents = events.filter(e => e.type === COMPETE_FIGHT && e.param[0] === horseIndex);
  if (!duelEvents.length) return 0;
  const startHp = frames[0]?.horseFrames[horseIndex]?.hp ?? 1000;
  const hpThreshold = startHp * DUEL_HP_THRESHOLD_RATIO;
  let totalDuration = 0;
  for (const evt of duelEvents) {
    const startTime = evt.frameTime;
    let endTime = frames[frames.length - 1]!.time;
    for (let i = 0; i < frames.length; i++) {
      if (frames[i]!.time < startTime) continue;
      if ((frames[i]!.horseFrames[horseIndex]?.hp ?? 0) < hpThreshold) {
        endTime = frames[i]!.time;
        break;
      }
    }
    totalDuration += endTime - startTime;
  }
  return totalDuration;
}

const horsesDetailed = computed(() => {
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
  type HeuristicSummary = { downhillDuration: number; paceUpDuration: number; paceDownDuration: number; overtakeDuration: number; speedUpDuration: number };
  const heuristicEvents: Map<number, HeuristicSummary> = slopes.length > 0 && frames.length > 0
    ? computeHeuristicEvents(frames, totalDist, slopes, frames[0]?.horseFrames.length ?? 0)
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
      speed: horse._raceParam?.RawSpeed ?? 0, stamina: horse._raceParam?.RawStamina ?? 0,
      power: horse._raceParam?.RawPow ?? 0, guts: horse._raceParam?.RawGuts ?? 0, wiz: horse._raceParam?.RawWiz ?? 0,
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
      ...heuristicEvents.get(horse.horseIndex) ?? { downhillDuration: 0, paceUpDuration: 0, paceDownDuration: 0, overtakeDuration: 0, speedUpDuration: 0 },
      skills: (horse._responseHorseData?.skill_array ?? []).filter(sk => sk != null).map(sk => ({ ...sk, usedCount: usedSkills.get(horse.horseIndex)?.get(sk.skill_id) ?? 0 })),
      factors: (horse.TrainedCharaData?.FactorDataArray ?? []).filter(f => f != null).map(f => ({ factorId: f.FactorId, level: f.FactorLv })),
      supportCards: (horse.TrainedCharaData?.SupportCardArray ?? []).filter(sc => sc != null).map(sc => ({ id: sc.SupportCardId, lb: sc.LimitBreakCount })),
      parents: (horse.TrainedCharaData?.SuccessionCharaList?._items ?? []).filter(p => p != null).map(p => ({ cardId: p.CardId, rarity: p.Rarity, level: p.Level })),
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

    <div id="race-controls" v-if="hasSimData" class="px-6 py-3 bg-slate-950/30 border-t border-slate-700/50 space-y-2">
      <div class="relative h-7 flex items-center">
        <input type="range" :min="0" :max="totalTime" :step="0.01" :value="elapsedTime"
               @input="onSeekInput" @change="onSeekChange"
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
        <button @click="togglePlay" class="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-700 transition-colors"
                :class="playing ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'">
          <i :class="playing ? 'ph-bold ph-pause' : done ? 'ph-bold ph-arrows-clockwise' : 'ph-bold ph-play'"></i>
        </button>
        <button @click="stop" class="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <i class="ph-bold ph-stop"></i>
        </button>
        <span class="font-mono text-xs text-slate-400 w-28">{{ replayTime }}s / {{ totalTime.toFixed(2) }}s</span>
        <div class="flex items-center gap-1 ml-auto">
          <button v-for="s in [1, 2, 4]" :key="s"
                  @click="playbackSpeed = s"
                  class="px-2 py-0.5 rounded text-xs font-mono transition-colors"
                  :class="playbackSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'">
            {{ s }}x
          </button>
        </div>
        <button @click="toggleFullscreen" class="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors ml-1" :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'">
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

    <div class="p-4 flex items-center justify-center bg-slate-950/50">
      <canvas ref="canvasRef" :width="CW" :height="CH" class="w-full h-auto rounded-lg" style="max-width:1200px"></canvas>
    </div>

    <template v-if="!hasSimData">
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
              <div class="absolute inset-0 transition-all duration-100 ease-linear rounded"
                   :style="{
                     width: `${horseProgress(horse.horseIndex) * 100}%`,
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

    <div v-if="hasSimData" class="px-6 pb-2">
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
          <span v-if="entry.blocked" class="text-red-400 font-mono shrink-0 text-[9px]" title="Blocked by horse #{{ entry.blockingHorse }}">
            ⛔{{ entry.blockingHorse }}
          </span>
          <span class="font-mono text-slate-400 shrink-0">{{ entry.distance.toFixed(0) }}m</span>
          <span class="font-mono text-sky-300 w-8 text-right shrink-0">{{ entry.speed }}</span>
        </div>
      </div>
    </div>

    <div v-if="activeSkills.length > 0" class="px-6 pb-2">
      <div class="flex items-center gap-2 text-xs text-cyan-400 mb-1.5">
        <i class="ph-bold ph-lightning"></i>
        <span>Active Skills</span>
        <span class="text-slate-600 ml-auto">{{ activeSkills.length }} active</span>
      </div>
      <div class="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1">
        <div v-for="(skill, idx) in activeSkills.sort((a, b) => a.frameTime - b.frameTime)" :key="skill.frameTime + '-' + skill.horseIndex + '-' + skill.skillId"
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
   <th class="text-right py-2 pr-1.5">SPD</th>
              <th class="text-right py-2 pr-1.5">STA</th>
              <th class="text-right py-2 pr-1.5">POW</th>
              <th class="text-right py-2 pr-1.5">GUT</th>
              <th class="text-right py-2">WIZ</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="h in horsesDetailed" :key="h.horseIndex">
              <tr @click="expandedRow = expandedRow === h.horseIndex ? null : h.horseIndex"
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
                  <span class="px-1 py-0.5 rounded text-[9px] font-bold whitespace-nowrap" :style="{ background: styleColors[h.styleNum] || '#6366f1', color: '#fff' }">
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
                <td class="py-1.5 pr-1.5 text-right text-emerald-300">{{ h.stamina || '-' }}</td>
                <td class="py-1.5 pr-1.5 text-right text-rose-300">{{ h.power || '-' }}</td>
                <td class="py-1.5 pr-1.5 text-right text-amber-300">{{ h.guts || '-' }}</td>
                <td class="py-1.5 text-right text-violet-300">{{ h.wiz || '-' }}</td>
              </tr>
              <tr v-if="expandedRow === h.horseIndex" class="border-b border-slate-700/50">
                <td colspan="19" class="py-3 px-4 bg-slate-900/40">
                  <div class="space-y-3 text-[11px]">

                    <!-- Row 1: basic stats -->
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

                    <!-- Aptitudes -->
                    <div v-if="h.properTurf > 0" class="border-t border-slate-700/50 pt-2">
                      <span class="text-slate-400 font-bold text-[10px] tracking-wide">APTITUDES</span>
                      <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span class="text-slate-300">Turf <span class="font-bold" :class="gradeColor(h.properTurf)">{{ gradeLetter(h.properTurf) }}</span></span>
                        <span class="text-slate-300">Dirt <span class="font-bold" :class="gradeColor(h.properDirt)">{{ gradeLetter(h.properDirt) }}</span></span>
                        <span class="text-slate-300">Short <span class="font-bold" :class="gradeColor(h.properShort)">{{ gradeLetter(h.properShort) }}</span></span>
                        <span class="text-slate-300">Mile <span class="font-bold" :class="gradeColor(h.properMile)">{{ gradeLetter(h.properMile) }}</span></span>
                        <span class="text-slate-300">Mid <span class="font-bold" :class="gradeColor(h.properMiddle)">{{ gradeLetter(h.properMiddle) }}</span></span>
                        <span class="text-slate-300">Long <span class="font-bold" :class="gradeColor(h.properLong)">{{ gradeLetter(h.properLong) }}</span></span>
                        <span class="text-slate-300">Nige <span class="font-bold" :class="gradeColor(h.properNige)">{{ gradeLetter(h.properNige) }}</span></span>
                        <span class="text-slate-300">Senko <span class="font-bold" :class="gradeColor(h.properSenko)">{{ gradeLetter(h.properSenko) }}</span></span>
                        <span class="text-slate-300">Sashi <span class="font-bold" :class="gradeColor(h.properSashi)">{{ gradeLetter(h.properSashi) }}</span></span>
                        <span class="text-slate-300">Oikomi <span class="font-bold" :class="gradeColor(h.properOikomi)">{{ gradeLetter(h.properOikomi) }}</span></span>
                      </div>
                    </div>

                    <!-- Acquired Skills -->
                    <div v-if="h.skills.length" class="border-t border-slate-700/50 pt-2">
                      <span class="text-slate-400 font-bold text-[10px] tracking-wide">SKILLS ({{ h.skills.length }})</span>
                      <div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 max-h-24 overflow-y-auto">
                        <span v-for="sk in h.skills" :key="sk.skill_id"
                              class="text-[10px] whitespace-nowrap"
                              :class="sk.usedCount > 0 ? 'text-emerald-300' : 'text-slate-500'">
                          <span :class="sk.usedCount > 0 ? 'text-emerald-400' : 'text-slate-600'">{{ sk.usedCount > 0 ? '●' : '○' }}</span>
                          <span class="text-white">{{ resolveSkillName(sk.skill_id) }}</span>
                          <span v-if="sk.level > 1" class="text-amber-400">({{ sk.level }})</span>
                          <span v-if="sk.usedCount > 0" class="text-emerald-400 ml-0.5">{{ sk.usedCount }}x</span>
                        </span>
                      </div>
                    </div>

                    <!-- Support Cards -->
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

                    <!-- Parents -->
                    <div v-if="h.parents.length" class="border-t border-slate-700/50 pt-2">
                      <span class="text-slate-400 font-bold text-[10px] tracking-wide">PARENTS</span>
                      <div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                        <span v-for="(p, pi) in h.parents" :key="pi" class="text-slate-400">
                          <span class="text-violet-300">#{{ p.cardId }}</span>
                          <span class="text-amber-400 text-[10px]">{{ ['', 'R', 'SR', 'SSR', 'SSR+'][p.rarity] || 'R' }}</span>
                          <span class="text-slate-500">Lv{{ p.level }}</span>
                        </span>
                      </div>
                    </div>

                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
