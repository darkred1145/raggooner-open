import type { Track } from '../types';
import { TRACK_DICT } from './trackData';

export interface TrackCapacityInfo {
  trackName: string;
  maxPlayers: number;
  excessPlayers: number;
  projectedPlayersPerGroup: number;
  groupCount: number;
  warning: string;
}

const STANDARD_GROUP_MAX_PLAYERS = 12;

export function getProjectedGroupCount(currentPlayerCount: number): number {
  if (currentPlayerCount <= 0) return 1;
  return Math.max(1, Math.ceil(currentPlayerCount / STANDARD_GROUP_MAX_PLAYERS));
}

export function getProjectedPlayersPerGroup(
  currentPlayerCount: number,
  _captainCount: number
): number {
  if (currentPlayerCount <= 0) return 0;

  // Default policy: keep standard events at 9-12 players per group.
  // Large 15/18-player groups should only be allowed via an explicit format toggle later.
  const groupCount = getProjectedGroupCount(currentPlayerCount);
  return Math.ceil(currentPlayerCount / groupCount);
}

export function getTrackCapacityWarning(
  selectedTrackId: string | undefined,
  currentPlayerCount: number,
  captainCount: number
): TrackCapacityInfo | null {
  if (!selectedTrackId) return null;

  const track = TRACK_DICT[selectedTrackId];
  if (!track) return null;

  const groupCount = getProjectedGroupCount(currentPlayerCount);
  const projectedPlayersPerGroup = getProjectedPlayersPerGroup(currentPlayerCount, captainCount);

  if (projectedPlayersPerGroup <= track.maxPlayers) return null;

  const excess = projectedPlayersPerGroup - track.maxPlayers;
  return {
    trackName: track.location,
    maxPlayers: track.maxPlayers,
    projectedPlayersPerGroup,
    groupCount,
    excessPlayers: excess,
    warning: `This track can only handle ${track.maxPlayers} players per group, but your current setup would place up to ${projectedPlayersPerGroup} players in one group.`
  };
}

export function getSuitableTracks(playerCount: number): Track[] {
  return Object.values(TRACK_DICT).filter(track => track.maxPlayers >= playerCount);
}

export function getRecommendedTracks(playerCount: number): Track[] {
  const suitable = getSuitableTracks(playerCount);
  // Sort by capacity (closest to player count first)
  return suitable.sort((a, b) => a.maxPlayers - b.maxPlayers);
}

export interface TrackCapacityRange {
  min: number;
  max: number;
  name: string;
  tracks: Track[];
}

export function getTrackCapacityRanges(): TrackCapacityRange[] {
  const capacityGroups = [
    { min: 1, max: 14, name: 'Small (14 max)' },
    { min: 15, max: 16, name: 'Medium (16 max)' },
    { min: 17, max: 18, name: 'Large (18 max)' }
  ];

  return capacityGroups.map(group => ({
    min: group.min,
    max: group.max,
    name: group.name,
    tracks: Object.values(TRACK_DICT).filter(track => 
      track.maxPlayers >= group.min && track.maxPlayers <= group.max
    )
  }));
}
