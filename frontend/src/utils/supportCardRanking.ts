/**
 * Advanced Support Card Deck Evaluation System
 *
 * Scores a full 6-card deck against a specific Uma, considering:
 * - Diminishing returns for overcapping stats (Soft Cap: 1200)
 * - Deck composition requirements (penalizes 0 Wit or 0 Pal/Group decks)
 * - Bypasses standard training math for Pal/Group cards, scoring on utility
 * - Early game consistency via Initial Friendship Gauge
 * - Race Bonus coverage (target: 35 for URA/Unity, 50 for Trackblazer)
 */

import type { SupportCard } from './supportCardData';
import { SUPPORT_CARD_LIST } from './supportCardData';
import { getUmaData } from './umaData';
import type { SupportCardType } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DeckBreakdown {
    raceBonus: number;
    raceBonusScore: number;
    statBonusScore: number;
    trainingEffectivenessScore: number;
    specialtyPriorityScore: number;
    utilityScore: number;          // Replaces pure Friendship/Mood/Hint logic
    compositionPenalty: number;    // Deductions for bad deck building
    secondaryStatScore: number;
}

export interface DeckEvaluation {
    umaName: string;
    score: number;
    tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    cardScores: { card: SupportCard; score: number; tier: string }[];
    breakdown: DeckBreakdown;
    raceBonusMet: boolean;
    totalRaceBonus: number;
    umaPrimaryStat: string | null;
    umaSecondaryStat: string | null;
}

export interface PlayerDeckRanking {
    playerId: string;
    playerName: string;
    umaName: string;
    deck: string[]; 
    evaluation: DeckEvaluation | null;
}

// ─── Config ─────────────────────────────────────────────────────────────────

export const TB_RACE_BONUS_TARGET = 50;
export const URA_RACE_BONUS_TARGET = 35;
const STAT_SOFT_CAP = 1200;

// ─── Math Helpers ───────────────────────────────────────────────────────────

function lb(val: number[] | null | undefined, level: number): number {
    if (!val || val.length === 0) return 0;
    const idx = Math.min(level, val.length - 1);
    return val[idx] ?? 0;
}

function getCardStatBonus(card: SupportCard, statType: string, limitBreak: number): number {
    switch (statType) {
        case 'speed': return lb(card.speedBonus, limitBreak);
        case 'stamina': return lb(card.staminaBonus, limitBreak);
        case 'power': return lb(card.powerBonus, limitBreak);
        case 'guts': return lb(card.gutsBonus, limitBreak);
        case 'wit': return lb(card.witBonus, limitBreak);
        default: return 0;
    }
}

/** * Applies a mathematical penalty to stats generated beyond the game's cap 
 */
function applyDiminishingReturns(statValue: number): number {
    if (statValue <= STAT_SOFT_CAP) return statValue;
    const excess = statValue - STAT_SOFT_CAP;
    return STAT_SOFT_CAP + (excess * 0.4); // 60% penalty on stats over cap
}

// ─── Uma Stat Bonus Parsing ─────────────────────────────────────────────────

/** Parse uma's statBonus string (e.g. 'STA +14% / GUT +8%') into structured data */
export function parseUmaStatBonus(umaName: string): { stat: string; pct: number }[] {
    const uma = getUmaData(umaName);
    if (!uma?.statBonus) return [];

    // Format: 'STA +14% / GUT +8%' or 'SPD +10%'
    const parts = uma.statBonus.split('/').map(p => p.trim());
    const result: { stat: string; pct: number }[] = [];

    const statMap: Record<string, string> = {
        'SPD': 'speed', 'STA': 'stamina', 'POW': 'power',
        'GUT': 'guts', 'WIS': 'wit',
    };

    for (const part of parts) {
        const match = part.match(/(\w+)\s*\+(\d+)%/);
        if (match && match[1]) {
            const statKey = statMap[match[1]] || match[1].toLowerCase();
            const pct = parseInt(match[2] || '0', 10);
            result.push({ stat: statKey, pct });
        }
    }

    return result;
}

/** Get uma's primary bonus stat type */
export function getUmaPrimaryStat(umaName: string): string | null {
    const bonuses = parseUmaStatBonus(umaName);
    return bonuses.length > 0 ? bonuses[0]!.stat : null;
}

/** Get uma's secondary bonus stat type */
export function getUmaSecondaryStat(umaName: string): string | null {
    const bonuses = parseUmaStatBonus(umaName);
    return bonuses.length > 1 ? bonuses[1]!.stat : null;
}

// ─── Core Evaluation ────────────────────────────────────────────────────────

/**
 * Evaluate a full 6-card deck against an Uma.
 * @param umaName - The Uma to evaluate against
 * @param cards - Array of { cardId, limitBreak } pairs
 */
export function evaluateDeck(umaName: string, cards: { cardId: string; limitBreak: number }[]): DeckEvaluation | null {
    if (!umaName || cards.length === 0) return null;

    const resolved = cards.map(c => ({
        card: SUPPORT_CARD_LIST.find(x => x.id === c.cardId),
        limitBreak: c.limitBreak,
    })).filter(c => c.card !== undefined);

    if (resolved.length === 0) return null;

    // 1. Parse Uma Bonuses
    const umaBonuses = parseUmaStatBonus(umaName);
    const primaryStat = umaBonuses.length > 0 ? umaBonuses[0]!.stat : null;
    const secondaryStat = umaBonuses.length > 1 ? umaBonuses[1]!.stat : null;
    const primaryPct = umaBonuses.length > 0 ? umaBonuses[0]!.pct : 0;
    const secondaryPct = umaBonuses.length > 1 ? umaBonuses[1]!.pct : 0;

    // 2. Deck Composition Analysis
    const typeCount: Record<SupportCardType, number> = {
        speed: 0, stamina: 0, power: 0, guts: 0, wit: 0, group: 0, pal: 0
    };
    
    resolved.forEach(({ card }) => {
        const t = card!.type as SupportCardType;
        if (t) typeCount[t]++;
    });

    let compositionPenalty = 0;
    // Penalize missing crucial archetypes
    if (typeCount.wit === 0) compositionPenalty += 800; // Stamina recovery / skill activation
    if (typeCount.pal === 0 && typeCount.group === 0) compositionPenalty += 500; // Scenario mechanics
    // Penalize heavily skewed stat hoarding
    if (typeCount.speed > 3 || typeCount.guts > 3 || typeCount.wit > 3) compositionPenalty += 400;

    // 3. Accumulate Stats
    let rawPrimaryStatTotal = 0;
    let rawSecondaryStatTotal = 0;
    let secondaryStatScore = 0;
    let utilityScore = 0;
    
    let totalRaceBonus = 0;
    let totalTrainingEff = 0;
    let totalSpecialtyPri = 0;

    resolved.forEach(({ card, limitBreak }) => {
        totalRaceBonus += lb(card!.raceBonus, limitBreak);

        // Pal and Group cards are scored purely on utility/events
        if (card!.type === 'pal' || card!.type === 'group') {
            utilityScore += 600; // Base value for scenario event recoveries
            utilityScore += lb(card!.initialFriendshipGauge, limitBreak) * 6; // Getting them active early is paramount
            utilityScore += lb(card!.moodEffect, limitBreak) * 3;
            // Add a bonus if they have a powerful unique effect
            if (card!.uniqueEffectStat) utilityScore += 200; 
            return;
        }

        // Standard Support Card Math
        totalTrainingEff += lb(card!.trainingEffectiveness, limitBreak);
        totalSpecialtyPri += lb(card!.specialtyPriority, limitBreak);
        
        // Friendship and Early Bond
        utilityScore += lb(card!.initialFriendshipGauge, limitBreak) * 6; 
        utilityScore += lb(card!.friendshipBonus, limitBreak) * 3;
        utilityScore += (lb(card!.hintLevels, limitBreak) * 15) + (lb(card!.hintFrequency, limitBreak) * 1);

        // Primary / Secondary Target Alignment
        if (primaryStat) {
            rawPrimaryStatTotal += getCardStatBonus(card!, primaryStat, limitBreak) * 100 * (1 + primaryPct / 100);
        }
        if (secondaryStat) {
            rawSecondaryStatTotal += getCardStatBonus(card!, secondaryStat, limitBreak) * 70 * (1 + secondaryPct / 100);
        }

        // Off-Stats
        ['speed', 'stamina', 'power', 'guts', 'wit'].forEach(statType => {
            if (statType !== primaryStat && statType !== secondaryStat) {
                secondaryStatScore += getCardStatBonus(card!, statType, limitBreak) * 30;
            }
        });
        
        // Unique Effect Modifiers
        if (card!.uniqueEffectStat) utilityScore += 100;
    });

    // 4. Apply Diminishing Returns
    const statBonusScore = applyDiminishingReturns(rawPrimaryStatTotal) + applyDiminishingReturns(rawSecondaryStatTotal);

    // 5. Race Bonus Target Scoring
    const raceBonusMet = totalRaceBonus >= TB_RACE_BONUS_TARGET;
    let raceBonusScore = 0;
    if (raceBonusMet) {
        raceBonusScore = 500 + (totalRaceBonus - TB_RACE_BONUS_TARGET) * 10;
    } else {
        const coverage = totalRaceBonus / TB_RACE_BONUS_TARGET;
        raceBonusScore = coverage * 400; // Cliff penalty for failing threshold
    }

    // 6. Multiplier Scoring
    const trainingEffectivenessScore = totalTrainingEff * 15;
    const specialtyPriorityScore = totalSpecialtyPri * 4;

    // 7. Total Weighted Score
    let totalScore = Math.round(
        statBonusScore +
        raceBonusScore * 1.2 +
        trainingEffectivenessScore +
        specialtyPriorityScore +
        utilityScore +
        secondaryStatScore * 0.5 -
        compositionPenalty
    );
    totalScore = Math.max(0, totalScore);

    // 8. Per-card Evaluation
    const cardScores = resolved.map(({ card, limitBreak }) => {
        let cardScore = 0;
        
        if (card!.type === 'pal' || card!.type === 'group') {
            cardScore = 800; // Base baseline for utility
            cardScore += lb(card!.initialFriendshipGauge, limitBreak) * 6;
            if (card!.uniqueEffectStat) cardScore += 200;
        } else {
            if (primaryStat) cardScore += getCardStatBonus(card!, primaryStat, limitBreak) * 100 * (1 + primaryPct / 100);
            if (secondaryStat) cardScore += getCardStatBonus(card!, secondaryStat, limitBreak) * 70 * (1 + secondaryPct / 100);
            
            cardScore += lb(card!.trainingEffectiveness, limitBreak) * 15;
            cardScore += lb(card!.specialtyPriority, limitBreak) * 4;
            cardScore += lb(card!.friendshipBonus, limitBreak) * 3;
            cardScore += lb(card!.initialFriendshipGauge, limitBreak) * 6;
            cardScore += (lb(card!.hintLevels, limitBreak) * 15);
        }

        cardScore += lb(card!.raceBonus, limitBreak) * 15;
        return { card: card!, score: Math.round(cardScore), tier: '' };
    });
    
    cardScores.sort((a, b) => b.score - a.score);

    // Assign internal Tiers
    if (cardScores.length > 0) {
        const maxCardScore = cardScores[0]!.score || 1;
        cardScores.forEach(cs => {
            const ratio = cs.score / maxCardScore;
            if (ratio >= 0.9) cs.tier = 'S';
            else if (ratio >= 0.75) cs.tier = 'A';
            else if (ratio >= 0.60) cs.tier = 'B';
            else if (ratio >= 0.45) cs.tier = 'C';
            else if (ratio >= 0.30) cs.tier = 'D';
            else cs.tier = 'E';
        });
    }

    return {
        umaName,
        score: totalScore,
        tier: assignTier(totalScore),
        cardScores,
        breakdown: {
            raceBonus: totalRaceBonus,
            raceBonusScore: Math.round(raceBonusScore * 1.2),
            statBonusScore: Math.round(statBonusScore),
            trainingEffectivenessScore: Math.round(trainingEffectivenessScore),
            specialtyPriorityScore: Math.round(specialtyPriorityScore),
            utilityScore: Math.round(utilityScore),
            compositionPenalty: Math.round(compositionPenalty),
            secondaryStatScore: Math.round(secondaryStatScore * 0.5),
        },
        raceBonusMet,
        totalRaceBonus,
        umaPrimaryStat: primaryStat,
        umaSecondaryStat: secondaryStat,
    };
}

function assignTier(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
    if (score >= 3800) return 'S';
    if (score >= 3100) return 'A';
    if (score >= 2400) return 'B';
    if (score >= 1700) return 'C';
    if (score >= 1100) return 'D';
    if (score >= 600) return 'E';
    return 'F';
}

// ─── Player Ranking ─────────────────────────────────────────────────────────

/**
 * Rank players by their deck quality.
 * Requires: playerId -> umaName mapping + cards with limitBreak
 */
export function rankPlayers(
    players: { id: string; name: string; uma: string; deck: { cardId: string; limitBreak: number }[] }[]
): PlayerDeckRanking[] {
    return players
        .map(player => ({
            playerId: player.id,
            playerName: player.name,
            umaName: player.uma,
            deck: player.deck.map(c => c.cardId),
            evaluation: evaluateDeck(player.uma, player.deck),
        }))
        .filter(r => r.evaluation !== null)
        .sort((a, b) => (b.evaluation?.score ?? 0) - (a.evaluation?.score ?? 0));
}

// ─── Tier Styling Helpers ───────────────────────────────────────────────────

export function getTierColor(tier: string): string {
    switch (tier) {
        case 'S': return 'text-yellow-400';
        case 'A': return 'text-orange-400';
        case 'B': return 'text-sky-400';
        case 'C': return 'text-emerald-400';
        case 'D': return 'text-gray-400';
        case 'E': return 'text-gray-500';
        case 'F': return 'text-gray-600';
        default: return 'text-gray-400';
    }
}

export function getTierBg(tier: string): string {
    switch (tier) {
        case 'S': return 'bg-yellow-500/15 border-yellow-500/30';
        case 'A': return 'bg-orange-500/15 border-orange-500/30';
        case 'B': return 'bg-sky-500/15 border-sky-500/30';
        case 'C': return 'bg-emerald-500/15 border-emerald-500/30';
        case 'D': return 'bg-gray-500/15 border-gray-500/30';
        case 'E': return 'bg-gray-600/10 border-gray-600/20';
        case 'F': return 'bg-gray-700/10 border-gray-700/20';
        default: return 'bg-gray-500/15 border-gray-500/30';
    }
}
