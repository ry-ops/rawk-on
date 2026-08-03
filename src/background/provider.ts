import type { TrackInfo, AddTrackResult, AddHourResult, SearchDebugResult, StreamInfo } from '../shared/types.ts'

export interface MusicProvider {
  readonly id: 'tidal' | 'spotify'
  readonly label: string

  // Auth
  login(): Promise<void>
  logout(): Promise<void>
  isConnected(): Promise<boolean>
  redirectUri(): string

  // Music ops
  addTrack(track: TrackInfo, stream: StreamInfo): Promise<AddTrackResult>
  addHour(date: string, hourLabel: string, tracks: TrackInfo[], stream: StreamInfo): Promise<AddHourResult>
  searchDebug(query: string): Promise<SearchDebugResult>
}
