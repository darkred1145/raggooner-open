/**
 * Deck Ranking composable for Analytics Dashboard
 *
 * Ranks all players by their support card deck quality,
 * synced with their assigned Uma's stat bonuses.
 */

import { ref, computed, type Ref } from 'vue';
import type { GlobalPlayer, Tournament } from '../../types';
import { evaluateDeck, type PlayerDeckRanking, type DeckEvaluation } from '../../utils/supportCardRanking';
import { getUmaData } from '../../utils/umaData';

export function useDeckRankings(
    players: Ref<GlobalPlayer[]>,
    filteredTournaments: Ref<Tournament[]>
) {
    const deckSortKey = ref<'score' | 'raceBonus' | 'trainingEff' | 'specialtyPri' | 'utility' | 'composition'>('score');
    const deckSortDesc = ref(true);
    const deckSearchQuery = ref('');

    const toggleDeckSort = (key: typeof deckSortKey.value) => {
        if (deckSortKey.value === key) {
            deckSortDesc.value = !deckSortDesc.value;
        } else {
            deckSortKey.value = key;
            deckSortDesc.value = true;
        }
    };

    // Build deck rankings from player profiles
    const deckRankings = computed<PlayerDeckRanking[]>(() => {
        if (!players.value?.length) return [];

        const rankings: PlayerDeckRanking[] = [];

        for (const player of players.value) {
            const umas = player.roster?.filter(u => u);
            if (!umas || umas.length === 0 || !player.supportCards?.length) continue;

            // Check if player has played in any filtered tournament
            const hasPlayed = filteredTournaments.value.some(t =>
                t.playerIds?.includes(player.id) ||
                Object.values(t.players).some(p => p.id === player.id)
            );
            if (!hasPlayed) continue;

            const cards = player.supportCards.map(sc => ({
                cardId: sc.cardId,
                limitBreak: sc.limitBreak ?? 0,
            }));

            // Evaluate deck against each uma the player has, then average
            // Only use TOP 6 cards for the deck score (realistic deck size)
            const evaluations = umas
                .map(umaName => {
                    const fullEval = evaluateDeck(umaName, cards);
                    if (!fullEval) return null;

                    // Get top 6 cards by individual score
                    const top6 = [...fullEval.cardScores].sort((a, b) => b.score - a.score).slice(0, 6);
                    const top6CardIds = new Set(top6.map(c => c.card.id));
                    const top6Cards = cards.filter(c => top6CardIds.has(c.cardId));

                    // Re-evaluate with only top 6
                    const top6Eval = evaluateDeck(umaName, top6Cards);
                    if (!top6Eval) return null;

                    // Merge: use top 6 for score/breakdown, but keep all cards for display
                    return {
                        ...top6Eval,
                        cardScores: fullEval.cardScores, // All cards for display
                    };
                })
                .filter((e): e is DeckEvaluation & { cardScores: DeckEvaluation['cardScores'] } => e !== null);

            if (evaluations.length === 0) continue;

            // Average the scores across all umas
            const avgEvaluation: DeckEvaluation = {
                umaName: `${umas[0]}${umas.length > 1 ? ` +${umas.length - 1}` : ''}`,
                score: Math.round(evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length),
                tier: evaluations[0]!.tier,
                cardScores: evaluations[0]!.cardScores,
                breakdown: {
                    raceBonus: Math.round(evaluations.reduce((s, e) => s + e.breakdown.raceBonus, 0) / evaluations.length),
                    raceBonusScore: Math.round(evaluations.reduce((s, e) => s + e.breakdown.raceBonusScore, 0) / evaluations.length),
                    statBonusScore: Math.round(evaluations.reduce((s, e) => s + e.breakdown.statBonusScore, 0) / evaluations.length),
                    trainingEffectivenessScore: Math.round(evaluations.reduce((s, e) => s + e.breakdown.trainingEffectivenessScore, 0) / evaluations.length),
                    specialtyPriorityScore: Math.round(evaluations.reduce((s, e) => s + e.breakdown.specialtyPriorityScore, 0) / evaluations.length),
                    utilityScore: Math.round(evaluations.reduce((s, e) => s + e.breakdown.utilityScore, 0) / evaluations.length),
                    compositionPenalty: Math.round(evaluations.reduce((s, e) => s + e.breakdown.compositionPenalty, 0) / evaluations.length),
                    secondaryStatScore: Math.round(evaluations.reduce((s, e) => s + e.breakdown.secondaryStatScore, 0) / evaluations.length),
                },
                raceBonusMet: evaluations.every(e => e.raceBonusMet),
                totalRaceBonus: Math.round(evaluations.reduce((s, e) => s + e.totalRaceBonus, 0) / evaluations.length),
                umaPrimaryStat: evaluations[0]!.umaPrimaryStat,
                umaSecondaryStat: evaluations[0]!.umaSecondaryStat,
            };

            rankings.push({
                playerId: player.id,
                playerName: player.name,
                umaName: `${umas[0]}${umas.length > 1 ? ` +${umas.length - 1}` : ''}`,
                deck: cards.map(c => c.cardId),
                evaluation: avgEvaluation,
            });
        }

        // Sort
        rankings.sort((a, b) => {
            const aEval = a.evaluation;
            const bEval = b.evaluation;
            let aVal = 0, bVal = 0;

            switch (deckSortKey.value) {
                case 'score':
                    aVal = aEval?.score ?? 0;
                    bVal = bEval?.score ?? 0;
                    break;
                case 'raceBonus':
                    aVal = aEval?.totalRaceBonus ?? 0;
                    bVal = bEval?.totalRaceBonus ?? 0;
                    break;
                case 'trainingEff':
                    aVal = aEval?.breakdown.trainingEffectivenessScore ?? 0;
                    bVal = bEval?.breakdown.trainingEffectivenessScore ?? 0;
                    break;
                case 'specialtyPri':
                    aVal = aEval?.breakdown.specialtyPriorityScore ?? 0;
                    bVal = bEval?.breakdown.specialtyPriorityScore ?? 0;
                    break;
                case 'utility':
                    aVal = aEval?.breakdown.utilityScore ?? 0;
                    bVal = bEval?.breakdown.utilityScore ?? 0;
                    break;
                case 'composition':
                    aVal = aEval?.breakdown.compositionPenalty ?? 0;
                    bVal = bEval?.breakdown.compositionPenalty ?? 0;
                    break;
            }

            return deckSortDesc.value ? bVal - aVal : aVal - bVal;
        });

        return rankings;
    });

    // Filter by search
    const filteredDeckRankings = computed(() => {
        if (!deckSearchQuery.value) return deckRankings.value;
        const q = deckSearchQuery.value.toLowerCase();
        return deckRankings.value.filter(r =>
            r.playerName.toLowerCase().includes(q) ||
            r.umaName.toLowerCase().includes(q)
        );
    });

    // Stats summary
    const deckStats = computed(() => {
        const rankings = deckRankings.value.filter(r => r.evaluation);
        if (rankings.length === 0) return null;

        const scores = rankings.map(r => r.evaluation!.score);
        const raceBonuses = rankings.map(r => r.evaluation!.totalRaceBonus);
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const avgRaceBonus = Math.round(raceBonuses.reduce((a, b) => a + b, 0) / raceBonuses.length);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const metRaceBonus = rankings.filter(r => r.evaluation!.raceBonusMet).length;

        return {
            totalPlayers: rankings.length,
            avgScore,
            avgRaceBonus,
            maxScore,
            minScore,
            metRaceBonus,
            metRaceBonusPct: Math.round((metRaceBonus / rankings.length) * 100),
        };
    });

    // Uma stat bonus display helper - show primary uma's stat bonus
    const umaStatBonus = computed(() => {
        const result: Record<string, string> = {};
        deckRankings.value.forEach(r => {
            const primaryUma = r.umaName.split(' +')[0];
            if (!primaryUma) return;
            const uma = getUmaData(primaryUma);
            if (uma?.statBonus && !result[primaryUma]) {
                result[primaryUma] = uma.statBonus;
            }
        });
        return result;
    });

    return {
        deckRankings,
        filteredDeckRankings,
        deckStats,
        umaStatBonus,
        deckSortKey,
        deckSortDesc,
        deckSearchQuery,
        toggleDeckSort,
    };
}
