import { describe, expect, it } from 'vitest';
import { computeSeasonTrueSkill, getTrueSkillEpithet } from './trueskill';

describe('trueskill', () => {
  it('rates winners above losers within a season', () => {
    const tournaments = [
      {
        id: 't1',
        name: 'Season Opener',
        status: 'completed',
        isOfficial: true,
        seasonId: 'season-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        playedAt: '2026-01-01T00:00:00.000Z',
        teams: [
          { id: 'a', captainId: 'p1', memberIds: [], inFinals: true, group: 'A', points: 30, finalsPoints: 0, name: 'A' },
          { id: 'b', captainId: 'p2', memberIds: [], inFinals: false, group: 'A', points: 18, finalsPoints: 0, name: 'B' },
        ],
        players: { p1: { id: 'p1', name: 'Alice' }, p2: { id: 'p2', name: 'Bob' } },
        races: {},
      },
      {
        id: 't2',
        name: 'Season Closer',
        status: 'completed',
        isOfficial: true,
        seasonId: 'season-1',
        createdAt: '2026-01-02T00:00:00.000Z',
        playedAt: '2026-01-02T00:00:00.000Z',
        teams: [
          { id: 'a2', captainId: 'p1', memberIds: [], inFinals: true, group: 'A', points: 30, finalsPoints: 0, name: 'A2' },
          { id: 'b2', captainId: 'p2', memberIds: [], inFinals: false, group: 'A', points: 18, finalsPoints: 0, name: 'B2' },
        ],
        players: { p1: { id: 'p1', name: 'Alice' }, p2: { id: 'p2', name: 'Bob' } },
        races: {},
      },
    ] as any;

    const result = computeSeasonTrueSkill(tournaments, 'season-1');

    const alice = result.ratings.get('p1');
    const bob = result.ratings.get('p2');

    expect(alice?.score).toBeGreaterThan(bob?.score ?? 0);
    expect(alice?.matches).toBe(2);
    expect(result.histories.get('p1')).toHaveLength(2);
  });

  it('ignores unofficial and cross-season tournaments', () => {
    const tournaments = [
      {
        id: 't1',
        name: 'Official',
        status: 'completed',
        isOfficial: true,
        seasonId: 'season-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        teams: [{ id: 'a', captainId: 'p1', memberIds: [], inFinals: true, group: 'A', points: 30, finalsPoints: 0, name: 'A' }],
        players: { p1: { id: 'p1', name: 'Alice' } },
        races: {},
      },
      {
        id: 't2',
        name: 'Unofficial',
        status: 'completed',
        isOfficial: false,
        seasonId: 'season-1',
        createdAt: '2026-01-02T00:00:00.000Z',
        teams: [{ id: 'b', captainId: 'p2', memberIds: [], inFinals: true, group: 'A', points: 30, finalsPoints: 0, name: 'B' }],
        players: { p2: { id: 'p2', name: 'Bob' } },
        races: {},
      },
      {
        id: 't3',
        name: 'Wrong Season',
        status: 'completed',
        isOfficial: true,
        seasonId: 'season-2',
        createdAt: '2026-01-03T00:00:00.000Z',
        teams: [{ id: 'c', captainId: 'p3', memberIds: [], inFinals: true, group: 'A', points: 30, finalsPoints: 0, name: 'C' }],
        players: { p3: { id: 'p3', name: 'Carol' } },
        races: {},
      },
    ] as any;

    const result = computeSeasonTrueSkill(tournaments, 'season-1');

    expect(result.ratings.has('p1')).toBe(true);
    expect(result.ratings.has('p2')).toBe(false);
    expect(result.ratings.has('p3')).toBe(false);
  });

  it('returns provisional epithet before three matches', () => {
    expect(getTrueSkillEpithet(1400, 1)).toBe('Provisional');
    expect(getTrueSkillEpithet(1400, 3)).toBe('Legend');
  });
});
