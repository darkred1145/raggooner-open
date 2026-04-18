import type {Team, Tournament} from "../types.ts";

export function generateDraftStructure(tournament: Tournament) {
    const captains = Object.values(tournament.players).filter(p => p.isCaptain);
    const draftOrderCaptains = [...captains].sort(() => Math.random() - 0.5);

    let groupDeck: string[] = [];
    const numTeams = captains.length;

    // --- Multi-stage tournament logic ---
    if (numTeams >= 27) {
        // Large tournament: 9 groups of 3 each
        const numGroups = Math.ceil(numTeams / 9);
        for (let i = 0; i < numGroups; i++) {
            for (let j = 0; j < Math.min(9, numTeams - i * 9); j++) {
                groupDeck.push(String.fromCharCode(65 + i)); // A, B, C, etc.
            }
        }
    } else if (numTeams === 9) {
        // 3 Groups of 3
        groupDeck = ['A', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C'];
    } else if (numTeams === 8) {
        // 2 Groups of 4
        groupDeck = ['A', 'A', 'A', 'A', 'B', 'B', 'B', 'B'];
    } else if (numTeams === 6) {
        // 2 Groups of 3
        groupDeck = ['A', 'A', 'A', 'B', 'B', 'B'];
    } else {
        // Small tournament (Main Event)
        groupDeck = Array(numTeams).fill('A');
    }

    // Shuffle groups
    groupDeck.sort(() => Math.random() - 0.5);

    const teams: Team[] = draftOrderCaptains.map((cap, index) => ({
        id: crypto.randomUUID(),
        captainId: cap.id,
        memberIds: [],
        name: `Team ${cap.name}`,
        points: 0,
        finalsPoints: 0,
        group: groupDeck[index] as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I',
        inFinals: numTeams < 6,
        umaPool: []
    }));

    const draftOrder: string[] = [];
    for (let i = 0; i < teams.length; i++) draftOrder.push(teams[i]!.id);
    for (let i = teams.length - 1; i >= 0; i--) draftOrder.push(teams[i]!.id);
    return {teams, draftOrder};
}

/**
 * Generate uma draft order from a completed player draft.
 * Reverses the forward order from the player draft, then builds a 3-round snake.
 * Example with 3 teams [A,B,C] player draft → uma draft: [C,B,A, A,B,C, C,B,A]
 */
export function generateUmaDraftOrder(tournament: Tournament): string[] {
    if (!tournament.draft?.order) return [];

    // Extract unique team IDs in forward order from the player draft order
    const seen = new Set<string>();
    const forwardOrder: string[] = [];
    for (const teamId of tournament.draft.order) {
        if (!seen.has(teamId)) {
            seen.add(teamId);
            forwardOrder.push(teamId);
        }
    }

    // Reverse for uma draft starting order
    const reversed = [...forwardOrder].reverse();

    // Build 3-round snake: reverse, forward, reverse
    const umaDraftOrder: string[] = [
        ...reversed,
        ...forwardOrder,
        ...reversed
    ];

    return umaDraftOrder;
}
