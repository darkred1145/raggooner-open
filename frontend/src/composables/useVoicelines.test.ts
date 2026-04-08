import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import type { Tournament, Team } from '../types';

vi.mock('../utils/umaData', () => ({
  UMA_DICT: {
    'Hishi Akebono': { characterId: 102401 },
    'Special Week': { characterId: 100101 },
    'Unknown Uma': undefined,
  },
}));

// Stub the Audio constructor to capture playback calls
const mockPlay = vi.fn().mockResolvedValue(undefined);
const MockAudio = vi.fn(function(this: any) { this.play = mockPlay; this.volume = 0; });
vi.stubGlobal('Audio', MockAudio);

import { useVoicelines, voicelineVolume } from './useVoicelines';

const makeTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team1', captainId: 'p1', memberIds: [], name: 'T1',
  points: 0, finalsPoints: 0, group: 'A', umaPool: [], ...overrides,
});

const makeTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  id: 't1', name: 'Test', status: 'ban', stage: 'groups',
  playerIds: [], players: {}, teams: [], races: {}, bans: [],
  createdAt: new Date().toISOString(), ...overrides,
});

describe('useVoicelines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── voicelineVolume ───────────────────────────────────────────────────────

  describe('voicelineVolume', () => {
    it('defaults to 0.8 when localStorage is empty', () => {
      expect(voicelineVolume.value).toBe(0.8);
    });

    it('persists to localStorage when changed', async () => {
      useVoicelines(ref<Tournament | null>(null)); // register the localStorage watcher
      voicelineVolume.value = 0.5;
      await nextTick();
      expect(localStorage.getItem('voicelineVolume')).toBe('0.5');
      voicelineVolume.value = 0.8; // restore
    });
  });

  // ── setBaseline ───────────────────────────────────────────────────────────

  describe('setBaseline', () => {
    it('initialises seenBans from tournament bans', async () => {
      const tournament = ref(makeTournament({ bans: ['Hishi Akebono'] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!);

      // Adding the same ban again should NOT trigger audio
      tournament.value = { ...tournament.value!, bans: ['Hishi Akebono'] };
      await nextTick();

      expect(MockAudio).not.toHaveBeenCalled();
    });

    it('initialises seenUmaPools from team pools', async () => {
      const team = makeTeam({ id: 'team1', umaPool: ['Special Week'] });
      const tournament = ref(makeTournament({ teams: [team] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!);

      // Same pool — no audio
      tournament.value = { ...tournament.value!, teams: [{ ...team }] };
      await nextTick();

      expect(MockAudio).not.toHaveBeenCalled();
    });

    it('initialises seenMembers from team memberIds', async () => {
      const team = makeTeam({ id: 'team1', memberIds: ['p2'] });
      const tournament = ref(makeTournament({ teams: [team] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!);

      tournament.value = { ...tournament.value!, teams: [{ ...team }] };
      await nextTick();

      expect(MockAudio).not.toHaveBeenCalled();
    });
  });

  // ── ban watcher ───────────────────────────────────────────────────────────

  describe('ban watcher', () => {
    it('does not play audio before setBaseline is called', async () => {
      const tournament = ref(makeTournament({ bans: [] }));
      useVoicelines(tournament);

      tournament.value = { ...tournament.value!, bans: ['Hishi Akebono'] };
      await nextTick();

      expect(MockAudio).not.toHaveBeenCalled();
    });

    it('plays ban sfx when a new ban is added', async () => {
      const tournament = ref(makeTournament({ bans: [] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!);

      tournament.value = { ...tournament.value!, bans: ['Unknown Uma'] };
      await nextTick();

      expect(MockAudio).toHaveBeenCalledWith('/assets/sound-effects/sfx-ban-button-click.mp3');
    });

    it('plays ban sfx AND voiceline when characterId is known', async () => {
      const tournament = ref(makeTournament({ bans: [] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!);

      tournament.value = { ...tournament.value!, bans: ['Hishi Akebono'] };
      await nextTick();

      const paths = MockAudio.mock.calls.map((c: any[]) => c[0]);
      expect(paths).toContain('/assets/sound-effects/sfx-ban-button-click.mp3');
      expect(paths).toContain('/assets/Voicelines/102401/102401-banned.wav');
    });

    it('does not replay already-seen bans', async () => {
      const tournament = ref(makeTournament({ bans: ['Hishi Akebono'] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!); // Hishi already seen

      // Add a second ban (different uma)
      tournament.value = { ...tournament.value!, bans: ['Hishi Akebono', 'Special Week'] };
      await nextTick();

      // Only Special Week sfx should fire (1 sfx + 1 voiceline = 2 calls)
      const paths = MockAudio.mock.calls.map((c: any[]) => c[0]);
      expect(paths.filter((p: string) => p.includes('ban-button-click'))).toHaveLength(1);
      expect(paths.filter((p: string) => p.includes('102401'))).toHaveLength(0); // Hishi not replayed
    });
  });

  // ── uma draft watcher ─────────────────────────────────────────────────────

  describe('uma draft / team watcher', () => {
    it('does not play audio before setBaseline is called', async () => {
      const team = makeTeam({ id: 'team1', umaPool: [] });
      const tournament = ref(makeTournament({ teams: [team] }));
      useVoicelines(tournament);

      tournament.value = { ...tournament.value!, teams: [{ ...team, umaPool: ['Special Week'] }] };
      await nextTick();

      expect(MockAudio).not.toHaveBeenCalled();
    });

    it('plays pick sfx and voiceline when a new uma is added to pool', async () => {
      const team = makeTeam({ id: 'team1', umaPool: [] });
      const tournament = ref(makeTournament({ teams: [team] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!);

      tournament.value = { ...tournament.value!, teams: [{ ...team, umaPool: ['Special Week'] }] };
      await nextTick();

      const paths = MockAudio.mock.calls.map((c: any[]) => c[0]);
      expect(paths).toContain('/assets/sound-effects/sfx-lockin-button-click.mp3');
      expect(paths).toContain('/assets/Voicelines/100101/100101-picked.wav');
    });

    it('plays only sfx (no voiceline) for uma without a characterId', async () => {
      // 'Unknown Uma' maps to undefined in the module-level UMA_DICT mock — no characterId
      const team = makeTeam({ id: 'team1', umaPool: [] });
      const tournament = ref(makeTournament({ teams: [team] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!);

      tournament.value = { ...tournament.value!, teams: [{ ...team, umaPool: ['Unknown Uma'] }] };
      await nextTick();

      const paths = MockAudio.mock.calls.map((c: any[]) => c[0]);
      expect(paths).toContain('/assets/sound-effects/sfx-lockin-button-click.mp3');
      expect(paths.every((p: string) => !p.includes('Voicelines'))).toBe(true);
    });

    it('does not replay already-seen umas', async () => {
      const team = makeTeam({ id: 'team1', umaPool: ['Special Week'] });
      const tournament = ref(makeTournament({ teams: [team] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!); // Special Week already seen

      // Update team without adding new umas
      tournament.value = { ...tournament.value!, teams: [{ ...team }] };
      await nextTick();

      expect(MockAudio).not.toHaveBeenCalled();
    });

    it('plays pick sfx when a new player is drafted', async () => {
      const team = makeTeam({ id: 'team1', memberIds: [] });
      const tournament = ref(makeTournament({ teams: [team] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!);

      tournament.value = { ...tournament.value!, teams: [{ ...team, memberIds: ['p2'] }] };
      await nextTick();

      const paths = MockAudio.mock.calls.map((c: any[]) => c[0]);
      expect(paths).toContain('/assets/sound-effects/sfx-lockin-button-click.mp3');
    });

    it('does not replay already-drafted members', async () => {
      const team = makeTeam({ id: 'team1', memberIds: ['p2'] });
      const tournament = ref(makeTournament({ teams: [team] }));
      const { setBaseline } = useVoicelines(tournament);
      setBaseline(tournament.value!);

      tournament.value = { ...tournament.value!, teams: [{ ...team }] };
      await nextTick();

      expect(MockAudio).not.toHaveBeenCalled();
    });
  });
});
