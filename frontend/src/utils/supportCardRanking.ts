/**
 * Support Card Deck Evaluation System
 *
 * Scores a full 6-card deck against a specific Uma, considering:
 * - Race Bonus coverage (target: 35 for URA/Unity, 50 for Trackblazer)
 * - Stat bonuses aligned with Uma's bonus stats
 * - Training Effectiveness across the deck
 * - Specialty Priority (more specialty = more training opportunities)
 * - Friendship / Mood / Hint support stats
 *
 * Usage:
 *   const result = evaluateDeck(umaName, ['cardId1', 'cardId2', ...]);
 *   // result.score, result.tier, result.breakdown
 */

import type { SupportCard } from './supportCardData';
import { SUPPORT_CARD_LIST } from './supportCardData';
import { getUmaData } from './umaData';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DeckBreakdown {
    raceBonus: number;
    raceBonusScore: number;
    statBonusScore: number;
    trainingEffectivenessScore: number;
    specialtyPriorityScore: number;
    friendshipScore: number;
    moodEffectScore: number;
    hintScore: number;
    secondaryStatScore: number;
}

export interface DeckEvaluation {
    umaName: string;
    /** Total score (higher = better deck) */
    score: number;
    /** Tier rank */
    tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    /** Per-card scores */
    cardScores: { card: SupportCard; score: number; tier: string }[];
    /** Detailed breakdown */
    breakdown: DeckBreakdown;
    /** Whether race bonus target is met */
    raceBonusMet: boolean;
    /** Total race bonus from all 6 cards */
    totalRaceBonus: number;
    /** Uma's primary stat bonus (from umaData) */
    umaPrimaryStat: string | null;
    /** Uma's secondary stat bonus */
    umaSecondaryStat: string | null;
}

export interface PlayerDeckRanking {
    playerId: string;
    playerName: string;
    umaName: string;
    deck: string[]; // card IDs
    evaluation: DeckEvaluation | null;
}

// ─── Config ─────────────────────────────────────────────────────────────────

/** Target race bonus for Trackblazer scenario */
export const TB_RACE_BONUS_TARGET = 50;
/** Target race bonus for URA/Unity scenario */
export const URA_RACE_BONUS_TARGET = 35;

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
            const pct = parseInt(match[2] || '0');
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

/** Get last value from a stat progression array, default 0 */
function lv(val: number[] | null | undefined): number {
    if (!val) return 0;
    if (val.length === 0) return 0;
    const last = val[val.length - 1];
    return last ?? 0;
}

/** Get max-level stat bonus value from a card for a given stat type */
function getCardStatBonus(card: SupportCard, statType: string): number {
    switch (statType) {
        case 'speed': return lv(card.speedBonus);
        case 'stamina': return lv(card.staminaBonus);
        case 'power': return lv(card.powerBonus);
        case 'guts': return lv(card.gutsBonus);
        case 'wit': return lv(card.witBonus);
        default: return 0;
    }
}

/**
 * Evaluate a full 6-card deck against an Uma.
 */
export function evaluateDeck(umaName: string, cardIds: string[]): DeckEvaluation | null {
    if (!umaName || cardIds.length === 0) return null;

    // Resolve cards
    const cards: SupportCard[] = [];
    for (const cardId of cardIds) {
        const card = SUPPORT_CARD_LIST.find(c => c.id === cardId);
        if (card) cards.push(card);
    }
    if (cards.length === 0) return null;

    // Parse uma bonuses
    const umaBonuses = parseUmaStatBonus(umaName);
    const primaryStat = umaBonuses.length > 0 ? umaBonuses[0]!.stat : null;
    const secondaryStat = umaBonuses.length > 1 ? umaBonuses[1]!.stat : null;
    const primaryPct = umaBonuses.length > 0 ? umaBonuses[0]!.pct : 0;
    const secondaryPct = umaBonuses.length > 1 ? umaBonuses[1]!.pct : 0;

    // Calculate totals (use last value = max level)
    const totalRaceBonus = cards.reduce((sum, c) => sum + lv(c.raceBonus), 0);
    const totalTrainingEff = cards.reduce((sum, c) => sum + lv(c.trainingEffectiveness), 0);
    const totalSpecialtyPri = cards.reduce((sum, c) => sum + lv(c.specialtyPriority), 0);
    const totalFriendship = cards.reduce((sum, c) => sum + lv(c.friendshipBonus), 0);
    const totalMoodEffect = cards.reduce((sum, c) => sum + lv(c.moodEffect), 0);
    const totalHintLevels = cards.reduce((sum, c) => sum + lv(c.hintLevels), 0);
    const totalHintFrequency = cards.reduce((sum, c) => sum + lv(c.hintFrequency), 0);

    // Stat bonuses aligned with uma
    let statBonusScore = 0;
    if (primaryStat) {
        const totalPrimaryStat = cards.reduce((sum, c) => sum + getCardStatBonus(c, primaryStat), 0);
        // Weight by uma's bonus percentage (higher uma bonus = more valuable to invest in)
        statBonusScore += totalPrimaryStat * (1 + primaryPct / 100) * 100;
    }
    if (secondaryStat) {
        const totalSecondaryStat = cards.reduce((sum, c) => sum + getCardStatBonus(c, secondaryStat), 0);
        statBonusScore += totalSecondaryStat * (1 + secondaryPct / 100) * 70;
    }

    // Secondary stat bonuses (cards that have stats beyond the uma's bonuses)
    let secondaryStatScore = 0;
    cards.forEach(card => {
        ['speed', 'stamina', 'power', 'guts', 'wit'].forEach(statType => {
            if (statType !== primaryStat && statType !== secondaryStat) {
                const val = getCardStatBonus(card, statType);
                secondaryStatScore += val * 30;
            }
        });
    });

    // Race Bonus scoring
    const raceBonusMet = totalRaceBonus >= TB_RACE_BONUS_TARGET;
    let raceBonusScore = 0;
    if (raceBonusMet) {
        raceBonusScore = 500 + (totalRaceBonus - TB_RACE_BONUS_TARGET) * 10;
    } else {
        const coverage = totalRaceBonus / TB_RACE_BONUS_TARGET;
        raceBonusScore = coverage * 400;
    }

    // Training Effectiveness: critical for TB scenario
    const trainingEffectivenessScore = totalTrainingEff * 12;

    // Specialty Priority: higher = more specialty training
    const specialtyPriorityScore = totalSpecialtyPri * 4;

    // Friendship Bonus: helps with bond building
    const friendshipScore = totalFriendship * 3;

    // Mood Effect: valuable in some scenarios
    const moodEffectScore = totalMoodEffect * 2;

    // Hint stats: skill hint quality
    const hintScore = (totalHintLevels * 15) + (totalHintFrequency * 1);

    // Total weighted score
    const totalScore = Math.round(
        statBonusScore * 1.0 +
        raceBonusScore * 1.2 +
        trainingEffectivenessScore * 1.0 +
        specialtyPriorityScore * 0.8 +
        friendshipScore * 0.6 +
        moodEffectScore * 0.3 +
        hintScore * 0.5 +
        secondaryStatScore * 0.5
    );

    // Per-card scores
    const cardScores = cards.map(card => {
        let cardScore = 0;
        if (primaryStat) cardScore += getCardStatBonus(card, primaryStat) * 100 * (1 + primaryPct / 100);
        if (secondaryStat) cardScore += getCardStatBonus(card, secondaryStat) * 70 * (1 + secondaryPct / 100);
        cardScore += lv(card.raceBonus) * 15;
        cardScore += lv(card.trainingEffectiveness) * 12;
        cardScore += lv(card.specialtyPriority) * 4;
        cardScore += lv(card.friendshipBonus) * 3;
        cardScore += lv(card.moodEffect) * 2;
        cardScore += (lv(card.hintLevels) * 15) + (lv(card.hintFrequency) * 1);
        return { card, score: Math.round(cardScore), tier: '' };
    });
    cardScores.sort((a, b) => b.score - a.score);

    // Assign card tiers
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

    // Assign overall tier (based on percentile against max possible ~5000)
    const tier = assignTier(totalScore);

    return {
        umaName,
        score: totalScore,
        tier,
        cardScores,
        breakdown: {
            raceBonus: totalRaceBonus,
            raceBonusScore: Math.round(raceBonusScore),
            statBonusScore: Math.round(statBonusScore),
            trainingEffectivenessScore: Math.round(trainingEffectivenessScore),
            specialtyPriorityScore: Math.round(specialtyPriorityScore),
            friendshipScore: Math.round(friendshipScore),
            moodEffectScore: Math.round(moodEffectScore),
            hintScore: Math.round(hintScore),
            secondaryStatScore: Math.round(secondaryStatScore),
        },
        raceBonusMet,
        totalRaceBonus,
        umaPrimaryStat: primaryStat,
        umaSecondaryStat: secondaryStat,
    };
}

/** Assign tier based on score */
function assignTier(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
    // These thresholds are calibrated for a 6-card deck in Trackblazer
    // Max theoretical ~5000, typical good deck ~2500-3500
    if (score >= 3500) return 'S';
    if (score >= 2800) return 'A';
    if (score >= 2100) return 'B';
    if (score >= 1500) return 'C';
    if (score >= 1000) return 'D';
    if (score >= 600) return 'E';
    return 'F';
}

// ─── Player Ranking ─────────────────────────────────────────────────────────

/**
 * Rank players by their deck quality.
 * Requires: playerId -> umaName mapping + 6 card IDs per player
 */
export function rankPlayers(
    players: { id: string; name: string; uma: string; deck: string[] }[]
): PlayerDeckRanking[] {
    return players
        .map(player => ({
            playerId: player.id,
            playerName: player.name,
            umaName: player.uma,
            deck: player.deck,
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
