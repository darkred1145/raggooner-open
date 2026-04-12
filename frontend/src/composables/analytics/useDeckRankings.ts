/**
 * Deck Ranking composable for Analytics Dashboard
 *
 * Ranks all players by their support card deck quality,
 * synced with their assigned Uma's stat bonuses.
 */

import { ref, computed, type Ref } from 'vue';
import type { GlobalPlayer, Tournament } from '../../types';
import { evaluateDeck, type PlayerDeckRanking, type DeckEvaluation, TB_RACE_BONUS_TARGET } from '../../utils/supportCardRanking';
import { getUmaData } from '../../utils/umaData';

export function useDeckRankings(
    players: Ref<GlobalPlayer[]>,
    filteredTournaments: Ref<Tournament[]>
) {
    const deckSortKey = ref<'score' | 'raceBonus' | 'trainingEff' | 'specialtyPri' | 'friendship'>('score');
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
            // Use first uma from roster as the primary uma for deck evaluation
            const umaName = player.roster?.[0];
            if (!umaName || !player.supportCards?.length) continue;

            // Check if player has played in any filtered tournament
            const hasPlayed = filteredTournaments.value.some(t =>
                t.playerIds?.includes(player.id) ||
                Object.values(t.players).some(p => p.id === player.id)
            );
            if (!hasPlayed) continue;

            const cardIds = player.supportCards.map(sc => sc.cardId);
            const evaluation = evaluateDeck(umaName, cardIds);

            rankings.push({
                playerId: player.id,
                playerName: player.name,
                umaName,
                deck: cardIds,
                evaluation,
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
                case 'friendship':
                    aVal = aEval?.breakdown.friendshipScore ?? 0;
                    bVal = bEval?.breakdown.friendshipScore ?? 0;
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

    // Uma stat bonus display helper
    const umaStatBonus = computed(() => {
        const result: Record<string, string> = {};
        const seen = new Set<string>();
        deckRankings.value.forEach(r => {
            const uma = getUmaData(r.umaName);
            if (uma?.statBonus && !seen.has(r.umaName)) {
                seen.add(r.umaName);
                result[r.umaName] = uma.statBonus;
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
