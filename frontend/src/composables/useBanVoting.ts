import { computed, type Ref } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { APP_ID } from '../config';
import { useAuth } from './useAuth';
import type { Tournament } from '../types';

export function useBanVoting(tournament: Ref<Tournament | null>, appId: string = APP_ID) {
    const { linkedPlayer } = useAuth();

    // Cloud function references
    const proposeBanFn = httpsCallable(functions, 'captainProposeBan');
    const voteOnBanFn = httpsCallable(functions, 'playerVoteOnBan');

    // Check if current user is a captain
    const isCaptain = computed(() => {
        if (!tournament.value || !linkedPlayer.value) return false;
        return tournament.value.teams.some((t) => t.captainId === linkedPlayer.value!.id);
    });

    // Check if captain has already proposed a ban
    const hasCaptainProposed = computed(() => {
        if (!tournament.value || !linkedPlayer.value) return false;
        const proposals = tournament.value.captainBanProposals ?? {};
        return proposals[linkedPlayer.value.id] !== undefined;
    });

    // Get the uma proposed by the current captain
    const captainProposedUma = computed(() => {
        if (!tournament.value || !linkedPlayer.value) return null;
        const proposals = tournament.value.captainBanProposals ?? {};
        return proposals[linkedPlayer.value.id] ?? null;
    });

    // Get all proposed bans with vote counts
    const proposedBans = computed(() => {
        if (!tournament.value) return [];
        const proposals = tournament.value.captainBanProposals ?? {};
        const votes = tournament.value.banVotes ?? {};
        const playerIds = tournament.value.playerIds ?? [];
        const threshold = tournament.value.banVoteThreshold ?? 0.5;

        return Object.entries(proposals).map(([captainId, umaId]) => {
            const umaVotes = votes[umaId as string] ?? {};
            const yesVotes = Object.values(umaVotes).filter((v) => v === true).length;
            const noVotes = Object.values(umaVotes).filter((v) => v === false).length;
            const totalVotes = yesVotes + noVotes;
            const banPassed = yesVotes / playerIds.length > threshold;
            const allVoted = playerIds.every((pid) => umaVotes[pid] !== undefined);

            return {
                umaId: umaId as string,
                captainId,
                yesVotes,
                noVotes,
                totalVotes,
                totalVoters: playerIds.length,
                banPassed,
                allVoted,
            };
        });
    });

    // Check if current player has voted on a specific uma
    const hasPlayerVoted = (umaId: string) => {
        if (!tournament.value || !linkedPlayer.value) return false;
        const votes = tournament.value.banVotes ?? {};
        const umaVotes = votes[umaId] ?? {};
        return umaVotes[linkedPlayer.value.id] !== undefined;
    };

    // Get current player's vote on a specific uma
    const getPlayerVote = (umaId: string) => {
        if (!tournament.value || !linkedPlayer.value) return null;
        const votes = tournament.value.banVotes ?? {};
        const umaVotes = votes[umaId] ?? {};
        return umaVotes[linkedPlayer.value.id] ?? null;
    };

    // Check if all captains have proposed
    const allCaptainsProposed = computed(() => {
        if (!tournament.value) return false;
        const proposals = tournament.value.captainBanProposals ?? {};
        const captainIds = tournament.value.teams.map((t) => t.captainId);
        return captainIds.every((cid) => proposals[cid] !== undefined);
    });

    // Check if ban phase is resolved
    const isBanPhaseResolved = computed(() => {
        return tournament.value?.banPhaseStatus === 'resolved';
    });

    // Get current ban phase status
    const banPhaseStatus = computed(() => {
        return tournament.value?.banPhaseStatus ?? 'captain-voting';
    });

    // --- Actions ---

    const captainProposeBan = async (umaId: string): Promise<void> => {
        if (!tournament.value) return;
        await proposeBanFn({ tournamentId: tournament.value.id, appId, umaId });
    };

    const playerVoteOnBan = async (umaId: string, vote: boolean): Promise<void> => {
        if (!tournament.value) return;
        await voteOnBanFn({ tournamentId: tournament.value.id, appId, umaId, vote });
    };

    return {
        // State
        isCaptain,
        hasCaptainProposed,
        captainProposedUma,
        proposedBans,
        allCaptainsProposed,
        isBanPhaseResolved,
        banPhaseStatus,
        // Helpers
        hasPlayerVoted,
        getPlayerVote,
        // Actions
        captainProposeBan,
        playerVoteOnBan,
    };
}
