import { describe, expect, it } from 'vitest';

import { TRACK_DICT } from './trackData';
import {
  getProjectedGroupCount,
  getProjectedPlayersPerGroup,
  getTrackCapacityWarning
} from './trackCapacity';

describe('trackCapacity', () => {
  describe('getProjectedGroupCount', () => {
    it('uses enough groups to keep standard events at 12 or fewer players per group', () => {
      expect(getProjectedGroupCount(9)).toBe(1);
      expect(getProjectedGroupCount(18)).toBe(2);
      expect(getProjectedGroupCount(27)).toBe(3);
      expect(getProjectedGroupCount(36)).toBe(3);
    });
  });

  describe('getProjectedPlayersPerGroup', () => {
    it('uses the largest projected group size instead of total registration count', () => {
      expect(getProjectedPlayersPerGroup(18, 6)).toBe(9);
      expect(getProjectedPlayersPerGroup(24, 8)).toBe(12);
      expect(getProjectedPlayersPerGroup(27, 9)).toBe(9);
      expect(getProjectedPlayersPerGroup(36, 12)).toBe(12);
    });
  });

  describe('getTrackCapacityWarning', () => {
    it('does not warn for 18 registered players when 6 captains create two groups on a 16-player track', () => {
      expect(getTrackCapacityWarning('sapporo-1200-turf-right', 18, 6)).toBeNull();
    });

    it('warns when even the standard 9/12 grouping would exceed a track limit', () => {
      TRACK_DICT['test-small-track'] = {
        id: 'test-small-track',
        location: 'Tokyo',
        surface: 'Turf',
        distance: 1600,
        distanceType: 'Mile',
        direction: 'left',
        maxPlayers: 8
      };

      expect(getTrackCapacityWarning('test-small-track', 27, 9)).toMatchObject({
        maxPlayers: 8,
        projectedPlayersPerGroup: 9,
        excessPlayers: 1,
        groupCount: 3
      });

      delete TRACK_DICT['test-small-track'];
    });
  });
});
