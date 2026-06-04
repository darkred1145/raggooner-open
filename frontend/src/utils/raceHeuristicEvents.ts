import type { FrameData, EventData } from './raceSimDecoder';
import {
  MIN_EVENT_DURATION,
  BASE_SPEED_CONSTANT, BASE_SPEED_COURSE_OFFSET, BASE_SPEED_COURSE_SCALE,
  HP_CONSUMPTION_SCALE, HP_CONSUMPTION_SPEED_OFFSET, HP_CONSUMPTION_DIVISOR,
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
import { calculateTargetSpeed, computeReferenceHpConsumption } from './speedCalculations';

export const DUEL_HP_THRESHOLD_RATIO = 0.05;
export const DEATH_EPSILON = 0.1;

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

export function computeHeuristicEvents(
  frames: FrameData[],
  courseDistance: number,
  slopes: { start: number; length: number; slope: number }[],
  horses: HeuristicHorseInfo[],
  lastSpurtStartDistances?: (number | undefined)[],
): Map<number, HeuristicSummary> {
  const result = new Map<number, HeuristicSummary>();
  if (!frames.length || courseDistance <= 0) return result;

  const positionKeepEnd = POSITION_KEEP_END_RATIO * courseDistance;
  const courseFactor = 1 + (courseDistance - COURSE_FACTOR_BASE_DIST) * COURSE_FACTOR_MULTIPLIER;

  const hasFrontRunner = horses.some(h => h.strategy === 1 || h.isOonige);

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

      const speedParams = {
        courseDistance,
        currentDistance,
        speedStat: horseInfo.speed,
        wisdomStat: horseInfo.wiz,
        powerStat: horseInfo.pow,
        gutsStat: horseInfo.guts,
        strategy,
        distanceProficiency: horseInfo.distanceProficiency,
        strategyProficiency: horseInfo.strategyProficiency,
        mood: horseInfo.mood,
        inLastSpurt,
        slope: currentSlope,
        isOonige,
        activeSpeedBuff: 0,
        isSpotStruggle: false,
        isDueling: false,
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
            const baseSpeedNoBuffs = res.base;
            const targetDownhill = res.base + downhillSpeedBonus;
            const targetDownhillPaceUp = (baseSpeedNoBuffs * PACE_UP_MULTIPLIER) + downhillSpeedBonus;
            const targetDownhillPaceDown = (baseSpeedNoBuffs * PACE_DOWN_MULTIPLIER) + downhillSpeedBonus;
            const candidates = [targetDownhill, targetDownhillPaceUp, targetDownhillPaceDown];

            const targetNormal = res.base;
            const targetPaceUp = baseSpeedNoBuffs * PACE_UP_MULTIPLIER;
            const targetPaceDown = baseSpeedNoBuffs * PACE_DOWN_MULTIPLIER;
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
              const baseSpeedNoBuffs = res.base;
              const downhillOnlyMax = baseSpeedNoBuffs + downhillSpeedBonus;
              const speedUpDownhillMax = (baseSpeedNoBuffs * PACE_UP_MULTIPLIER) + downhillSpeedBonus;
              const overtakeDownhillMax = (baseSpeedNoBuffs * OVERTAKE_MULTIPLIER) + downhillSpeedBonus;

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
              const baseSpeedNoBuffs = res.base;
              const downhillPaceUpMax = (baseSpeedNoBuffs * PACE_UP_MULTIPLIER) + downhillSpeedBonus;

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

        const theoreticalPaceDown = (res.base * PACE_DOWN_MULTIPLIER) + (isDownhillMode ? downhillSpeedBonus : 0);

        if (isEarlyRacePaceDown) {
          if (currentSpeed < theoreticalPaceDown * EARLY_PACE_DOWN_SPEED_RATIO) {
            isTriggeredLow = true;
          }
        } else {
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
    const events = horseEvents.get(h.horseIndex) ?? [];
    const summary: HeuristicSummary = {
      downhillDuration: 0,
      paceUpDuration: 0,
      paceDownDuration: 0,
      overtakeDuration: 0,
      speedUpDuration: 0,
    };
    for (const e of events) {
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
