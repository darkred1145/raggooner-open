type SkillEffect = {
  type: number;
  value: number;
  target?: number;
  target_details?: number;
};

type SkillConditionGroup = {
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

export type SkillEffectCategory = 'speed' | 'stamina' | 'accel' | 'buff' | 'debuff' | 'unique' | 'other';

export function buildSkillIndex(data: Record<string, SkillEntry>): Map<number, SkillEntry> {
  const map = new Map<number, SkillEntry>();
  for (const key of Object.keys(data)) {
    const entry = data[key]!;
    map.set(entry.id, entry);
    const gv = entry.gene_version;
    if (gv && gv.id) {
      map.set(gv.id, {
        ...gv,
        enname: (gv as any).enname || entry.enname,
        name_en: (gv as any).name_en || entry.name_en,
        endesc: (gv as any).endesc || (gv as any).desc_en || entry.endesc,
        desc_en: (gv as any).desc_en || entry.desc_en,
      } as SkillEntry);
    }
  }
  return map;
}
