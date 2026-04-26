import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { Tournament, Team } from '../types';

const mockLinkedPlayer = ref<{ id: string } | null>(null);
const mockUser = ref<{ uid: string } | null>(null);

vi.mock('./useAuth', () => ({
  useAuth: () => ({
    linkedPlayer: mockLinkedPlayer,
    user: mockUser,
  }),
}));

import { useCaptainActions } from './useCaptainActions';

const makeTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team1',
  captainId: 'p1',
  memberIds: ['p2'],
  name: 'Team 1',
  points: 0,
  finalsPoints: 0,
  group: 'A',
  ...overrides,
});

const makeTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  id: 't1',
  name: 'Test',
  status: 'draft',
  stage: 'groups',
  playerIds: [],
  players: {},
  teams: [],
  races: {},
  createdAt: new Date().toISOString(),
  captainActionsEnabled: true,
  ...overrides,
});

describe('useCaptainActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLinkedPlayer.value = null;
    mockUser.value = null;
    localStorage.clear();
    localStorage.setItem('discord_session', JSON.stringify({ discordId: 'discord-123' }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));
  });

  describe('captainTeam', () => {
    it('is null when tournament is null', () => {
      const { captainTeam } = useCaptainActions(ref(null));
      expect(captainTeam.value).toBeNull();
    });

    it('returns the team the linked player captains', () => {
      mockLinkedPlayer.value = { id: 'p1' };
      const { captainTeam } = useCaptainActions(ref(makeTournament({ teams: [makeTeam()] })));
      expect(captainTeam.value?.id).toBe('team1');
    });
  });

  describe('draft turn helpers', () => {
    it('is false when not a captain', () => {
      const { isMyPlayerDraftTurn, isMyUmaDraftTurn } = useCaptainActions(ref(makeTournament()));
      expect(isMyPlayerDraftTurn.value).toBe(false);
      expect(isMyUmaDraftTurn.value).toBe(false);
    });

    it('returns true when it is this captain team turn', () => {
      mockLinkedPlayer.value = { id: 'p1' };
      const team = makeTeam({ id: 'team1', captainId: 'p1' });
      const tournament = makeTournament({
        teams: [team],
        draft: { order: ['team1', 'team2'], currentIdx: 0 },
      });

      const { isMyPlayerDraftTurn, isMyUmaDraftTurn } = useCaptainActions(ref(tournament));
      expect(isMyPlayerDraftTurn.value).toBe(true);
      expect(isMyUmaDraftTurn.value).toBe(true);
    });
  });

  describe('canCaptainEditGroup', () => {
    it('returns true for the captain group in groups stage', () => {
      mockLinkedPlayer.value = { id: 'p1' };
      const tournament = makeTournament({ teams: [makeTeam({ group: 'B' })], stage: 'groups' });
      const { canCaptainEditGroup } = useCaptainActions(ref(tournament));

      expect(canCaptainEditGroup('B')).toBe(true);
      expect(canCaptainEditGroup('A')).toBe(false);
    });

    it('returns true in finals when the team qualified', () => {
      mockLinkedPlayer.value = { id: 'p1' };
      const tournament = makeTournament({ teams: [makeTeam({ inFinals: true })], stage: 'finals' });
      const { canCaptainEditGroup } = useCaptainActions(ref(tournament));

      expect(canCaptainEditGroup('A')).toBe(true);
    });
  });

  describe('API actions', () => {
    beforeEach(() => {
      mockUser.value = { uid: 'uid-123' };
    });

    it('does nothing when tournament is null', async () => {
      const { captainDraftPlayer } = useCaptainActions(ref(null));
      await captainDraftPlayer('p2');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('does nothing when user is missing', async () => {
      mockUser.value = null;
      const { captainPickUma } = useCaptainActions(ref(makeTournament()));
      await captainPickUma('Gold Ship');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('calls the Vercel endpoint for draft player', async () => {
      const { captainDraftPlayer } = useCaptainActions(ref(makeTournament({ id: 't1' })));
      await captainDraftPlayer('p2');

      expect(fetch).toHaveBeenCalledOnce();
      const [url, init] = vi.mocked(fetch).mock.calls[0]!;
      expect(url).toContain('/api/captain');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toMatchObject({
        action: 'draftPlayer',
        tournamentId: 't1',
        authToken: 'uid-123',
        discordId: 'discord-123',
        targetPlayerId: 'p2',
      });
    });

    it('calls the Vercel endpoint for pick uma', async () => {
      const { captainPickUma } = useCaptainActions(ref(makeTournament({ id: 't1' })));
      await captainPickUma('Gold Ship');

      const [, init] = vi.mocked(fetch).mock.calls[0]!;
      expect(JSON.parse(String(init?.body))).toMatchObject({
        action: 'pickUma',
        umaId: 'Gold Ship',
      });
    });

    it('calls the Vercel endpoint for submit uma', async () => {
      const { captainSubmitUma } = useCaptainActions(ref(makeTournament({ id: 't1' })));
      await captainSubmitUma('p2', 'Gold Ship');

      const [, init] = vi.mocked(fetch).mock.calls[0]!;
      expect(JSON.parse(String(init?.body))).toMatchObject({
        action: 'submitUma',
        playerId: 'p2',
        umaId: 'Gold Ship',
      });
    });

    it('calls the Vercel endpoint for save tap results', async () => {
      const { captainSaveTapResults } = useCaptainActions(ref(makeTournament({ id: 't1' })));
      await captainSaveTapResults('A', 3, { p1: 1, p2: 2 });

      const [, init] = vi.mocked(fetch).mock.calls[0]!;
      expect(JSON.parse(String(init?.body))).toMatchObject({
        action: 'saveTap',
        group: 'A',
        raceNumber: 3,
        placements: { p1: 1, p2: 2 },
      });
    });

    it('calls the Vercel endpoint for placement updates', async () => {
      const { captainUpdateRacePlacement } = useCaptainActions(ref(makeTournament({ id: 't1' })));
      await captainUpdateRacePlacement('B', 2, 3, 'p1');

      const [, init] = vi.mocked(fetch).mock.calls[0]!;
      expect(JSON.parse(String(init?.body))).toMatchObject({
        action: 'updatePlacement',
        group: 'B',
        raceNumber: 2,
        position: 3,
        playerId: 'p1',
      });
    });
  });
});
