import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import type { Tournament, Race, Player, Team } from '../types';
import { useJokeConfirmation, JOKE_PLAYERS, useEasterEgg } from './useEasterEgg';

// Stub Audio to prevent errors in Node environment
const mockPlay = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('Audio', vi.fn(function(this: any) { this.play = mockPlay; this.volume = 0; }));

// ── helpers ───────────────────────────────────────────────────────────────────

const makePlayer = (id: string, uma = ''): Player => ({
  id, name: id, isCaptain: false, uma,
});

const makeTeam = (id: string, captainId: string, memberIds: string[] = []): Team => ({
  id, captainId, memberIds, name: id, points: 0, finalsPoints: 0, group: 'A',
});

const makeRace = (
  id: string,
  placements: Record<string, number>,
  stage: 'groups' | 'finals' = 'finals',
  raceNumber = 1,
): Race => ({ id, stage, group: 'A', raceNumber, timestamp: new Date().toISOString(), placements });

const makeTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  id: 't1', name: 'Test', status: 'active', stage: 'groups',
  playerIds: [], players: {}, teams: [], races: {}, createdAt: new Date().toISOString(),
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
// useJokeConfirmation
// ═══════════════════════════════════════════════════════════════════════════════

describe('useJokeConfirmation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const makeConfig = (jokes = ['Step 1', 'Step 2', 'Final step'], shouldMove = false) => ({
    jokes, shouldMove,
  });

  // ── JOKE_PLAYERS ──────────────────────────────────────────────────────────

  it('JOKE_PLAYERS has at least one entry', () => {
    expect(Object.keys(JOKE_PLAYERS).length).toBeGreaterThan(0);
  });

  it('each JOKE_PLAYERS entry has a jokes array and shouldMove boolean', () => {
    for (const config of Object.values(JOKE_PLAYERS)) {
      expect(Array.isArray(config.jokes)).toBe(true);
      expect(typeof config.shouldMove).toBe('boolean');
    }
  });

  // ── triggerJoke ───────────────────────────────────────────────────────────

  describe('triggerJoke', () => {
    it('sets isShowing, currentStep=0, activeConfig and timeLeft=4', () => {
      const { triggerJoke, isShowing, currentStep, activeConfig, timeLeft } = useJokeConfirmation();
      const config = makeConfig();
      triggerJoke(config, vi.fn(), vi.fn());
      expect(isShowing.value).toBe(true);
      expect(currentStep.value).toBe(0);
      expect(activeConfig.value).toStrictEqual(config);
      expect(timeLeft.value).toBe(4);
    });

    it('calls onFail and resets when timer runs out', () => {
      const onFail = vi.fn();
      const { triggerJoke, isShowing } = useJokeConfirmation();
      triggerJoke(makeConfig(), vi.fn(), onFail);

      vi.advanceTimersByTime(4000); // timeLeft goes to ≤ 0
      expect(onFail).toHaveBeenCalledOnce();
      expect(isShowing.value).toBe(false);
    });

    it('decrements timeLeft over time', () => {
      const { triggerJoke, timeLeft } = useJokeConfirmation();
      triggerJoke(makeConfig(), vi.fn(), vi.fn());
      const initial = timeLeft.value;
      vi.advanceTimersByTime(500);
      expect(timeLeft.value).toBeLessThan(initial);
    });
  });

  // ── nextStep ──────────────────────────────────────────────────────────────

  describe('nextStep', () => {
    it('does nothing when no active config', () => {
      const { nextStep, currentStep } = useJokeConfirmation();
      nextStep();
      expect(currentStep.value).toBe(0);
    });

    it('advances to the next step', () => {
      const { triggerJoke, nextStep, currentStep } = useJokeConfirmation();
      triggerJoke(makeConfig(['A', 'B', 'C']), vi.fn(), vi.fn());
      nextStep();
      expect(currentStep.value).toBe(1);
    });

    it('resets and calls onComplete on the last step', () => {
      const onComplete = vi.fn();
      const { triggerJoke, nextStep, isShowing, currentStep } = useJokeConfirmation();
      triggerJoke(makeConfig(['A', 'B']), onComplete, vi.fn());
      nextStep(); // advance to last step (index 1)
      nextStep(); // complete
      expect(onComplete).toHaveBeenCalledOnce();
      expect(isShowing.value).toBe(false);
      expect(currentStep.value).toBe(0);
    });

    it('resets timeLeft to 4 on each step', () => {
      const { triggerJoke, nextStep, timeLeft } = useJokeConfirmation();
      triggerJoke(makeConfig(['A', 'B', 'C']), vi.fn(), vi.fn());
      vi.advanceTimersByTime(1000);
      nextStep();
      expect(timeLeft.value).toBe(4);
    });
  });

  // ── reset ─────────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('clears all state', () => {
      const { triggerJoke, reset, isShowing, currentStep, activeConfig } = useJokeConfirmation();
      triggerJoke(makeConfig(), vi.fn(), vi.fn());
      reset();
      expect(isShowing.value).toBe(false);
      expect(currentStep.value).toBe(0);
      expect(activeConfig.value).toBeNull();
    });
  });

  // ── triggerDelayedToast ───────────────────────────────────────────────────

  describe('triggerDelayedToast', () => {
    it('shows message after delayMs and clears after durationMs', () => {
      const { triggerDelayedToast, toastMessage } = useJokeConfirmation();
      triggerDelayedToast({ message: 'hello', delayMs: 1000, durationMs: 2000 });

      vi.advanceTimersByTime(999);
      expect(toastMessage.value).toBeNull();

      vi.advanceTimersByTime(1);
      expect(toastMessage.value).toBe('hello');

      vi.advanceTimersByTime(2000);
      expect(toastMessage.value).toBeNull();
    });

    it('uses default delays when not specified', () => {
      const { triggerDelayedToast, toastMessage } = useJokeConfirmation();
      triggerDelayedToast({ message: 'hi' });

      vi.advanceTimersByTime(10000);
      expect(toastMessage.value).toBe('hi');

      vi.advanceTimersByTime(5000);
      expect(toastMessage.value).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useEasterEgg — egg check functions (tested indirectly via useEasterEgg)
// ═══════════════════════════════════════════════════════════════════════════════

describe('useEasterEgg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── first load is always silent ───────────────────────────────────────────

  it('does not set activeVisualEgg on first load even if egg condition is met', async () => {
    const players = { p1: makePlayer('p1', 'Hishi Akebono') };
    const races = { r1: makeRace('r1', { p1: 1 }) };
    const tournament = ref(makeTournament({ players, races }));

    const { activeVisualEgg } = useEasterEgg(tournament);
    await nextTick();

    expect(activeVisualEgg.value).toBeNull();
  });

  // ── hishi_win egg ─────────────────────────────────────────────────────────

  describe('hishi_win egg', () => {
    it('triggers when Hishi Akebono wins a race', async () => {
      const players = { p1: makePlayer('p1', 'Hishi Akebono') };
      // First load: race r1 (silent)
      const tournament = ref(makeTournament({ players, races: { r1: makeRace('r1', { p1: 1 }) } }));
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      // Add a NEW race — triggers loud processRaces
      tournament.value = {
        ...tournament.value,
        races: { ...tournament.value.races, r2: makeRace('r2', { p1: 1 }, 'finals', 2) },
      };
      await nextTick();

      expect(activeVisualEgg.value?.id).toBe('hishi_win');
    });

    it('does not trigger when Hishi Akebono does not win', async () => {
      const players = {
        p1: makePlayer('p1', 'Hishi Akebono'),
        p2: makePlayer('p2', 'Gold Ship'),
      };
      const tournament = ref(makeTournament({ players, races: {} }));
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      // p2 wins (not Hishi Akebono)
      tournament.value = {
        ...tournament.value,
        races: { r1: makeRace('r1', { p1: 2, p2: 1 }) },
      };
      await nextTick();

      expect(activeVisualEgg.value?.id).not.toBe('hishi_win');
    });

    it('does not trigger when no winner (position 1) is present', async () => {
      const players = { p1: makePlayer('p1', 'Hishi Akebono') };
      const tournament = ref(makeTournament({ players, races: {} }));
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      tournament.value = {
        ...tournament.value,
        races: { r1: makeRace('r1', { p1: 2 }) }, // position 2, not 1
      };
      await nextTick();

      expect(activeVisualEgg.value?.id).not.toBe('hishi_win');
    });
  });

  // ── dedra_spechonky egg ───────────────────────────────────────────────────

  describe('dedra_spechonky egg', () => {
    it('triggers when Dedratermi wins with Special Week', async () => {
      const players = { p1: { ...makePlayer('p1', 'Special Week'), name: 'Dedratermi' } };
      const tournament = ref(makeTournament({ players, races: {} }));
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      tournament.value = {
        ...tournament.value,
        races: { r1: makeRace('r1', { p1: 1 }) },
      };
      await nextTick();

      expect(activeVisualEgg.value?.id).toBe('dedra_spechonky');
    });

    it('does not trigger for a different player name with Special Week', async () => {
      const players = { p1: { ...makePlayer('p1', 'Special Week'), name: 'SomeOtherPlayer' } };
      const tournament = ref(makeTournament({ players, races: {} }));
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      tournament.value = {
        ...tournament.value,
        races: { r1: makeRace('r1', { p1: 1 }) },
      };
      await nextTick();

      expect(activeVisualEgg.value?.id).not.toBe('dedra_spechonky');
    });

    it('does not trigger for Dedratermi with a different uma', async () => {
      const players = { p1: { ...makePlayer('p1', 'Gold Ship'), name: 'Dedratermi' } };
      const tournament = ref(makeTournament({ players, races: {} }));
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      tournament.value = {
        ...tournament.value,
        races: { r1: makeRace('r1', { p1: 1 }) },
      };
      await nextTick();

      expect(activeVisualEgg.value?.id).not.toBe('dedra_spechonky');
    });
  });

  // ── flawless_victory egg ──────────────────────────────────────────────────

  describe('flawless_victory egg', () => {
    const setupFlawlessTournament = () => {
      const players = {
        p1: makePlayer('p1', 'Gold Ship'),
        p2: makePlayer('p2', 'Special Week'),
        p3: makePlayer('p3', 'Silence Suzuka'),
        p4: makePlayer('p4', 'Haru Urara'),
      };
      const team = makeTeam('team1', 'p1', ['p2', 'p3']);
      // 4 finals races — not enough to trigger yet
      const races: Record<string, Race> = {
        r1: makeRace('r1', { p1: 1, p2: 2, p3: 3, p4: 4 }, 'finals', 1),
        r2: makeRace('r2', { p1: 1, p2: 2, p3: 3, p4: 4 }, 'finals', 2),
        r3: makeRace('r3', { p1: 1, p2: 2, p3: 3, p4: 4 }, 'finals', 3),
        r4: makeRace('r4', { p1: 1, p2: 2, p3: 3, p4: 4 }, 'finals', 4),
      };
      return makeTournament({ players, teams: [team], races });
    };

    it('triggers when team sweeps all 5+ finals races', async () => {
      const base = setupFlawlessTournament();
      const tournament = ref(base);
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick(); // first silent load with 4 races — not enough

      // Add the 5th race (the last one)
      const r5 = makeRace('r5', { p1: 1, p2: 2, p3: 3, p4: 4 }, 'finals', 5);
      tournament.value = {
        ...tournament.value,
        races: { ...tournament.value.races, r5 },
      };
      await nextTick();

      expect(activeVisualEgg.value?.id).toBe('flawless_victory');
    });

    it('does not trigger when team does not sweep all races', async () => {
      const base = setupFlawlessTournament();
      // Break the sweep in r1: p4 wins instead of p1
      base.races['r1'] = makeRace('r1', { p4: 1, p1: 2, p2: 3, p3: 4 }, 'finals', 1);
      const tournament = ref(base);
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      const r5 = makeRace('r5', { p1: 1, p2: 2, p3: 3, p4: 4 }, 'finals', 5);
      tournament.value = { ...tournament.value, races: { ...tournament.value.races, r5 } };
      await nextTick();

      expect(activeVisualEgg.value?.id).not.toBe('flawless_victory');
    });

    it('does not trigger with fewer than 5 finals races', async () => {
      const base = setupFlawlessTournament();
      // Only 3 races, all sweeps
      base.races = {
        r1: makeRace('r1', { p1: 1, p2: 2, p3: 3 }, 'finals', 1),
        r2: makeRace('r2', { p1: 1, p2: 2, p3: 3 }, 'finals', 2),
        r3: makeRace('r3', { p1: 1, p2: 2, p3: 3 }, 'finals', 3),
      };
      const tournament = ref(base);
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      // After first silent load, no egg. Add another sweep race (4 total — still < 5)
      tournament.value = {
        ...tournament.value,
        races: { ...tournament.value.races, r4: makeRace('r4', { p1: 1, p2: 2, p3: 3 }, 'finals', 4) },
      };
      await nextTick();

      expect(activeVisualEgg.value?.id).not.toBe('flawless_victory');
    });
  });

  // ── deduplication ─────────────────────────────────────────────────────────

  describe('deduplication', () => {
    it('does not trigger the same egg twice for the same race', async () => {
      const players = { p1: makePlayer('p1', 'Hishi Akebono') };
      const tournament = ref(makeTournament({ players, races: {} }));
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      // Race triggers egg
      tournament.value = { ...tournament.value, races: { r1: makeRace('r1', { p1: 1 }) } };
      await nextTick();
      expect(activeVisualEgg.value?.id).toBe('hishi_win');

      // Clear the visual (simulate duration expiry)
      activeVisualEgg.value = null;

      // "Update" tournament without adding new races — same race should NOT re-trigger
      tournament.value = { ...tournament.value, name: 'Updated Name' };
      await nextTick();
      expect(activeVisualEgg.value).toBeNull();
    });
  });

  // ── tournament switch ─────────────────────────────────────────────────────

  describe('tournament switch', () => {
    it('resets play history when tournament ID changes', async () => {
      const players = { p1: makePlayer('p1', 'Hishi Akebono') };
      const tournament = ref(makeTournament({ id: 't1', players, races: { r1: makeRace('r1', { p1: 1 }) } }));
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick(); // silent first load for t1

      // Switch to a different tournament
      tournament.value = makeTournament({ id: 't2', players, races: {} });
      await nextTick(); // new tournament — first silent load

      // Now add a race to t2 — should fire (history was reset)
      tournament.value = {
        ...tournament.value,
        races: { r1: makeRace('r1', { p1: 1 }) },
      };
      await nextTick();

      expect(activeVisualEgg.value?.id).toBe('hishi_win');
    });

    it('clears activeVisualEgg when switching tournaments', async () => {
      const players = { p1: makePlayer('p1', 'Hishi Akebono') };
      const tournament = ref(makeTournament({ id: 't1', players, races: {} }));
      const { activeVisualEgg } = useEasterEgg(tournament);
      await nextTick();

      tournament.value = { ...tournament.value, races: { r1: makeRace('r1', { p1: 1 }) } };
      await nextTick();
      expect(activeVisualEgg.value?.id).toBe('hishi_win');

      // Switch to a different tournament — overlay should clear
      tournament.value = makeTournament({ id: 't2', players, races: {} });
      await nextTick();
      expect(activeVisualEgg.value).toBeNull();
    });
  });

  // ── auto-hide timeout ──────────────────────────────────────────────────────

  it('auto-hides activeVisualEgg after the egg duration elapses', async () => {
    vi.useFakeTimers();
    const players = { p1: makePlayer('p1', 'Hishi Akebono') };
    const tournament = ref(makeTournament({ players, races: {} }));
    const { activeVisualEgg } = useEasterEgg(tournament);
    await nextTick(); // silent first load

    tournament.value = { ...tournament.value, races: { r1: makeRace('r1', { p1: 1 }) } };
    await nextTick();
    expect(activeVisualEgg.value?.id).toBe('hishi_win');

    // Advance past the egg's duration (hishi_win has duration 8000ms)
    await vi.advanceTimersByTimeAsync(8001);
    expect(activeVisualEgg.value).toBeNull();
    vi.useRealTimers();
  });
});
