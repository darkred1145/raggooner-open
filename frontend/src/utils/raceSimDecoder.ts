export type HorseFrameData = {
  distance: number;
  lanePosition: number;
  speed: number;
  hp: number;
  temptationMode: number;
  blockFrontHorseIndex: number;
};

export type FrameData = {
  time: number;
  horseFrames: HorseFrameData[];
};

export type HorseResultData = {
  finishOrder: number;
  finishTime: number;
  finishDiffTime: number;
  startDelayTime: number;
  gutsOrder: number;
  wizOrder: number;
  lastSpurtStartDistance: number;
  runningStyle: number;
  defeat: number;
  finishTimeRaw: number;
};

export type EventData = {
  frameTime: number;
  type: number;
  param: number[];
};

export type RaceSimulateData = {
  header: { maxLength: number; version: number };
  distanceDiffMax: number;
  horseNum: number;
  horseFrameSize: number;
  horseResultSize: number;
  frameCount: number;
  frameSize: number;
  frames: FrameData[];
  horseResults: HorseResultData[];
  events: EventData[];
};

function parseRaceSimData(buf: ArrayBuffer): RaceSimulateData {
  const dv = new DataView(buf);
  let offset = 0;

  const maxLength = dv.getInt32(offset, true); offset += 4;
  const version = dv.getInt32(offset, true); offset += 4;

  offset = 4 + maxLength;

  const distanceDiffMax = dv.getFloat32(offset, true); offset += 4;
  const horseNum = dv.getInt32(offset, true); offset += 4;
  const horseFrameSize = dv.getInt32(offset, true); offset += 4;
  const horseResultSize = dv.getInt32(offset, true); offset += 4;

  const paddingSize1 = dv.getInt32(offset, true); offset += 4;
  offset += paddingSize1;

  const frameCount = dv.getInt32(offset, true); offset += 4;
  const frameSize = dv.getInt32(offset, true); offset += 4;

  const frames: FrameData[] = [];
  for (let f = 0; f < frameCount; f++) {
    const time = dv.getFloat32(offset, true);
    let horseOffset = offset + 4;
    const horseFrames: HorseFrameData[] = [];
    for (let h = 0; h < horseNum; h++) {
      horseFrames.push({
        distance: dv.getFloat32(horseOffset, true),
        lanePosition: dv.getUint16(horseOffset + 4, true),
        speed: dv.getUint16(horseOffset + 6, true),
        hp: dv.getUint16(horseOffset + 8, true),
        temptationMode: dv.getInt8(horseOffset + 10),
        blockFrontHorseIndex: dv.getInt8(horseOffset + 11),
      });
      horseOffset += horseFrameSize;
    }
    frames.push({ time, horseFrames });
    offset += frameSize;
  }
  enforceMonotonicDistance(frames, horseNum);

  const paddingSize2 = dv.getInt32(offset, true); offset += 4;
  offset += paddingSize2;

  const horseResults: HorseResultData[] = [];
  for (let h = 0; h < horseNum; h++) {
    horseResults.push({
      finishOrder: dv.getInt32(offset, true),
      finishTime: dv.getFloat32(offset + 4, true),
      finishDiffTime: dv.getFloat32(offset + 8, true),
      startDelayTime: dv.getFloat32(offset + 12, true),
      gutsOrder: dv.getUint8(offset + 16),
      wizOrder: dv.getUint8(offset + 17),
      lastSpurtStartDistance: dv.getFloat32(offset + 18, true),
      runningStyle: dv.getUint8(offset + 22),
      defeat: dv.getInt32(offset + 23, true),
      finishTimeRaw: dv.getFloat32(offset + 27, true),
    });
    offset += horseResultSize;
  }

  const paddingSize3 = dv.getInt32(offset, true); offset += 4;
  offset += paddingSize3;

  const eventCount = dv.getInt32(offset, true); offset += 4;
  const events: EventData[] = [];
  for (let e = 0; e < eventCount; e++) {
    dv.getInt16(offset, true); offset += 2;
    const frameTime = dv.getFloat32(offset, true); offset += 4;
    const type = dv.getInt8(offset); offset += 1;
    const paramCount = dv.getInt8(offset); offset += 1;
    const param: number[] = [];
    for (let p = 0; p < paramCount; p++) {
      param.push(dv.getInt32(offset, true));
      offset += 4;
    }
    events.push({ frameTime, type, param });
  }

  return {
    header: { maxLength, version },
    distanceDiffMax,
    horseNum,
    horseFrameSize,
    horseResultSize,
    frameCount,
    frameSize,
    frames,
    horseResults,
    events,
  };
}

function enforceMonotonicDistance(frames: FrameData[], horseNum: number): void {
  for (let h = 0; h < horseNum; h++) {
    let maxDist = -Infinity;
    for (const f of frames) {
      const hf = f.horseFrames[h];
      if (!hf) continue;
      if (hf.distance < maxDist) {
        hf.distance = maxDist;
      } else {
        maxDist = hf.distance;
      }
    }
  }
}

export async function decodeRaceSimData(base64Gzip: string): Promise<RaceSimulateData> {
  const binaryStr = atob(base64Gzip);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const buf = await new Response(stream).arrayBuffer();
  return parseRaceSimData(buf);
}

const _EVENT_TYPE_MAP: Record<string, number> = {
  SKILL: 3,
  COMPETE_TOP: 1,
  COMPETE_FIGHT: 2,
};

const _STYLE_MAP: Record<string, number> = {
  NIGE: 0,
  SENKO: 1,
  SASHI: 2,
  OIKOMI: 3,
};

function parseTemptation(v: any): number {
  if (typeof v === 'number') return v;
  if (v === 'NULL' || v == null) return 0;
  return 0;
}

export function parseRaceSimDataFromJson(json: any): RaceSimulateData {
  const d = json;

  const header = {
    maxLength: d.header?.maxLength ?? 0,
    version: d.header?.version ?? 0,
  };

  const frames: FrameData[] = (d.frame || d.frames || []).map((f: any) => ({
    time: f.time ?? 0,
    horseFrames: (f.horseFrame || f.horseFrames || []).map((hf: any) => ({
      distance: hf.distance ?? 0,
      lanePosition: hf.lanePosition ?? 0,
      speed: hf.speed ?? 0,
      hp: hf.hp ?? 0,
      temptationMode: parseTemptation(hf.temptationMode),
      blockFrontHorseIndex: hf.blockFrontHorseIndex ?? -1,
    })),
  }));

  const horseResults: HorseResultData[] = (d.horseResult || d.horseResults || []).map((hr: any) => ({
    finishOrder: hr.finishOrder ?? 0,
    finishTime: hr.finishTime ?? 0,
    finishDiffTime: hr.finishDiffTime ?? 0,
    startDelayTime: hr.startDelayTime ?? 0,
    gutsOrder: hr.gutsOrder ?? 0,
    wizOrder: hr.wizOrder ?? 0,
    lastSpurtStartDistance: hr.lastSpurtStartDistance ?? 0,
    runningStyle: typeof hr.runningStyle === 'string' ? (_STYLE_MAP[hr.runningStyle] ?? 0) : (hr.runningStyle ?? 0),
    defeat: hr.defeat ?? 0,
    finishTimeRaw: hr.finishTimeRaw ?? 0,
  }));

  const rawEvents = d.event || d.events || [];
  const events: EventData[] = rawEvents.map((ew: any) => {
    const e = ew.event || ew;
    return {
      frameTime: e.frameTime ?? 0,
      type: typeof e.type === 'string' ? (_EVENT_TYPE_MAP[e.type] ?? 0) : (e.type ?? 0),
      param: e.param ?? [],
    };
  });

  const horseNum = d.horseNum ?? (d.frame?.[0]?.horseFrame?.length ?? d.frames?.[0]?.horseFrames?.length ?? frames.length);
  enforceMonotonicDistance(frames, horseNum);

  return {
    header,
    distanceDiffMax: d.distanceDiffMax ?? 0,
    horseNum,
    horseFrameSize: d.horseFrameSize ?? 12,
    horseResultSize: d.horseResultSize ?? 31,
    frameCount: frames.length,
    frameSize: d.frameSize ?? 0,
    frames,
    horseResults,
    events,
  };
}
