const BACKING_FIELD_RE = /^<(.+)>k__BackingField$/;

function stripBackingFieldKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(stripBackingFieldKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const match = key.match(BACKING_FIELD_RE);
      const cleanKey = match?.[1] ?? key;
      cleaned[cleanKey] = stripBackingFieldKeys(value);
    }
    return cleaned;
  }
  return obj;
}

export function normalizeReplayData(raw: any): any {
  return stripBackingFieldKeys(raw);
}

export function extractSimDataBase64(raw: any): string | null {
  const key = Object.keys(raw).find(k => {
    const clean = k.replace(BACKING_FIELD_RE, '$1');
    return clean === 'SimDataBase64';
  });
  return key ? raw[key] : null;
}
