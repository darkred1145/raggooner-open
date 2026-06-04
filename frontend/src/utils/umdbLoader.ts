function readVarint(bytes: Uint8Array, offset: number): [number, number] {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (pos < bytes.length) {
    const b = bytes[pos++]!;
    result |= (b & 0x7f) << shift;
    shift += 7;
    if (!(b & 0x80)) return [result, pos];
  }
  throw new Error('Truncated varint');
}

function readTag(bytes: Uint8Array, offset: number): [fieldNum: number, wireType: number, nextOffset: number] {
  const [val, next] = readVarint(bytes, offset);
  return [val >>> 3, val & 0x07, next];
}

function skipField(bytes: Uint8Array, offset: number, wireType: number): number {
  switch (wireType) {
    case 0: { // varint
      const [, next] = readVarint(bytes, offset);
      return next;
    }
    case 1: return offset + 8; // 64-bit
    case 2: { // length-delimited
      const [len, next] = readVarint(bytes, offset);
      return next + len;
    }
    case 5: return offset + 4; // 32-bit
    default: throw new Error(`Unknown wire type ${wireType} at ${offset}`);
  }
}

export type CharNameEntry = { id: number; name: string };

function decodeChara(bytes: Uint8Array, offset: number, end: number): { entry: CharNameEntry; nextOffset: number } {
  let id = 0;
  let name = '';
  let pos = offset;
  while (pos < end) {
    const [fieldNum, wireType, next] = readTag(bytes, pos);
    pos = next;
    if (fieldNum === 1 && wireType === 0) {
      const [val, n] = readVarint(bytes, pos);
      id = val;
      pos = n;
    } else if (fieldNum === 2 && wireType === 2) {
      const [len, n] = readVarint(bytes, pos);
      pos = n;
      name = new TextDecoder().decode(bytes.slice(pos, pos + len));
      pos += len;
    } else {
      pos = skipField(bytes, pos, wireType);
    }
  }
  return { entry: { id, name }, nextOffset: pos };
}

type TextDataEntry = { index: number; text: string };

function decodeTextDataEntry(bytes: Uint8Array, offset: number, end: number): { entry: TextDataEntry; category: number; nextOffset: number } {
  let category = 0, index = 0, text = '';
  let pos = offset;
  while (pos < end) {
    const [fieldNum, wireType, next] = readTag(bytes, pos);
    pos = next;
    if (fieldNum === 2 && wireType === 0) {
      const [val, n] = readVarint(bytes, pos);
      category = val;
      pos = n;
    } else if (fieldNum === 3 && wireType === 0) {
      const [val, n] = readVarint(bytes, pos);
      index = val;
      pos = n;
    } else if (fieldNum === 4 && wireType === 2) {
      const [len, n] = readVarint(bytes, pos);
      pos = n;
      text = new TextDecoder().decode(bytes.slice(pos, pos + len));
      pos += len;
    } else {
      pos = skipField(bytes, pos, wireType);
    }
  }
  return { entry: { index, text }, category, nextOffset: pos };
}

function decodeUmdb(bytes: Uint8Array): { charas: CharNameEntry[]; factorNames: Map<number, string> } {
  const charas: CharNameEntry[] = [];
  const factorNames = new Map<number, string>();
  let pos = 0;
  while (pos < bytes.length) {
    const [fieldNum, wireType, next] = readTag(bytes, pos);
    if (fieldNum === 0 && wireType === 0) break;
    pos = next;
    if (fieldNum === 2 && wireType === 2) {
      const [len, n] = readVarint(bytes, pos);
      pos = n;
      const msgEnd = pos + len;
      const { entry } = decodeChara(bytes, pos, msgEnd);
      charas.push(entry);
      pos = msgEnd;
    } else if (fieldNum === 12 && wireType === 2) {
      const [len, n] = readVarint(bytes, pos);
      pos = n;
      const msgEnd = pos + len;
      const { entry, category } = decodeTextDataEntry(bytes, pos, msgEnd);
      if (category === 147 && entry.text) {
        factorNames.set(entry.index, entry.text);
      }
      pos = msgEnd;
    } else {
      pos = skipField(bytes, pos, wireType);
    }
  }
  return { charas, factorNames };
}

let charaNameMap: Map<number, string> | null = null;
let factorNameMap: Map<number, string> | null = null;

export async function loadUmdbCharacterNames(): Promise<Map<number, string>> {
  if (charaNameMap) return charaNameMap;
  await loadUmdbData();
  return charaNameMap!;
}

export async function loadFactorNames(): Promise<Map<number, string>> {
  if (factorNameMap) return factorNameMap;
  await loadUmdbData();
  return factorNameMap!;
}

let loadingPromise: Promise<void> | null = null;

async function loadUmdbData(): Promise<void> {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const response = await fetch('/data/umdb.binarypb.gz', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Failed to fetch umdb.binarypb.gz (${response.status})`);
    const compressed = await response.arrayBuffer();
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    const buf = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(buf);

    const { charas, factorNames } = decodeUmdb(bytes);
    charaNameMap = new Map();
    for (const e of charas) {
      charaNameMap.set(e.id, e.name);
    }
    factorNameMap = factorNames;
  })();
  return loadingPromise;
}
