import type { SupportCardType } from '../types';
import supportCardData from '../data/support-cards.json';

type RawSupportCard = {
    support_id: number;
    url_name: string;
    char_name: string;
    type: string;
    rarity: number;
    title_en: string | null;
    effects: number[][];
};

type SupportCardTranslationEntry = {
    gametora: string;
    title_en: string | null;
};

const supportCardTitleMap = new Map<string, SupportCardTranslationEntry>();

export interface SupportCard {
    id: string;
    name: string;
    type: SupportCardType;
    rarity: 'SSR' | 'SR' | 'R';
    cardName: string;
    speedBonus?: number[];
    staminaBonus?: number[];
    powerBonus?: number[];
    gutsBonus?: number[];
    witBonus?: number[];
    trainingEffectiveness?: number[];
    friendshipBonus?: number[];
    specialtyPriority?: number[];
    initialFriendshipGauge?: number[];
    raceBonus?: number[];
    fanBonus?: number[];
    moodEffect?: number[];
    hintLevels?: number[];
    hintFrequency?: number[];
    uniqueEffectStat?: string;
    uniqueEffectValue?: number | null;
}

const TYPE_MAP: Record<string, SupportCardType> = {
    speed: 'speed',
    stamina: 'stamina',
    power: 'power',
    guts: 'guts',
    intelligence: 'wit',
    group: 'group',
    friend: 'pal',
};

const RARITY_MAP: Record<number, 'SSR' | 'SR' | 'R'> = {
    1: 'R',
    2: 'SR',
    3: 'SSR',
};

const EFFECT_MAP: Record<number, keyof SupportCard> = {
    1: 'speedBonus',
    2: 'staminaBonus',
    3: 'powerBonus',
    4: 'gutsBonus',
    5: 'witBonus',
    8: 'trainingEffectiveness',
    11: 'friendshipBonus',
    12: 'initialFriendshipGauge',
    13: 'specialtyPriority',
    15: 'raceBonus',
    16: 'fanBonus',
    17: 'moodEffect',
    18: 'hintLevels',
    19: 'hintFrequency',
};

const MILESTONE_INDICES = [1, 3, 5, 7, 11];

function to5LevelArray(values: number[]): number[] {
    const result: number[] = [];
    for (const m of MILESTONE_INDICES) {
        let v = -1;
        for (let i = m; i >= 1; i--) {
            const val = values[i];
            if (val !== undefined && val >= 0) { v = val; break; }
        }
        result.push(v >= 0 ? v : 0);
    }
    return result;
}
const SUPPORT_CARD_DICT: Record<string, SupportCard> = {};

const SUPPORT_CARD_BY_NUM_ID: Map<number, string> = new Map();

for (const card of supportCardData as RawSupportCard[]) {
    const cardId = card.url_name;
    SUPPORT_CARD_BY_NUM_ID.set(card.support_id, cardId);
    const effects: Record<string, number[]> = {};
    for (const eff of card.effects || []) {
        const effType = eff[0];
        if (effType === undefined) continue;
        const field = EFFECT_MAP[effType];
        if (field) {
            effects[field] = to5LevelArray(eff);
        }
    }

    SUPPORT_CARD_DICT[cardId] = {
        id: cardId,
        name: card.char_name,
        type: TYPE_MAP[card.type] || 'speed',
        rarity: RARITY_MAP[card.rarity] || 'R',
        cardName: card.title_en || '',
        ...effects,
    };
    supportCardTitleMap.set(cardId, { gametora: cardId, title_en: card.title_en });
}

export function getSupportCardNameByNumericId(numId: number): string {
    const urlName = SUPPORT_CARD_BY_NUM_ID.get(numId);
    if (!urlName) return `#${numId}`;
    return getSupportCardDisplayName(urlName);
}

export const SUPPORT_CARD_LIST = Object.values(SUPPORT_CARD_DICT);

export function isKnownCardId(cardId: string): boolean {
    return cardId in SUPPORT_CARD_DICT;
}

export function getSupportCardImageId(cardId: string): string {
    const first = cardId.split('-')[0];
    if (first && /^\d+$/.test(first)) return first;
    return '';
}

export function resolveCardData(cardId: string): SupportCard | null {
    return SUPPORT_CARD_DICT[cardId] ?? null;
}

export function getSupportCardDisplayName(cardId: string): string {
    const card = resolveCardData(cardId);
    if (card) return card.name;
    return cardId;
}

export function getSupportCardDisplayTitle(cardId: string): string {
    const card = resolveCardData(cardId);
    if (card?.cardName) return card.cardName;
    const entry = supportCardTitleMap.get(cardId);
    return entry?.title_en ?? '';
}

export function matchesSupportCardSearch(cardId: string, query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    const name = getSupportCardDisplayName(cardId).toLowerCase();
    if (name.includes(q)) return true;
    const title = getSupportCardDisplayTitle(cardId).toLowerCase();
    if (title.includes(q)) return true;
    const card = resolveCardData(cardId);
    if (card) {
        if (card.type.toLowerCase().includes(q) || card.rarity.toLowerCase().includes(q)) return true;
    }
    return false;
}

export const SUPPORT_CARD_TYPE_META: Record<SupportCardType, { label: string; color: string; bg: string }> = {
    speed:   { label: 'Speed',   color: 'text-sky-400',     bg: 'bg-sky-500/15'     },
    stamina: { label: 'Stamina', color: 'text-rose-400',    bg: 'bg-rose-500/15'    },
    power:   { label: 'Power',   color: 'text-orange-400',  bg: 'bg-orange-500/15'  },
    guts:    { label: 'Guts',    color: 'text-yellow-400',  bg: 'bg-yellow-500/15'  },
    wit:     { label: 'Wit',     color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    group:   { label: 'Group',   color: 'text-violet-400',  bg: 'bg-violet-500/15'  },
    pal:     { label: 'Pal',     color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15' },
};
