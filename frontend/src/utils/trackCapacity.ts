import type { Track } from '../types';
import { TRACK_DICT } from './trackData';

export interface TrackCapacityInfo {
  trackName: string;
  maxPlayers: number;
  excessPlayers: number;
  warning: string;
}

export function getTrackCapacityWarning(
  selectedTrackId: string | undefined,
  currentPlayerCount: number
): TrackCapacityInfo | null {
  if (!selectedTrackId) return null;
  
  const track = TRACK_DICT[selectedTrackId];
  if (!track) return null;
  
  if (currentPlayerCount <= track.maxPlayers) return null;
  
  const excess = currentPlayerCount - track.maxPlayers;
  return {
    trackName: track.location,
    maxPlayers: track.maxPlayers,
    excessPlayers: excess,
    warning: `This track can only handle ${track.maxPlayers} players, but you have ${currentPlayerCount} registered.`
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
