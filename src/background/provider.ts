import type { TrackInfo, AddTrackResult, AddHourResult, SearchDebugResult } from '../shared/types.ts'

export interface MusicProvider {
  readonly id: 'tidal' | 'spotify'
  readonly label: string

  // Auth
  login(): Promise<void>
  logout(): Promise<void>
  isConnected(): Promise<boolean>
  redirectUri(): string

  // Music ops
  addTrack(track: TrackInfo): Promise<AddTrackResult>
  addHour(date: string, hourLabel: string, tracks: TrackInfo[]): Promise<AddHourResult>
  searchDebug(query: string): Promise<SearchDebugResult>
}
