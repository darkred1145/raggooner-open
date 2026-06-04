import type { FrameData, EventData } from './raceSimDecoder';
import type { SkillEntry } from './skillDatabase';
import {
  MIN_EVENT_DURATION,
  BASE_SPEED_CONSTANT, BASE_SPEED_COURSE_OFFSET, BASE_SPEED_COURSE_SCALE,
  HP_CONSUMPTION_SCALE, HP_CONSUMPTION_SPEED_OFFSET, HP_CONSUMPTION_DIVISOR,
  SLOPE_SCALE, SLOPE_PENALTY_COEFF,
  POSITION_KEEP_END_RATIO,
  COURSE_FACTOR_BASE_DIST, COURSE_FACTOR_MULTIPLIER,
  DOWNHILL_BONUS_BASE, DOWNHILL_BONUS_DIVISOR,
  DOWNHILL_HP_RATIO_THRESHOLD, DOWNHILL_HP_RATIO_STRONG, DOWNHILL_HP_RATIO_PACE_DOWN,
  PACE_UP_MULTIPLIER, OVERTAKE_MULTIPLIER, PACE_DOWN_MULTIPLIER,
  PACEMAKER_PACE_UP_LENIENCY,
  TEMPTATION_MODE_RUSH_BOOST,
  EARLY_RACE_TIME,
  PACE_TRIGGER_RATIO, PACE_TRIGGER_ACCEL,
  SPEED_MATCH_TOLERANCE, DOWNHILL_NORMAL_MATCH_TOL,
  PACE_EXIT_DECEL, PACE_EXIT_SPEED_RATIO,
  EARLY_PACE_DOWN_SPEED_RATIO,
  PACE_DOWN_SPEED_THRESHOLD, PACE_DOWN_DECEL_THRESHOLD, PACE_DOWN_ACCEL_CEILING,
  PACE_DOWN_SPEED_SOFT_RATIO, PACE_DOWN_ACCEL_LIMIT,
  PACE_DOWN_EXIT_ACCEL, PACE_DOWN_EXIT_SPEED_RATIO,
  LEADER_PROXIMITY_EPSILON,
} from './raceConstants';
import {
  calculateTargetSpeed, computeReferenceHpConsumption,
  computeGroundPowerBonus, adjustStat,
  STRATEGY_PROFICIENCY_MODIFIER,
} from './speedCalculations';

export const DUEL_HP_THRESHOLD_RATIO = 0.05;
export const DEATH_EPSILON = 0.1;

const COMPETE_FIGHT = 2;
const COMPETE_TOP = 1;
const SKILL_EVENT = 3;

const SKILL_TIME_SCALE = 10000;
const DEFAULT_SKILL_DURATION = 2.0;

export type HeuristicSummary = {
  downhillDuration: number;
  paceUpDuration: number;
  paceDownDuration: number;
  overtakeDuration: number;
  speedUpDuration: number;
};

type HeuristicEvent = {
  time: number;
  duration: number;
  name: string;
};

export type HeuristicHorseInfo = {
  horseIndex: number;
  strategy: number;
  speed: number;
  stamina: number;
  pow: number;
  guts: number;
  wiz: number;
  mood: number;
  distanceProficiency: number;
  strategyProficiency: number;
  isOonige?: boolean;
  trackSpeedMultiplier?: number;
  frontRunnerProficiency?: number;
};

type PositionKeepRange = { min: number; max: number };
const POSITION_KEEP_RANGES: Record<number, (cf: number) => PositionKeepRange> = {
  1: (_cf) => ({ min: 0, max: 3.0 }),
  2: (cf) => ({ min: 3.0, max: 5.0 * cf }),
  3: (cf) => ({ min: 6.5 * cf, max: 7.0 * cf }),
  4: (cf) => ({ min: 7.5 * cf, max: 8.0 * cf }),
};

export function getCurrentSlope(dist: number, slopes: { start: number; length: number; slope: number }[]): number {
  const seg = slopes.find(s => dist >= s.start && dist < s.start + s.length);
  return seg?.slope ?? 0;
}

function resolveSkillDb(skillDb: Map<number, SkillEntry> | null | undefined, skillId: number): SkillEntry | undefined {
  let entry = skillDb?.get(skillId);
  if (!entry && skillId >= 900000 && skillId < 1000000) {
    entry = skillDb?.get(skillId - 800000);
  }
  return entry;
}

function getSkillBaseTime(skillDb: Map<number, SkillEntry> | null | undefined, skillId: number, conditionGroupIndex?: number): number {
  const entry = resolveSkillDb(skillDb, skillId);
  if (!entry?.condition_groups?.length) return 0;
  const idx = conditionGroupIndex != null && conditionGroupIndex >= 0 && conditionGroupIndex < entry.condition_groups.length
    ? conditionGroupIndex : 0;
  return entry.condition_groups[idx]?.base_time ?? 0;
}

function getSkillDurationSecs(skillDb: Map<number, SkillEntry> | null | undefined, skillId: number, courseDistance: number, frameTime: number, reportedDuration?: number, conditionGroupIndex?: number): number {
  const isInitial = Math.abs(frameTime) < 1e-9;

  if (!isInitial) {
    if (reportedDuration != null && reportedDuration > 0) {
      return reportedDuration / SKILL_TIME_SCALE;
    }
    return DEFAULT_SKILL_DURATION;
  }

  const baseTime = getSkillBaseTime(skillDb, skillId, conditionGroupIndex);
  if (baseTime > 0) {
    return (baseTime / SKILL_TIME_SCALE) * (courseDistance / 1000);
  }
  return DEFAULT_SKILL_DURATION;
}

function getActiveSpeedModifier(skillDb: Map<number, SkillEntry> | null | undefined, skillId: number, conditionGroupIndex?: number, skillLevel?: number): number {
  const entry = resolveSkillDb(skillDb, skillId);
  if (!entry?.condition_groups?.length) return 0;

  const idx = conditionGroupIndex != null && conditionGroupIndex >= 0 && conditionGroupIndex < entry.condition_groups.length
    ? conditionGroupIndex : 0;
  const group = entry.condition_groups[idx];
  if (!group?.effects?.length) return 0;

  let speedInc = 0;
  for (const eff of group.effects) {
    if (eff.type === 22 || eff.type === 27) {
      speedInc += eff.value / 10000;
    }
  }
  if (skillId === 210061) return 0.3;
  if (skillId === 210062) return 0.06;
  if (skillId >= 200000 || speedInc <= 0) return speedInc;
  const level = Math.max(1, Math.min(6, Math.floor(skillLevel ?? 1)));
  const UNIQUE_SKILL_LEVEL_SPEED_MULTIPLIERS = [1, 1.01, 1.04, 1.07, 1.10, 1.13];
  return speedInc * UNIQUE_SKILL_LEVEL_SPEED_MULTIPLIERS[level - 1]!;
}

export function computeSkillActivations(
  events: EventData[],
  horseCount: number,
): Record<number, { time: number; name: string; param: number[] }[]> {
  const result: Record<number, { time: number; name: string; param: number[] }[]> = {};
  for (let i = 0; i < horseCount; i++) result[i] = [];
  for (const evt of events) {
    if (evt.type !== SKILL_EVENT) continue;
    const horseIdx = evt.param[0]!;
    if (horseIdx < 0 || horseIdx >= horseCount) continue;
    if (!result[horseIdx]) result[horseIdx] = [];
    result[horseIdx].push({ time: evt.frameTime, name: `Skill #${evt.param[1]!}`, param: [...evt.param] });
  }
  return result;
}

export function computePassiveStatModifiers(
  skillActivations: Record<number, { param: number[] }[]>,
  skillDb: Map<number, SkillEntry> | null | undefined,
): Record<number, { speed: number; stamina: number; power: number; guts: number; wisdom: number }> {
  const result: Record<number, { speed: number; stamina: number; power: number; guts: number; wisdom: number }> = {};
  for (const horseIdx of Object.keys(skillActivations).map(Number)) {
    const mods = { speed: 0, stamina: 0, power: 0, guts: 0, wisdom: 0 };
    const activatedIds = new Set<number>();
    for (const act of skillActivations[horseIdx] ?? []) {
      activatedIds.add(act.param[1]!);
    }
    for (const skillId of activatedIds) {
      const entry = skillDb?.get(skillId);
      if (!entry?.condition_groups) continue;
      for (const group of entry.condition_groups) {
        for (const eff of group.effects ?? []) {
          const val = eff.value / 10000;
          switch (eff.type) {
            case 1: mods.speed += val; break;
            case 2: mods.stamina += val; break;
            case 3: mods.power += val; break;
            case 4: mods.guts += val; break;
            case 5: mods.wisdom += val; break;
          }
        }
      }
    }
    result[horseIdx] = mods;
  }
  return result;
}

const SPOT_STRUGGLE_DIST_RATIO = 9 / 24;
const SPOT_STRUGGLE_GUTS_DURATION_BASE = 700;
const SPOT_STRUGGLE_GUTS_DURATION_EXPONENT = 0.5;
const SPOT_STRUGGLE_GUTS_DURATION_SCALE = 0.012;
const DUEL_RECENT_UPHILL_EXIT_GRACE = 4.0;

export function computeOtherEvents(
  events: EventData[],
  frames: FrameData[],
  horseInfos: HeuristicHorseInfo[],
  courseDistance: number,
  slopes: { start: number; length: number; slope: number }[],
  skillDb: Map<number, SkillEntry> | null | undefined,
  skillActivations: Record<number, { time: number; param: number[] }[]>,
  surface: number,
  groundCondition: number,
): Record<number, { time: number; duration: number; name: string }[]> {
  const allOtherEvents: Record<number, { time: number; duration: number; name: string }[]> = {};
  if (!frames.length) return allOtherEvents;

  const groundPowerBonus = computeGroundPowerBonus(surface, groundCondition);
  const horseMap = new Map<number, HeuristicHorseInfo>();
  for (const h of horseInfos) horseMap.set(h.horseIndex, h);

  for (const evt of events) {
    const horseIdx = evt.param[0]!;
    if (horseIdx < 0 || horseIdx >= horseInfos.length) continue;
    const startTime = evt.frameTime;

    if (evt.type === COMPETE_FIGHT) {
      const startHp = frames[0]?.horseFrames[horseIdx]?.hp ?? 1000;
      const hpThreshold = startHp * DUEL_HP_THRESHOLD_RATIO;
      let endTime = frames[frames.length - 1]!.time;

      let startIndex = 0;
      for (let i = 0; i < frames.length; i++) {
        if (frames[i]!.time >= startTime) { startIndex = i; break; }
      }

      let lastUphillAffectedTime = -Infinity;
      for (let i = startIndex; i < frames.length; i++) {
        const f = frames[i]!;
        if ((f.horseFrames[horseIdx]?.hp ?? 0) < hpThreshold) {
          endTime = f.time; break;
        }
        const h = f.horseFrames[horseIdx];
        if (!h) continue;
        const dist = h.distance ?? 0;
        const currentSlopeObj = slopes.find(s => dist >= s.start && dist < s.start + s.length);
        const currentSlope = currentSlopeObj?.slope ?? 0;
        if (currentSlope > 0) {
          lastUphillAffectedTime = f.time;
        }
        const recentlyExitedUphill = f.time - lastUphillAffectedTime <= DUEL_RECENT_UPHILL_EXIT_GRACE;
        if (!recentlyExitedUphill && currentSlope <= 0) {
          const currentSpeed = h.speed / 100;

          let accel = 0;
          if (i < frames.length - 1) {
            const nextFrame = frames[i + 1]!;
            const nextH = nextFrame.horseFrames[horseIdx];
            if (nextH) {
              const nextSpeed = nextH.speed / 100;
              const dt = nextFrame.time - f.time;
              if (dt > 0) accel = (nextSpeed - currentSpeed) / dt;
            }
          }

          let activeSpeedBuff = 0;
          if (skillActivations[horseIdx]) {
            for (const act of skillActivations[horseIdx]!) {
              const dur = getSkillDurationSecs(skillDb, act.param[1]!, courseDistance, act.time, act.param[2], act.param[3]!);
              if (f.time >= act.time && f.time < act.time + dur) {
                activeSpeedBuff += getActiveSpeedModifier(skillDb, act.param[1]!, act.param[3]!);
              }
            }
          }
          const info = horseMap.get(horseIdx);
          if (!info) continue;
          const speedParams = {
            courseDistance, currentDistance: dist, speedStat: info.speed,
            wisdomStat: info.wiz, powerStat: info.pow, gutsStat: info.guts, staminaStat: info.stamina,
            strategy: info.strategy, distanceProficiency: info.distanceProficiency,
            strategyProficiency: info.strategyProficiency, mood: info.mood,
            inLastSpurt: false, slope: 0, activeSpeedBuff, isDueling: true, isSpotStruggle: false,
            isRushed: false, rushedType: 0,
          };
          const targetRes = calculateTargetSpeed(speedParams);
          let adjustedTarget = targetRes.base;
          if (currentSlope > 0) {
            const slopePer = currentSlope / SLOPE_SCALE;
            const adjPower = adjustStat(info.pow, info.mood, groundPowerBonus);
            adjustedTarget -= (slopePer * SLOPE_PENALTY_COEFF) / adjPower;
          }

          const DUEL_UPHILL_SPEED_SLACK = 0.2;
          const DUEL_ENTRY_ACCEL_MAX = 0.1;
          const DUEL_RESUME_SPEED_SLACK = 0.02;

          if (adjustedTarget > currentSpeed + DUEL_UPHILL_SPEED_SLACK && accel < DUEL_ENTRY_ACCEL_MAX) {
            let duelResumed = false;
            for (let j = i + 1; j < frames.length; j++) {
              const ff = frames[j]!;
              const fh = ff.horseFrames[horseIdx];
              if (!fh) continue;
              const fs = fh.speed / 100;
              const fd = fh.distance ?? 0;
              let fBuff = 0;
              if (skillActivations[horseIdx]) {
                for (const act of skillActivations[horseIdx]!) {
                  const dur = getSkillDurationSecs(skillDb, act.param[1]!, courseDistance, act.time, act.param[2], act.param[3]!);
                  if (ff.time >= act.time && ff.time < act.time + dur) {
                    fBuff += getActiveSpeedModifier(skillDb, act.param[1]!, act.param[3]!);
                  }
                }
              }
              const fParams = {
                courseDistance, currentDistance: fd, speedStat: info.speed,
                wisdomStat: info.wiz, powerStat: info.pow, gutsStat: info.guts, staminaStat: info.stamina,
                strategy: info.strategy, distanceProficiency: info.distanceProficiency,
                strategyProficiency: info.strategyProficiency, mood: info.mood,
                inLastSpurt: false, slope: 0, activeSpeedBuff: fBuff, isDueling: false, isSpotStruggle: false,
                isRushed: false, rushedType: 0,
              };
              const fRes = calculateTargetSpeed(fParams);
              let fAdjusted = fRes.base;
              const fSlopeObj = slopes.find(s => fd >= s.start && fd < s.start + s.length);
              const fSlope = fSlopeObj?.slope ?? 0;
              if (fSlope > 0) {
                const slopePer = fSlope / SLOPE_SCALE;
                const adjPower = adjustStat(info.pow, info.mood, groundPowerBonus);
                fAdjusted -= (slopePer * SLOPE_PENALTY_COEFF) / adjPower;
              }
              let fDownhill = 0;
              if (fSlope < 0 && j < frames.length - 1) {
                const nf = frames[j + 1]!;
                const nh = nf.horseFrames[horseIdx];
                if (nh) {
                  const dt = nf.time - ff.time;
                  if (dt > 0) {
                    const rate = ((fh.hp ?? 0) - (nh.hp ?? 0)) / dt;
                    const expected = computeReferenceHpConsumption(fs, courseDistance);
                    if (expected > 0 && rate > 0 && rate / expected < DOWNHILL_HP_RATIO_THRESHOLD) {
                      fDownhill = DOWNHILL_BONUS_BASE + Math.abs(fSlope) / DOWNHILL_BONUS_DIVISOR;
                    }
                  }
                }
              }
              if (fs > fAdjusted + fDownhill + DUEL_RESUME_SPEED_SLACK) {
                duelResumed = true; break;
              }
            }
            if (!duelResumed) {
              endTime = f.time; break;
            }
          }
        }
      }

      if (!allOtherEvents[horseIdx]) allOtherEvents[horseIdx] = [];
      allOtherEvents[horseIdx]!.push({ time: startTime, duration: endTime - startTime, name: 'Dueling' });
    }

    if (evt.type === COMPETE_TOP) {
      const info = horseMap.get(horseIdx);
      if (!info) continue;
      const frontRunnerAptitude = info.frontRunnerProficiency ?? info.strategyProficiency;
      const gutsDuration = Math.pow(SPOT_STRUGGLE_GUTS_DURATION_BASE * info.guts, SPOT_STRUGGLE_GUTS_DURATION_EXPONENT) * SPOT_STRUGGLE_GUTS_DURATION_SCALE
        * (STRATEGY_PROFICIENCY_MODIFIER[frontRunnerAptitude] ?? 1.0);
      const distanceThreshold = SPOT_STRUGGLE_DIST_RATIO * courseDistance;
      let thresholdTime = -1;
      for (let i = 0; i < frames.length; i++) {
        if ((frames[i]!.horseFrames[horseIdx]?.distance ?? 0) >= distanceThreshold) {
          thresholdTime = frames[i]!.time; break;
        }
      }
      if (thresholdTime < 0) thresholdTime = frames[frames.length - 1]!.time;
      if (startTime < thresholdTime) {
        const duration = Math.min(gutsDuration, thresholdTime - startTime);
        if (!allOtherEvents[horseIdx]) allOtherEvents[horseIdx] = [];
        allOtherEvents[horseIdx]!.push({ time: startTime, duration, name: 'Spot Struggle' });
      }
    }
  }
  return allOtherEvents;
}

export function computeHeuristicEvents(
  frames: FrameData[],
  courseDistance: number,
  slopes: { start: number; length: number; slope: number }[],
  horses: HeuristicHorseInfo[],
  lastSpurtStartDistances?: (number | undefined)[],
  options?: {
    skillDb?: Map<number, SkillEntry> | null;
    events?: EventData[];
    skillActivations?: Record<number, { time: number; name: string; param: number[] }[]>;
    otherEvents?: Record<number, { time: number; duration: number; name: string }[]>;
    trackSpeedMultiplier?: number;
    groundPowerBonus?: number;
    surface?: number;
    groundCondition?: number;
    racetrackFilterData?: { id: number; statThresholds?: string[] }[];
  },
): Map<number, HeuristicSummary> {
  const result = new Map<number, HeuristicSummary>();
  if (!frames.length || courseDistance <= 0) return result;

  const positionKeepEnd = POSITION_KEEP_END_RATIO * courseDistance;
  const courseFactor = 1 + (courseDistance - COURSE_FACTOR_BASE_DIST) * COURSE_FACTOR_MULTIPLIER;

  const hasFrontRunner = horses.some(h => h.strategy === 1 || h.isOonige);

  const {
    skillDb,
    events,
    skillActivations: externalSkillActivations,
    otherEvents: externalOtherEvents,
    trackSpeedMultiplier = 1.0,
    surface = 0,
    groundCondition = 0,
  } = options ?? {};

  const skillActivations = externalSkillActivations
    ?? (events ? computeSkillActivations(events, horses.length) : undefined);

  const otherEvents = externalOtherEvents
    ?? (events && skillDb ? computeOtherEvents(
      events, frames, horses, courseDistance, slopes, skillDb,
      skillActivations ?? {}, surface, groundCondition,
    ) : undefined);

  const groundBonus = computeGroundPowerBonus(surface, groundCondition);

  const greenStatsByHorse = skillActivations && skillDb
    ? computePassiveStatModifiers(skillActivations, skillDb)
    : undefined;

  let designatedPacemaker = -1;
  if (!hasFrontRunner && horses.length > 0) {
    const sorted = [...horses].sort((a, b) => {
      if (a.strategy !== b.strategy) return a.strategy - b.strategy;
      return a.horseIndex - b.horseIndex;
    });
    designatedPacemaker = sorted[0]!.horseIndex;
  }

  const horseMap = new Map<number, HeuristicHorseInfo>();
  for (const h of horses) horseMap.set(h.horseIndex, h);

  const activeModes = new Map<number, { type: string; startTime: number; lastTime: number }>();
  const activeDownhill = new Map<number, { startTime: number; lastTime: number }>();

  const closeMode = (hi: number, time: number) => {
    const mode = activeModes.get(hi);
    if (mode) {
      const duration = time - mode.startTime;
      if (duration > MIN_EVENT_DURATION) {
        if (!horseEvents.has(hi)) horseEvents.set(hi, []);
        horseEvents.get(hi)!.push({ time: mode.startTime, duration, name: mode.type });
      }
      activeModes.delete(hi);
    }
  };

  const closeDownhill = (hi: number, time: number) => {
    const dh = activeDownhill.get(hi);
    if (dh) {
      const duration = time - dh.startTime;
      if (duration > MIN_EVENT_DURATION) {
        if (!horseEvents.has(hi)) horseEvents.set(hi, []);
        horseEvents.get(hi)!.push({ time: dh.startTime, duration, name: 'Downhill Mode' });
      }
      activeDownhill.delete(hi);
    }
  };

  const horseEvents = new Map<number, HeuristicEvent[]>();
  for (const h of horses) horseEvents.set(h.horseIndex, []);

  for (let f = 0; f < frames.length - 1; f++) {
    const frame = frames[f]!;
    const nextFrame = frames[f + 1]!;
    const time = frame.time;
    const dt = nextFrame.time - time;
    if (dt <= 0) continue;

    let leaderDistance = 0;
    for (const hf of frame.horseFrames) {
      if (hf && hf.distance > leaderDistance) leaderDistance = hf.distance;
    }

    for (const hi of frame.horseFrames.keys()) {
      const horseInfo = horseMap.get(hi);
      if (!horseInfo) continue;

      const h = frame.horseFrames[hi];
      const hn = nextFrame.horseFrames[hi];
      if (!h || !hn) continue;

      const currentDistance = h.distance;
      const currentSpeed = h.speed / 100;
      const nextSpeed = hn.speed / 100;
      const accel = (nextSpeed - currentSpeed) / dt;

      const distanceFromLeader = leaderDistance - currentDistance;
      const isPastPK = currentDistance >= positionKeepEnd;

      if (isPastPK) {
        closeMode(hi, time);
        closeDownhill(hi, time);
      }

      const strategy = horseInfo.strategy;
      const isOonige = horseInfo.isOonige ?? false;
      const isFrontRunner = strategy === 1 || isOonige;

      const currentSlope = getCurrentSlope(currentDistance, slopes);

      const hpDiff = (h.hp ?? 0) - (hn.hp ?? 0);
      const rate = hpDiff / dt;
      const expected = computeReferenceHpConsumption(currentSpeed, courseDistance);
      const hpConsumptionRatio = expected > 0 && rate > 0 ? rate / expected : 1;

      const tempMode = h.temptationMode ?? 0;
      let isRushed = false;
      let rushedType = 0;
      if (tempMode > 0) {
        isRushed = true;
        if (tempMode === TEMPTATION_MODE_RUSH_BOOST) rushedType = 2;
      }

      const lastSpurtDist = lastSpurtStartDistances?.[hi] ?? -1;
      const inLastSpurt = lastSpurtDist > 0 && currentDistance >= lastSpurtDist;

      let activeSpeedBuff = 0;
      if (skillActivations?.[hi]) {
        for (const act of skillActivations[hi]!) {
          const dur = getSkillDurationSecs(skillDb as Map<number, SkillEntry> | null | undefined, act.param[1]!, courseDistance, act.time, act.param[2], act.param[3]!);
          if (time >= act.time && time < act.time + dur) {
            activeSpeedBuff += getActiveSpeedModifier(skillDb as Map<number, SkillEntry> | null | undefined, act.param[1]!, act.param[3]!);
          }
        }
      }

      let isSpotStruggle = false;
      let isDueling = false;
      if (otherEvents?.[hi]) {
        for (const evt of otherEvents[hi]!) {
          if (time >= evt.time && time < evt.time + evt.duration) {
            if (evt.name.includes('Spot Struggle') || evt.name.includes('Competes (Pos)')) isSpotStruggle = true;
            if (evt.name.includes('Dueling') || evt.name.includes('Competes (Speed)')) isDueling = true;
          }
        }
      }

      const greenStats = greenStatsByHorse?.[hi];
      const speedParams = {
        courseDistance,
        currentDistance,
        speedStat: horseInfo.speed,
        wisdomStat: horseInfo.wiz,
        powerStat: horseInfo.pow,
        gutsStat: horseInfo.guts,
        staminaStat: horseInfo.stamina,
        strategy,
        distanceProficiency: horseInfo.distanceProficiency,
        strategyProficiency: horseInfo.strategyProficiency,
        mood: horseInfo.mood,
        inLastSpurt,
        slope: currentSlope,
        trackSpeedMultiplier: horseInfo.trackSpeedMultiplier ?? trackSpeedMultiplier,
        greenSkillBonuses: greenStats ? { ...greenStats, power: (greenStats.power ?? 0) + groundBonus } : { power: groundBonus },
        isOonige,
        activeSpeedBuff,
        isSpotStruggle,
        isDueling,
        isRushed,
        rushedType,
      };

      const res = calculateTargetSpeed(speedParams);
      let referenceMax = res.max;

      if (currentSlope > 0) {
        const currentSlopeObj = slopes.find(s => currentDistance >= s.start && currentDistance < s.start + s.length);
        const slopeEnd = currentSlopeObj ? currentSlopeObj.start + currentSlopeObj.length : currentDistance + 100;
        if (slopeEnd - currentDistance < 25) {
          const nextSlopeObj = slopes.find(s => slopeEnd >= s.start && slopeEnd < s.start + s.length);
          const nextSlope = nextSlopeObj?.slope ?? 0;
          const resNext = calculateTargetSpeed({ ...speedParams, slope: nextSlope });
          referenceMax = Math.max(referenceMax, resNext.max);
        }
      }

      let isDownhillMode = false;
      let downhillSpeedBonus = 0;

      if (currentSlope < 0) {
        downhillSpeedBonus = DOWNHILL_BONUS_BASE + Math.abs(currentSlope) / DOWNHILL_BONUS_DIVISOR;

        if (expected > 0 && rate > 0 && hpConsumptionRatio < DOWNHILL_HP_RATIO_THRESHOLD) {
          if (hpConsumptionRatio < DOWNHILL_HP_RATIO_STRONG) {
            isDownhillMode = true;
          } else {
            const baseSpeedNoBuffs = res.base - activeSpeedBuff;
            const targetDownhill = res.base + downhillSpeedBonus;
            const targetDownhillPaceUp = (baseSpeedNoBuffs * PACE_UP_MULTIPLIER) + activeSpeedBuff + downhillSpeedBonus;
            const targetDownhillPaceDown = (baseSpeedNoBuffs * PACE_DOWN_MULTIPLIER) + activeSpeedBuff + downhillSpeedBonus;
            const candidates = [targetDownhill, targetDownhillPaceUp, targetDownhillPaceDown];

            const targetNormal = res.base;
            const targetPaceUp = (baseSpeedNoBuffs * PACE_UP_MULTIPLIER) + activeSpeedBuff;
            const targetPaceDown = (baseSpeedNoBuffs * PACE_DOWN_MULTIPLIER) + activeSpeedBuff;
            const nonDownhillCandidates = [targetNormal, targetPaceUp, targetPaceDown];

            let minDiff = Number.MAX_VALUE;
            let bestMatchIsDownhill = true;

            for (const c of candidates) {
              const diff = Math.abs(currentSpeed - c);
              if (diff < minDiff) { minDiff = diff; bestMatchIsDownhill = true; }
            }
            for (const c of nonDownhillCandidates) {
              const diff = Math.abs(currentSpeed - c);
              if (diff < minDiff) { minDiff = diff; bestMatchIsDownhill = false; }
            }

            if (bestMatchIsDownhill) {
              isDownhillMode = true;
            } else {
              if (Math.abs(currentSpeed - targetNormal) < DOWNHILL_NORMAL_MATCH_TOL &&
                  Math.abs(currentSpeed - targetDownhill) > DOWNHILL_NORMAL_MATCH_TOL) {
                isDownhillMode = false;
              } else {
                isDownhillMode = true;
              }
            }
          }
        }
      }

      if (isDownhillMode) {
        referenceMax += downhillSpeedBonus;
      }

      if (!isPastPK) {
        const posKeepRange = POSITION_KEEP_RANGES[strategy]?.(courseFactor) ?? { min: 0, max: 1000 };
        const paceUpDistanceThreshold = posKeepRange.max - (designatedPacemaker >= 0 ? PACEMAKER_PACE_UP_LENIENCY : 0);
        const canPaceUp = !isFrontRunner && distanceFromLeader > paceUpDistanceThreshold;
        const canPaceDown = !isFrontRunner && distanceFromLeader < posKeepRange.min;

        const isEarlyRace = time < EARLY_RACE_TIME;
        const isEarlyRacePaceDown = isEarlyRace && !isFrontRunner && hi !== designatedPacemaker;

        let isTriggeredHigh = false;
        let isTriggeredLow = false;

        if (currentSpeed > referenceMax * PACE_TRIGGER_RATIO || (currentSpeed > referenceMax && accel > PACE_TRIGGER_ACCEL)) {
          if (isFrontRunner) {
            if (isDownhillMode) {
              const baseSpeedNoBuffs = res.base - activeSpeedBuff - downhillSpeedBonus;
              const downhillOnlyMax = baseSpeedNoBuffs + activeSpeedBuff + downhillSpeedBonus;
              const speedUpDownhillMax = (baseSpeedNoBuffs * PACE_UP_MULTIPLIER) + activeSpeedBuff + downhillSpeedBonus;
              const overtakeDownhillMax = (baseSpeedNoBuffs * OVERTAKE_MULTIPLIER) + activeSpeedBuff + downhillSpeedBonus;

              if (currentSpeed > downhillOnlyMax * PACE_TRIGGER_RATIO ||
                  Math.abs(currentSpeed - speedUpDownhillMax) < SPEED_MATCH_TOLERANCE ||
                  Math.abs(currentSpeed - overtakeDownhillMax) < SPEED_MATCH_TOLERANCE) {
                isTriggeredHigh = true;
              }
            } else {
              isTriggeredHigh = true;
            }
          } else if (canPaceUp) {
            if (isDownhillMode) {
              const downhillOnlyMax = referenceMax + downhillSpeedBonus;
              const baseSpeedNoBuffs = res.base - activeSpeedBuff;
              const downhillPaceUpMax = (baseSpeedNoBuffs * PACE_UP_MULTIPLIER) + activeSpeedBuff + downhillSpeedBonus;

              if (currentSpeed > downhillOnlyMax * PACE_TRIGGER_RATIO ||
                  (Math.abs(currentSpeed - downhillPaceUpMax) < SPEED_MATCH_TOLERANCE && accel > PACE_TRIGGER_ACCEL)) {
                isTriggeredHigh = true;
              }
            } else {
              isTriggeredHigh = true;
            }
          }
        }

        if (accel < PACE_EXIT_DECEL && currentSpeed < referenceMax * PACE_EXIT_SPEED_RATIO) {
          isTriggeredHigh = false;
        }

        const theoreticalPaceDown = (res.base * PACE_DOWN_MULTIPLIER) + activeSpeedBuff + (isDownhillMode ? downhillSpeedBonus : 0);

        if (isEarlyRacePaceDown) {
          if (currentSpeed < theoreticalPaceDown * EARLY_PACE_DOWN_SPEED_RATIO && activeSpeedBuff <= 0) {
            isTriggeredLow = true;
          }
        } else if (activeSpeedBuff <= 0) {
          let speedIndicatesPaceDown = false;
          let hpIndicatesPaceDown = false;

          if (!isDownhillMode &&
              (currentSpeed < res.min * PACE_DOWN_SPEED_THRESHOLD ||
               (currentSpeed < res.min && accel < PACE_DOWN_DECEL_THRESHOLD)) &&
              accel < PACE_DOWN_ACCEL_CEILING) {
            speedIndicatesPaceDown = true;
          }

          if (!isFrontRunner && canPaceDown &&
              currentSpeed < theoreticalPaceDown * PACE_DOWN_SPEED_SOFT_RATIO &&
              accel < PACE_DOWN_ACCEL_LIMIT) {
            if (isDownhillMode) {
              if (hpConsumptionRatio < DOWNHILL_HP_RATIO_PACE_DOWN) {
                hpIndicatesPaceDown = true;
              }
            } else {
              if (hpConsumptionRatio < DOWNHILL_HP_RATIO_THRESHOLD) {
                hpIndicatesPaceDown = true;
              }
            }
          }

          if (speedIndicatesPaceDown || hpIndicatesPaceDown) {
            isTriggeredLow = true;
          }
        }

        if ((accel > PACE_DOWN_EXIT_ACCEL && currentSpeed > theoreticalPaceDown * PACE_DOWN_EXIT_SPEED_RATIO) ||
            currentSpeed > theoreticalPaceDown * PACE_DOWN_SPEED_SOFT_RATIO) {
          isTriggeredLow = false;
        }

        const currentMode = activeModes.get(hi);

        if (currentMode) {
          if (currentMode.type === 'Pace Up' || currentMode.type === 'Speed Up' || currentMode.type === 'Overtake') {
            if (!isTriggeredHigh) {
              closeMode(hi, time);
            } else {
              currentMode.lastTime = time;
            }
          } else if (currentMode.type === 'Pace Down') {
            if (!isTriggeredLow) {
              closeMode(hi, time);
            } else {
              currentMode.lastTime = time;
            }
          }
        } else {
          if (isTriggeredHigh) {
            if (isFrontRunner) {
              const isFirst = Math.abs(currentDistance - leaderDistance) < LEADER_PROXIMITY_EPSILON;
              activeModes.set(hi, { type: isFirst ? 'Speed Up' : 'Overtake', startTime: time, lastTime: time });
            } else {
              activeModes.set(hi, { type: 'Pace Up', startTime: time, lastTime: time });
            }
          } else if (isTriggeredLow) {
            if (!isFrontRunner) {
              activeModes.set(hi, { type: 'Pace Down', startTime: time, lastTime: time });
            }
          }
        }
      }

      const currentDh = activeDownhill.get(hi);
      if (currentDh) {
        if (!isDownhillMode) {
          closeDownhill(hi, time);
        } else {
          currentDh.lastTime = time;
        }
      } else {
        if (isDownhillMode) {
          activeDownhill.set(hi, { startTime: time, lastTime: time });
        }
      }
    }
  }

  const lastTime = frames[frames.length - 1]!.time;

  for (const hi of activeModes.keys()) {
    closeMode(hi, lastTime);
  }
  for (const hi of activeDownhill.keys()) {
    closeDownhill(hi, lastTime);
  }

  for (const h of horses) {
    const events2 = horseEvents.get(h.horseIndex) ?? [];
    const summary: HeuristicSummary = {
      downhillDuration: 0,
      paceUpDuration: 0,
      paceDownDuration: 0,
      overtakeDuration: 0,
      speedUpDuration: 0,
    };
    for (const e of events2) {
      switch (e.name) {
        case 'Downhill Mode': summary.downhillDuration += e.duration; break;
        case 'Pace Up': summary.paceUpDuration += e.duration; break;
        case 'Pace Down': summary.paceDownDuration += e.duration; break;
        case 'Overtake': summary.overtakeDuration += e.duration; break;
        case 'Speed Up': summary.speedUpDuration += e.duration; break;
      }
    }
    result.set(h.horseIndex, summary);
  }

  return result;
}

export function computeHpOutcome(horseIndex: number, frames: FrameData[], raceDistance: number): { current: number; max: number; died: boolean; deathDist?: number; deficit?: number } {
  if (!frames.length) return { current: 0, max: 1000, died: false };
  const startHp = frames[0]!.horseFrames[horseIndex]?.hp ?? 1000;
  let deathDist: number | undefined;
  for (const f of frames) {
    const hp = f.horseFrames[horseIndex]?.hp ?? 0;
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

export function computeDuelDurations(horseIndex: number, frames: FrameData[], events: EventData[]): number {
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
