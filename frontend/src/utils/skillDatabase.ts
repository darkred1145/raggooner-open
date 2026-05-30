export type SkillEffect = {
  type: number;
  value: number;
  target?: number;
  target_details?: number;
};

export type SkillConditionGroup = {
  base_time: number;
  condition: string;
  effects: SkillEffect[];
  precondition?: string;
};

export type SkillEntry = {
  id: number;
  enname?: string;
  jpname?: string;
  name_en?: string;
  endesc?: string;
  jpdesc?: string;
  desc_en?: string;
  iconid?: number;
  rarity?: number;
  activation?: number;
  char?: number[];
  type?: string[];
  condition_groups?: SkillConditionGroup[];
  gene_version?: {
    id: number;
    parent_skills?: number[];
    cost?: number;
    rarity?: number;
    condition_groups?: SkillConditionGroup[];
  };
  cost?: number;
  tid?: string;
  loc?: Record<string, { char?: number[] }>;
  evo_cond?: any[];
  pre_evo?: { card_id: number; old: number };
  sup_e?: number[][];
  sup_hint?: number[][];
  versions?: number[];
  inherited?: boolean;
};

let db: Record<string, SkillEntry> | null = null;

export async function loadSkillDatabase(): Promise<Record<string, SkillEntry>> {
  if (db) return db;
  const resp = await fetch('/data/skills.528f3ead.json');
  db = await resp.json() as Record<string, SkillEntry>;
  return db;
}

export function findSkillById(id: number, data: Record<string, SkillEntry>): SkillEntry | undefined {
  return data[String(id)] ?? Object.values(data).find(s => s.id === id);
}

export function getSkillNameEn(id: number, data: Record<string, SkillEntry>): string {
  const s = findSkillById(id, data);
  return s?.enname || s?.name_en || '';
}

export function getSkillDesc(id: number, data: Record<string, SkillEntry>): string {
  const s = findSkillById(id, data);
  return s?.endesc || s?.desc_en || '';
}

export type SkillEffectCategory = 'speed' | 'stamina' | 'accel' | 'buff' | 'debuff' | 'unique' | 'other';

export function categorizeSkillById(id: number, data: Record<string, SkillEntry>): SkillEffectCategory {
  const s = findSkillById(id, data);
  if (!s) return 'other';
  if (s.rarity && s.rarity >= 5) return 'unique';
  const desc = (s.endesc || s.desc_en || '').toLowerCase();
  if (desc.includes('decrease')) return 'debuff';
  if (desc.includes('recover endurance') || desc.includes('recover stamina')) return 'stamina';
  if (desc.includes('acceleration')) return 'accel';
  if (desc.includes('increase velocity') || desc.includes('speed')) return 'speed';
  if (desc.includes('increase') || desc.includes('boost') || desc.includes('improve')) return 'buff';
  return 'other';
}

export function getSkillBaseTime(id: number, data: Record<string, SkillEntry>): number {
  const s = findSkillById(id, data);
  return s?.condition_groups?.[0]?.base_time ?? 0;
}

export function getSkillEffects(id: number, data: Record<string, SkillEntry>): SkillEffect[] {
  const s = findSkillById(id, data);
  if (!s?.condition_groups) return [];
  return s.condition_groups.flatMap(cg => cg.effects || []);
}

export function buildSkillIndex(data: Record<string, SkillEntry>): Map<number, SkillEntry> {
  const map = new Map<number, SkillEntry>();
  for (const key of Object.keys(data)) {
    const entry = data[key]!;
    map.set(entry.id, entry);
  }
  return map;
}
