import { ref, type Ref, type ComputedRef } from 'vue';
import type { RaceSimulateData, HorseFrameData, EventData } from '../utils/raceSimDecoder';
import type { SkillEntry } from '../utils/skillDatabase';
import { getSkillName } from '../utils/skillData';
import { getUmaImagePath } from '../utils/umaData';
import {
  getInterpolatedFrame, getXFromDist, getViewportBounds,
  getCourseSegments,
  clamp,
  CW, CH, CX, TRACK_Y, TRACK_H, ICON_R,
  HORSE_Y_MIN, HORSE_Y_RANGE,
  STRAIGHT_COLOR, CORNER_COLOR, UPHILL_COLOR, DOWNHILL_COLOR,
  HP_WARN_THRESHOLD,
  effectColors,
  styleColors,
  type ReplayData,
  type ReplayHorse,
} from '../utils/raceReplayUtils';
import type { SkillEffectCategory } from '../utils/skillDatabase';

export function useRaceCanvas(options: {
  canvasRef: Ref<HTMLCanvasElement | null>;
  replayData: ReplayData;
  simData: Readonly<Ref<RaceSimulateData | null | undefined>>;
  elapsedTime: Ref<number>;
  skillDb: Ref<Map<number, SkillEntry> | null>;
  totalDistance: ComputedRef<number>;
  horsesByFinish: ComputedRef<any[]>;
}) {
  const { canvasRef, replayData, simData, elapsedTime, skillDb, totalDistance, horsesByFinish } = options;

  const sortedByDistance = ref<{ horseIndex: number; distance: number; speed: number; name: string; style: number; lanePos: number; blocked: boolean; blockingHorse: number; hp: number; }[]>([]);
  const activeSkills = ref<{ frameTime: number; horseIndex: number; skillId: number; name: string; category: string; desc: string; remaining: number; }[]>([]);
  const charImages = ref<Map<number, HTMLImageElement>>(new Map());

  const _skillDurCache = new Map<string, number>();
  let _type3Events: EventData[] | null = null;
  let _type3EventsSimKey: number = 0;
  let _skillTick = 0;

  function loadCharImages() {
    for (const h of replayData.RaceHorse) {
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

  function getSkillDurationSecs(skillId: number, frameTime: number, reportedDuration?: number): number {
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

  function _getCachedSkillDur(skillId: number, frameTime: number, reportedDuration?: number): number {
    const key = `${frameTime}:${skillId}`;
    let d = _skillDurCache.get(key);
    if (d === undefined) {
      d = getSkillDurationSecs(skillId, frameTime, reportedDuration);
      _skillDurCache.set(key, d);
    }
    return d;
  }

  function drawCourseBands(ctx: CanvasRenderingContext2D, leaderDist: number) {
    const segs = getCourseSegments(totalDistance.value, replayData.RaceCourseSet?.Id, true);
    const baseSegments = segs.filter(s => s.type === 'straight' || s.type === 'corner');
    const slopeSegments = segs.filter(s => s.type === 'uphill' || s.type === 'downhill');

    for (const seg of baseSegments) {
      const x1 = getXFromDist(seg.start, leaderDist, totalDistance.value);
      const x2 = getXFromDist(seg.end, leaderDist, totalDistance.value);
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

    for (const seg of slopeSegments) {
      const x1 = getXFromDist(seg.start, leaderDist, totalDistance.value);
      const x2 = getXFromDist(seg.end, leaderDist, totalDistance.value);
      if (x2 < CX + 8 || x1 > CX + CW - 8) continue;
      const lx = Math.max(CX + 8, x1);
      const rx = Math.min(CX + CW - 8, x2);
      const w = rx - lx;
      if (w < 1) continue;
      ctx.fillStyle = seg.type === 'uphill' ? UPHILL_COLOR : DOWNHILL_COLOR;
      ctx.fillRect(lx, TRACK_Y, w, CH - TRACK_Y - 8);
      ctx.fillStyle = seg.type === 'uphill' ? 'rgba(132, 204, 22, 0.35)' : 'rgba(251, 191, 36, 0.35)';
      ctx.fillRect(lx, TRACK_Y, w, 4);
      ctx.fillStyle = seg.type === 'uphill' ? 'rgba(132, 204, 22, 0.55)' : 'rgba(251, 191, 36, 0.55)';
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const cx = (lx + rx) / 2;
      ctx.fillText(seg.label, cx, TRACK_Y + TRACK_H + 34);
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
      const x = getXFromDist(m, leaderDist, totalDistance.value);
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

    const goalX = getXFromDist(totalDistance.value, leaderDist, totalDistance.value);
    if (goalX >= CX + 8 && goalX <= CX + CW - 8) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('GOAL', goalX, TRACK_Y - 14);
    }
  }

  function drawHorses(ctx: CanvasRenderingContext2D, horseFrames: HorseFrameData[]) {
    const entries = horseFrames.map((hf, i) => ({
      hf, meta: replayData.RaceHorse[i], horseIndex: i,
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

      const x = getXFromDist(e.hf.distance, leaderDist, totalDistance.value);
      if (x < CX - 40 || x > CX + CW + 40) continue;

      const laneRatio = laneSpread > 0 ? clamp((e.hf.lanePosition - minLane) / laneSpread, 0, 1) : 0.5;
      const y = HORSE_Y_MIN + (1 - laneRatio) * HORSE_Y_RANGE;
      const isTop3 = horsesByFinish.value.some((h: any) => h.horseIndex === meta.horseIndex && h.finishPosition <= 3);
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

  function drawSkillEvents(ctx: CanvasRenderingContext2D, horseFrames: HorseFrameData[], leaderDist: number) {
    if (!simData.value) return;
    const time = elapsedTime.value;
    let smin = Infinity, smax = 0;
    for (const hf of horseFrames) {
      if (hf.lanePosition < smin) smin = hf.lanePosition;
      if (hf.lanePosition > smax) smax = hf.lanePosition;
    }
    const sSpread = Math.max(smax - smin, 1);

    const db = skillDb.value;

    const currentSimKey = simData.value.frameCount + simData.value.events.length;
    if (!_type3Events || _type3EventsSimKey !== currentSimKey) {
      _type3Events = simData.value.events.filter(e => e.type === 3 && e.param[0] != null);
      _type3EventsSimKey = currentSimKey;
      _skillDurCache.clear();
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
      const x = getXFromDist(hf.distance, leaderDist, totalDistance.value);
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

  function render(_timestamp: number, sd: RaceSimulateData) {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CW, CH);

    const horseFrames = getInterpolatedFrame(sd, elapsedTime.value);

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
    const vb = getViewportBounds(leaderDist, totalDistance.value);
    ctx.fillText(Math.round(vb.left) + '-' + Math.round(vb.right) + 'm', CX + 64, 18);
  }

  return {
    charImages,
    sortedByDistance,
    activeSkills,
    loadCharImages,
    render,
  };
}
