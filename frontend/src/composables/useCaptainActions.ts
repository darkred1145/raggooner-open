import { computed, type Ref } from 'vue';
import { useAuth } from './useAuth';
import type { Team, Tournament } from '../types';

const VERCEL_API_URL = import.meta.env.VITE_DISCORD_OAUTH_URL || 'https://raggooner-discord-oauth.vercel.app';

export function useCaptainActions(tournament: Ref<Tournament | null>) {
    const { linkedPlayer, user } = useAuth();

    // The team captained by the currently logged-in Discord user (null if not a captain).
    const captainTeam = computed((): Team | null => {
        if (!tournament.value || !linkedPlayer.value) return null;
        return tournament.value.teams.find((t) => t.captainId === linkedPlayer.value!.id) ?? null;
    });

    // True when the tournament has captain actions enabled and the user captains a team.
    const isCaptain = computed(() =>
        (tournament.value?.captainActionsEnabled ?? false) && captainTeam.value !== null
    );

    // True when it is this captain's turn in the player draft.
    const isMyPlayerDraftTurn = computed(() => {
        if (!isCaptain.value || !captainTeam.value || !tournament.value?.draft) return false;
        const { order, currentIdx } = tournament.value.draft;
        return order[currentIdx] === captainTeam.value.id;
    });

    // True when it is this captain's turn in the uma draft.
    const isMyUmaDraftTurn = computed(() => {
        if (!isCaptain.value || !captainTeam.value || !tournament.value?.draft) return false;
        const { order, currentIdx } = tournament.value.draft;
        return order[currentIdx] === captainTeam.value.id;
    });

    // Returns true when the captain can submit race results for a given group.
    // Groups stage: captain's team must be in that group.
    // Finals stage: captain's team must have qualified.
    const canCaptainEditGroup = (group: string): boolean => {
        if (!isCaptain.value || !captainTeam.value || !tournament.value) return false;
        const stage = tournament.value.stage;
        if (stage === 'groups') return captainTeam.value.group === group;
        if (stage === 'finals') return captainTeam.value.inFinals ?? false;
        return false;
    };

    // --- Helper to call Vercel captain API ---

    const getDiscordId = (): string => {
        try {
            const session = JSON.parse(localStorage.getItem('discord_session') || '{}');
            return session.discordId || '';
        } catch { return ''; }
    };

    const callCaptainApi = async (action: string, body: Record<string, any>): Promise<void> => {
        if (!tournament.value || !user.value) return;
        const discordId = getDiscordId();
        const res = await fetch(`${VERCEL_API_URL}/api/captain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, tournamentId: tournament.value.id, authToken: user.value.uid, discordId, ...body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to call ${action}`);
    };

    const captainDraftPlayer = async (targetPlayerId: string): Promise<void> => {
        await callCaptainApi('draftPlayer', { targetPlayerId });
    };

    const captainPickUma = async (umaId: string): Promise<void> => {
        await callCaptainApi('pickUma', { umaId });
    };

    const captainSubmitUma = async (playerId: string, umaId: string): Promise<void> => {
        await callCaptainApi('submitUma', { playerId, umaId });
    };

    const captainRenameTeam = async (name: string): Promise<void> => {
        await callCaptainApi('renameTeam', { name });
    };

    const captainSaveTapResults = async (
        group: string,
        raceNumber: number,
        placements: Record<string, number>
    ): Promise<void> => {
        await callCaptainApi('saveTap', { group, raceNumber, placements });
    };

    const captainUpdateRacePlacement = async (
        group: string,
        raceNumber: number,
        position: number,
        playerId: string
    ): Promise<void> => {
        await callCaptainApi('updatePlacement', { group, raceNumber, position, playerId });
    };

    return {
        captainTeam,
        isCaptain,
        isMyPlayerDraftTurn,
        isMyUmaDraftTurn,
        canCaptainEditGroup,
        captainDraftPlayer,
        captainPickUma,
        captainSubmitUma,
        captainRenameTeam,
        captainSaveTapResults,
        captainUpdateRacePlacement,
    };
}
