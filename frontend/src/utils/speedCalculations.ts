import {
  BASE_SPEED_CONSTANT, BASE_SPEED_COURSE_OFFSET, BASE_SPEED_COURSE_SCALE,
  HP_CONSUMPTION_SCALE, HP_CONSUMPTION_SPEED_OFFSET, HP_CONSUMPTION_DIVISOR,
  SLOPE_SCALE, SLOPE_PENALTY_COEFF,
  DOWNHILL_BONUS_BASE, DOWNHILL_BONUS_DIVISOR,
  PACE_UP_MULTIPLIER, OVERTAKE_MULTIPLIER, PACE_DOWN_MULTIPLIER, RUSHED_TYPE2_MULTIPLIER,
  SPOT_STRUGGLE_GUTS_BASE, SPOT_STRUGGLE_GUTS_EXPONENT, SPOT_STRUGGLE_GUTS_SCALE,
  DUELING_GUTS_BASE, DUELING_GUTS_EXPONENT, DUELING_GUTS_SCALE,
} from './raceConstants';

export type SpeedCalcParams = {
  courseDistance: number;
  currentDistance: number;
  speedStat: number;
  wisdomStat: number;
  powerStat: number;
  gutsStat: number;
  staminaStat?: number;
  strategy: number;
  distanceProficiency: number;
  strategyProficiency: number;
  mood: number;
  inLastSpurt: boolean;
  slope: number;
  trackSpeedMultiplier?: number;
  greenSkillBonuses?: { speed?: number; stamina?: number; power?: number; guts?: number; wisdom?: number };
  activeSpeedBuff?: number;
  activeSpeedDebuff?: number;
  isSpotStruggle?: boolean;
  isDueling?: boolean;
  isRushed?: boolean;
  rushedType?: number;
  isPaceUp?: boolean;
  isPaceDown?: boolean;
  isSpeedUp?: boolean;
  isOvertake?: boolean;
  isDownhillMode?: boolean;
  isOonige?: boolean;
};

export type TargetSpeedResult = {
  min: number;
  max: number;
  base: number;
};

const STRATEGY_PHASE_COEFFS: Record<number, number[]> = {
  1: [1.0, 0.98, 0.962],
  2: [0.978, 0.991, 0.975],
  3: [0.938, 0.998, 0.994],
  4: [0.931, 1.0, 1.0],
};
const OONIGE_COEFFS: number[] = [1.063, 0.962, 0.95];

const DISTANCE_PROFICIENCY_MODIFIER: Record<number, number> = {
  8: 1.05, 7: 1.0, 6: 0.9, 5: 0.8, 4: 0.6, 3: 0.4, 2: 0.2, 1: 0.1,
};

export const STRATEGY_PROFICIENCY_MODIFIER: Record<number, number> = {
  8: 1.1, 7: 1.0, 6: 0.85, 5: 0.75, 4: 0.6, 3: 0.4, 2: 0.2, 1: 0.1,
};

export const MOOD_MODIFIER: Record<number, number> = {
  5: 1.04, 4: 1.02, 3: 1.0, 2: 0.98, 1: 0.96,
};

const STAT_CAP = 1200;
const SPEED_TERM_COEFF = 500;
const SPEED_TERM_SCALE = 0.002;
const GUTS_TERM_BASE = 450;
const GUTS_TERM_EXPONENT = 0.597;
const GUTS_TERM_SCALE = 0.0001;
const LAST_SPURT_MULTIPLIER = 1.05;
const LAST_SPURT_BASE_RATIO = 0.01;
const WISDOM_VARIANCE_DIVISOR = 5500;
const WISDOM_LOG_SCALE = 0.1;
const WISDOM_MIN_PCT_OFFSET = 0.65;

const TRACK_STAT_THRESHOLD_HIGH = 900;
const TRACK_STAT_MODIFIER_HIGH = 1.2;
const TRACK_STAT_THRESHOLD_MID = 600;
const TRACK_STAT_MODIFIER_MID = 1.15;
const TRACK_STAT_THRESHOLD_LOW = 300;
const TRACK_STAT_MODIFIER_LOW = 1.1;
const TRACK_STAT_MODIFIER_BASE = 1.05;

export function computeGroundPowerBonus(surface: number, condition: number): number {
  if (surface === 2) {
    return condition === 2 ? -50 : -100;
  } else if (surface === 1) {
    return condition === 1 ? 0 : -50;
  }
  return 0;
}

export function getTrackStatThresholdModifier(
  courseId: number,
  stats: { speed: number; stamina: number; power: number; guts: number; wisdom: number },
  mood: number,
  racetrackFilterData?: { id: number; statThresholds?: string[] }[],
): number {
  if (!courseId || !racetrackFilterData) return 1.0;
  const trackInfo = racetrackFilterData.find(t => t.id === courseId);
  if (!trackInfo || !trackInfo.statThresholds || trackInfo.statThresholds.length === 0) return 1.0;

  const moodMod = MOOD_MODIFIER[mood] || 1.0;
  let totalMod = 0;
  let count = 0;

  for (const statName of trackInfo.statThresholds) {
    const statVal = (stats as Record<string, number>)[statName] ?? 0;
    const adjusted = statVal * moodMod;

    let mod = TRACK_STAT_MODIFIER_BASE;
    if (adjusted > TRACK_STAT_THRESHOLD_HIGH) mod = TRACK_STAT_MODIFIER_HIGH;
    else if (adjusted > TRACK_STAT_THRESHOLD_MID) mod = TRACK_STAT_MODIFIER_MID;
    else if (adjusted > TRACK_STAT_THRESHOLD_LOW) mod = TRACK_STAT_MODIFIER_LOW;

    totalMod += mod;
    count++;
  }

  if (count === 0) return 1.0;
  return totalMod / count;
}

export function computeGroundHpModifier(surface: number, condition: number): number {
  if (surface === 1) {
    if (condition === 3 || condition === 4) return 1.02;
  } else if (surface === 2) {
    if (condition === 3) return 1.01;
    if (condition === 4) return 1.02;
  }
  return 1.0;
}

export function adjustStat(stat: number, mood: number, bonus: number = 0): number {
  let val = stat;
  if (val > STAT_CAP) val = STAT_CAP + (val - STAT_CAP) / 2;
  return val * (MOOD_MODIFIER[mood] || 1.0) + bonus;
}

export function getDistanceCategory(distance: number): number {
  if (distance <= 1400) return 1;
  if (distance <= 1800) return 2;
  if (distance <= 2400) return 3;
  return 4;
}

export function computeReferenceHpConsumption(speed: number, courseDistance: number): number {
  const baseSpeed = BASE_SPEED_CONSTANT - (courseDistance - BASE_SPEED_COURSE_OFFSET) / BASE_SPEED_COURSE_SCALE;
  return HP_CONSUMPTION_SCALE * Math.pow(Math.max(0, speed - baseSpeed + HP_CONSUMPTION_SPEED_OFFSET), 2) / HP_CONSUMPTION_DIVISOR;
}

export function calculateTargetSpeed(params: SpeedCalcParams): TargetSpeedResult {
  const {
    courseDistance, currentDistance, speedStat, wisdomStat, powerStat, gutsStat, staminaStat: _staminaStat = 0,
    strategy, distanceProficiency, strategyProficiency, mood,
    inLastSpurt, slope,
    trackSpeedMultiplier = 1.0,
    greenSkillBonuses,
    activeSpeedBuff = 0, activeSpeedDebuff = 0,
    isSpotStruggle = false, isDueling = false, isRushed = false, rushedType = 0,
    isPaceUp, isPaceDown, isSpeedUp, isOvertake, isDownhillMode, isOonige,
  } = params;

  const adjustedSpeed = adjustStat(speedStat, mood, greenSkillBonuses?.speed) * trackSpeedMultiplier;
  const adjWisdom = adjustStat(wisdomStat, mood);
  const strategyProfMod = STRATEGY_PROFICIENCY_MODIFIER[strategyProficiency] ?? 1.0;
  const adjustedWisdom = adjWisdom * strategyProfMod + (greenSkillBonuses?.wisdom ?? 0);
  const adjustedPower = adjustStat(powerStat, mood, greenSkillBonuses?.power);
  const adjustedGuts = adjustStat(gutsStat, mood, greenSkillBonuses?.guts);

  const baseSpeed = BASE_SPEED_CONSTANT - (courseDistance - BASE_SPEED_COURSE_OFFSET) / BASE_SPEED_COURSE_SCALE;

  let phase = 0;
  if (currentDistance >= courseDistance * 2 / 3) phase = 2;
  else if (currentDistance >= courseDistance / 6) phase = 1;

  const coeffs = isOonige ? OONIGE_COEFFS : (STRATEGY_PHASE_COEFFS[strategy] ?? [1, 1, 1]);
  const phaseCoeff = coeffs[phase] ?? 1.0;
  let baseTargetSpeed = baseSpeed * phaseCoeff;

  const distMod = DISTANCE_PROFICIENCY_MODIFIER[distanceProficiency] || 1.0;
  const speedTerm = Math.sqrt(SPEED_TERM_COEFF * adjustedSpeed) * distMod * SPEED_TERM_SCALE;

  if (phase === 2) baseTargetSpeed += speedTerm;

  if (inLastSpurt) {
    const lateRaceBase = baseSpeed * (coeffs[2] ?? 1.0) + speedTerm;
    const gutsTerm = Math.pow(GUTS_TERM_BASE * adjustedGuts, GUTS_TERM_EXPONENT) * GUTS_TERM_SCALE;
    baseTargetSpeed = (lateRaceBase + LAST_SPURT_BASE_RATIO * baseSpeed) * LAST_SPURT_MULTIPLIER + speedTerm + gutsTerm;
  }

  if (slope > 0) {
    const slopePer = slope / SLOPE_SCALE;
    const penalty = (slopePer * SLOPE_PENALTY_COEFF) / adjustedPower;
    baseTargetSpeed -= penalty;
  }

  let modeMultiplier = 1.0;
  if (isPaceUp || isSpeedUp) modeMultiplier = PACE_UP_MULTIPLIER;
  else if (isOvertake) modeMultiplier = OVERTAKE_MULTIPLIER;
  else if (isPaceDown) modeMultiplier = PACE_DOWN_MULTIPLIER;

  if (isRushed && rushedType === 2) modeMultiplier *= RUSHED_TYPE2_MULTIPLIER;

  baseTargetSpeed *= modeMultiplier;

  if (isDownhillMode) baseTargetSpeed += DOWNHILL_BONUS_BASE + Math.abs(slope) / DOWNHILL_BONUS_DIVISOR;

  baseTargetSpeed += activeSpeedBuff;
  baseTargetSpeed -= activeSpeedDebuff;

  if (isSpotStruggle) baseTargetSpeed += Math.pow(SPOT_STRUGGLE_GUTS_BASE * adjustedGuts, SPOT_STRUGGLE_GUTS_EXPONENT) * SPOT_STRUGGLE_GUTS_SCALE;
  if (isDueling) baseTargetSpeed += Math.pow(DUELING_GUTS_BASE * adjustedGuts, DUELING_GUTS_EXPONENT) * DUELING_GUTS_SCALE;

  if (inLastSpurt) {
    return { min: baseTargetSpeed, max: baseTargetSpeed, base: baseTargetSpeed };
  }

  const logVal = Math.log10(adjustedWisdom * WISDOM_LOG_SCALE);
  const maxPct = (adjustedWisdom / WISDOM_VARIANCE_DIVISOR) * logVal;
  const minPct = maxPct - WISDOM_MIN_PCT_OFFSET;

  return {
    min: baseTargetSpeed + baseSpeed * (minPct / 100),
    max: baseTargetSpeed + baseSpeed * (maxPct / 100),
    base: baseTargetSpeed,
  };
}
