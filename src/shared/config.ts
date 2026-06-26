// ─────────────────────────────────────────────────────────────────────────────
// Central config. Everything that might need tuning against the live TIDAL API
// lives here so you only edit one file.
//
// The client ID is PUBLIC and safe to ship. There is intentionally NO client
// secret: a Chrome extension is a "public client" and the Authorization Code +
// PKCE flow does not require one. (TIDAL only needs a secret for the no-user
// "client credentials" flow, which this extension never uses.)
// ─────────────────────────────────────────────────────────────────────────────

export const TIDAL = {
  clientId: '0xURt22Z3puWuGDZ',

  // OAuth endpoints. Verify against developer.tidal.com if auth fails.
  authorizeUrl: 'https://login.tidal.com/authorize',
  tokenUrl: 'https://auth.tidal.com/v1/oauth2/token',

  // API base (TIDAL Open API v2, JSON:API style).
  apiBase: 'https://openapi.tidal.com/v2',
  countryCode: 'US',

  // Scopes for reading the user and writing playlists. If the consent screen
  // rejects a scope, trim this list to what your app is approved for. Older
  // TIDAL apps used `r_usr w_usr` instead — swap if needed.
  scopes: [
    'user.read',
    'collection.read',
    'collection.write',
    'playlists.read',
    'playlists.write',
    'search.read',
  ],
} as const

// Flip on to log every TIDAL request/response in the service worker console.
// Invaluable for the first live smoke test — the response shapes below are the
// most likely thing to need adjusting.
export const DEBUG = false

// Playlist naming: "The Current - 2026-06-21"
export function dailyPlaylistName(isoDate: string): string {
  return `The Current - ${isoDate}`
}

// Local date (not UTC) as YYYY-MM-DD, so the playlist matches the listener's day.
export function localISODate(d: Date): string {
  const tzOffsetMs = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10)
}
