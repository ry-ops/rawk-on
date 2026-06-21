export interface TrackInfo {
  title: string
  artist: string
  /** Album, when the card exposes it — improves TIDAL match accuracy. */
  album?: string
  /** The Current's own song_id (from the /song/ link), for stable dedup. */
  currentSongId?: string
}

export interface Tokens {
  accessToken: string
  refreshToken: string
  /** Epoch ms when the access token expires. */
  expiresAt: number
}

export interface AuthState {
  connected: boolean
  /** Display name / id of the connected user, if known. */
  user?: string
}

// ── Messages: content/popup → background ────────────────────────────────────

export type Message =
  | { type: 'ADD_TRACK'; track: TrackInfo }
  | { type: 'GET_AUTH_STATE' }
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'GET_REDIRECT_URI' }
  | { type: 'SEARCH_DEBUG'; query: string }

export interface SearchHit {
  rank: number
  id: string
  title?: string
  artists?: string
  album?: string
}
export type SearchDebugResult =
  | { ok: true; query: string; count: number; top: SearchHit[] }
  | { ok: false; error: string }

export type AddTrackResult =
  | {
      ok: true
      status: 'added' | 'duplicate'
      playlistId: string
      playlistUrl?: string
      matched: TrackInfo
      /** Title of the TIDAL track we actually matched (so mismatches show). */
      matchedTitle?: string
      /** End-to-end time for the add, in ms. */
      ms: number
    }
  | { ok: false; error: string; needsAuth?: boolean }

export type AuthResult =
  | { ok: true; state: AuthState }
  | { ok: false; error: string }

export type RedirectUriResult = { redirectUri: string }
