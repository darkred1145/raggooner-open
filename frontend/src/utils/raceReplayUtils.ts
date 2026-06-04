import type { SkillEntry } from './skillDatabase';
import { getSkillName } from './skillData';
import type { RaceSimulateData, FrameData, HorseFrameData } from './raceSimDecoder';
import { courseDataLoader } from './courseDataLoader';

export type ReplayParentFactor = {
  factorId: number;
  level: number;
};

export type ReplayParentEntry = {
  cardId: number;
  rarity: number;
  level: number;
  positionId: number;
  charaName: string;
  factors: ReplayParentFactor[];
};

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
  parents: ReplayParentEntry[];
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

export const GRADE_LETTERS = ['', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'];

export const GRADE_COLORS: Record<string, string> = {
  'S': 'text-yellow-300', 'A': 'text-green-400', 'B': 'text-blue-400',
  'C': 'text-slate-300', 'D': 'text-slate-400', 'E': 'text-slate-500',
  'F': 'text-slate-500', 'G': 'text-slate-600',
};

export const FACTOR_STAT_NAMES: Record<number, string> = { 1: 'Speed', 2: 'Stamina', 3: 'Power', 4: 'Guts', 5: 'Wit' };

export const FACTOR_APT_NAMES: Record<number, string> = {
  11: 'Sprint', 12: 'Dirt', 23: 'Mile', 24: 'Medium', 31: 'Short',
  32: 'Medium', 33: 'Long', 34: 'Turf', 41: 'Front Runner', 42: 'Pace Chaser',
  43: 'Closer', 44: 'Late Surger',
};

export const MOOD_INPUT_MAP: Record<string, { label: string; cls: string }> = {
  'great':            { label: 'Great', cls: 'text-red-400' },
  'good':             { label: 'Good',  cls: 'text-orange-400' },
  'normal':           { label: 'Normal', cls: 'text-yellow-400' },
  'bad':              { label: 'Bad',   cls: 'text-blue-400' },
  'awful':            { label: 'Awful', cls: 'text-violet-400' },
  'very motivated':   { label: 'Great', cls: 'text-red-400' },
  'motivated':        { label: 'Good',  cls: 'text-orange-400' },
  'unmotivated':      { label: 'Bad',   cls: 'text-blue-400' },
  'very unmotivated': { label: 'Awful', cls: 'text-violet-400' },
  'max':              { label: 'Great', cls: 'text-red-400' },
  'very high':        { label: 'Great', cls: 'text-red-400' },
  'high':             { label: 'Good',  cls: 'text-orange-400' },
  'middle':           { label: 'Normal', cls: 'text-yellow-400' },
  'medium':           { label: 'Normal', cls: 'text-yellow-400' },
  'low':              { label: 'Bad',   cls: 'text-blue-400' },
  'min':              { label: 'Awful', cls: 'text-violet-400' },
  'very low':         { label: 'Awful', cls: 'text-violet-400' },
  '絶好調':            { label: 'Great', cls: 'text-red-400' },
  '好調':             { label: 'Good',  cls: 'text-orange-400' },
  '普通':             { label: 'Normal', cls: 'text-yellow-400' },
  '不調':             { label: 'Bad',   cls: 'text-blue-400' },
  '絶不調':            { label: 'Awful', cls: 'text-violet-400' },
};

export const CW = 1200;
export const CH = 500;
export const CX = 0;
export const TRACK_Y = 44;
export const TRACK_H = 14;
export const ICON_R = 24;
export const VIEWPORT_M = 120;
export const HORSE_Y_MIN = 80;
export const HORSE_Y_RANGE = 406;

export const STRAIGHT_COLOR = 'rgba(79, 109, 122, 0.15)';
export const CORNER_COLOR = 'rgba(192, 139, 91, 0.13)';
export const UPHILL_COLOR = 'rgba(132, 204, 22, 0.18)';
export const DOWNHILL_COLOR = 'rgba(251, 191, 36, 0.18)';

export const HP_WARN_THRESHOLD = 200;

export const effectColors: Record<string, string> = {
  speed: '#22d3ee',
  stamina: '#34d399',
  accel: '#f97316',
  buff: '#818cf8',
  debuff: '#f43f5e',
  other: '#94a3b8',
};

export const styleNames: Record<number, string> = { 1: 'Front Runner', 2: 'Pace Chaser', 3: 'Late Surger', 4: 'End Closer' };

export const styleColors: Record<number, string> = { 1: '#ef4444', 2: '#3b82f6', 3: '#22c55e', 4: '#a855f7' };

export const styleDisplayNames: Record<number, string> = {
  1: 'Front Runner', 2: 'Pace Chaser', 3: 'Late Surger', 4: 'End Closer',
};

export const groundLabels: Record<number, string> = { 1: 'Turf', 2: 'Dirt' };

export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function classifyFactorId(factorId: number): 'stat' | 'aptitude' | 'race' | 'scenario' | 'uniqueSkill' | 'skill' {
  const s = String(factorId);
  if (s.length === 3) return 'stat';
  if (s.length === 4) return 'aptitude';
  if (s.length === 7 && s[0] === '1') return 'race';
  if (s.length === 7 && s[0] === '3') return 'scenario';
  if (s.length === 8) return 'uniqueSkill';
  return 'skill';
}

export function getFactorLabel(factorId: number, _level: number, skillDb: Map<number, SkillEntry> | null | undefined, factorNames?: Map<number, string> | null): string {
  const lvl = Math.max(1, factorId % 100);
  const baseId = Math.floor(factorId / 100);

  // Canonical name from TextData[147] — use it for any factor type if available
  const canonicalName = factorNames?.get(factorId);
  if (canonicalName) return `${canonicalName} ${'★'.repeat(lvl)}`;

  const cls = classifyFactorId(factorId);
  if (cls === 'stat') {
    const name = FACTOR_STAT_NAMES[baseId] || '?';
    return `${name} ${'★'.repeat(lvl)}`;
  }
  if (cls === 'aptitude') {
    const name = FACTOR_APT_NAMES[baseId] || `Apt#${baseId}`;
    return `${name} ${'★'.repeat(lvl)}`;
  }
  if (cls === 'race') {
    return `Race #${baseId} ${'★'.repeat(lvl)}`;
  }
  if (cls === 'scenario') {
    return `Scenario #${baseId} ${'★'.repeat(lvl)}`;
  }
  if (cls === 'uniqueSkill') {
    const se = skillDb?.get(baseId);
    const sn = se?.name_en || se?.enname || getSkillName(baseId);
    if (sn) return `${sn} ${'★'.repeat(lvl)}`;
    return `Unique #${baseId} ${'★'.repeat(lvl)}`;
  }
  const se = skillDb?.get(baseId);
  const sn = se?.name_en || se?.enname || getSkillName(baseId);
  if (sn) return `${sn} ${'★'.repeat(lvl)}`;
  return `Skill #${baseId} ${'★'.repeat(lvl)}`;
}

export function getFactorKey(factorId: number): string {
  const cls = classifyFactorId(factorId);
  const baseId = Math.floor(factorId / 100);
  const prefix: Record<string, string> = { stat: 'b', aptitude: 'a', race: 'r', scenario: 'c', uniqueSkill: 'u', skill: 's' };
  return `${prefix[cls] || 'f'}${baseId}`;
}

export function getFactorSortOrder(factorId: number): number {
  const order: Record<string, number> = { stat: 0, aptitude: 1, uniqueSkill: 2, race: 3, scenario: 4, skill: 5 };
  return order[classifyFactorId(factorId)] ?? 9;
}

export function getFactorColor(factorId: number): string {
  const cls = classifyFactorId(factorId);
  if (cls === 'stat') {
    const statMap: Record<number, string> = { 1: 'text-sky-400', 2: 'text-red-400', 3: 'text-orange-400', 4: 'text-pink-400', 5: 'text-green-400' };
    return statMap[Math.floor(factorId / 100)] || 'text-slate-400';
  }
  if (cls === 'aptitude') return 'text-red-400';
  if (cls === 'race' || cls === 'scenario') return 'text-purple-400';
  if (cls === 'uniqueSkill') return 'text-emerald-400';
  return 'text-slate-400';
}

export function aggregateFactors(factors: { factorId: number; level: number }[]): { factorId: number; level: number }[] {
  const groups = new Map<string, { factorId: number; level: number }>();
  for (const f of factors) {
    const key = getFactorKey(f.factorId);
    const existing = groups.get(key);
    if (existing) {
      existing.level += f.level;
    } else {
      groups.set(key, { factorId: f.factorId, level: f.level });
    }
  }
  return [...groups.values()].sort((a, b) => getFactorSortOrder(a.factorId) - getFactorSortOrder(b.factorId));
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

export function gradeLetter(val: number): string {
  return GRADE_LETTERS[val] || '?';
}

export function gradeColor(val: number): string {
  const letter = GRADE_LETTERS[val];
  return (letter ? GRADE_COLORS[letter] : undefined) || 'text-slate-500';
}

export function moodLabel(v: string): string {
  return MOOD_INPUT_MAP[v.toLowerCase().trim()]?.label ?? v;
}

export function moodClass(v: string): string {
  return MOOD_INPUT_MAP[v.toLowerCase().trim()]?.cls ?? 'text-slate-500';
}

export function resolveSkillName(skillId: number, skillDb: Map<number, SkillEntry> | null | undefined): string {
  const se = skillDb?.get(skillId);
  return se?.name_en || se?.enname || getSkillName(skillId) || `Skill #${skillId}`;
}

export function resolveSupportCardRarity(cardId: number): string {
  if (cardId >= 30000) return 'SSR';
  if (cardId >= 20000) return 'SR';
  return 'R';
}

export function bisectFrameIndex(frames: FrameData[], time: number): number {
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (frames[mid]!.time <= time) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function getInterpolatedFrame(simData: RaceSimulateData, time: number): HorseFrameData[] {
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

export function getCourseSegments(
  totalDist: number,
  courseId: number | undefined,
  courseDataReady: boolean,
): { start: number; end: number; type: 'straight' | 'corner' | 'uphill' | 'downhill'; label: string }[] {
  if (totalDist <= 0) return [];
  const course = courseDataReady && courseId ? courseDataLoader.getCourse(courseId) : undefined;
  if (!course || !course.corners?.length) {
    if (totalDist > 0) return [{ start: 0, end: totalDist, type: 'straight', label: 'Straight' }];
    return [];
  }
  const segments: { start: number; end: number; type: 'straight' | 'corner' | 'uphill' | 'downhill'; label: string }[] = [];
  for (const s of course.straights) {
    segments.push({ start: s.start, end: s.end, type: 'straight', label: 'Straight' });
  }
  const nCorners = course.corners.length;
  for (let i = 0; i < nCorners; i++) {
    const c = course.corners[i]!;
    const num = ((i - (nCorners - 4)) % 4 + 4) % 4 + 1;
    segments.push({ start: c.start, end: c.start + c.length, type: 'corner', label: `C${num}` });
  }
  for (const s of course.slopes || []) {
    segments.push({ start: s.start, end: s.start + s.length, type: s.slope > 0 ? 'uphill' : 'downhill', label: s.slope > 0 ? 'Uphill' : 'Downhill' });
  }
  segments.sort((a, b) => a.start - b.start);
  return segments;
}

export function getXFromDist(dist: number, leaderDist: number, totalDistance: number): number {
  const half = VIEWPORT_M / 2;
  let leftEdge = Math.max(0, leaderDist - half);
  let rightEdge = leftEdge + VIEWPORT_M;
  if (rightEdge > totalDistance) {
    rightEdge = totalDistance;
    leftEdge = Math.max(0, rightEdge - VIEWPORT_M);
  }
  const visible = rightEdge - leftEdge;
  if (visible <= 0) return CX + 10;
  return CX + 10 + ((dist - leftEdge) / visible) * (CW - 20);
}

export function getViewportBounds(leaderDist: number, totalDistance: number) {
  const half = VIEWPORT_M / 2;
  let left = Math.max(0, leaderDist - half);
  let right = left + VIEWPORT_M;
  if (right > totalDistance) {
    right = totalDistance;
    left = Math.max(0, right - VIEWPORT_M);
  }
  return { left, right, span: right - left };
}
