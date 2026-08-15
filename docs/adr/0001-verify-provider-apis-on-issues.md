# ADR 0001: Verify Spotify/TIDAL API surface first when Rawk On misbehaves

## Status

Accepted — 2026-08-15

## Context

Rawk On depends on two undocumented-for-our-purposes, third-party Web APIs
(Spotify Web API, TIDAL Open API) that have each silently broken the
extension at least once by retiring or redirecting an endpoint we called
directly, with no deprecation warning surfaced to us other than a new HTTP
status code:

- **TIDAL** retired `/searchResults/{query}` (query-as-path-param search).
  Calls started failing; the fix (v1.1.2) was switching to
  `/searchSuggestions?filter[query]=...&include=directHits,...` — see
  `src/background/tidal-provider.ts`, `searchTrackId()`.
- **Spotify** deprecated `POST /users/{id}/playlists` (403) in favor of
  `POST /me/playlists`, and deprecated the `/playlists/{id}/tracks` add
  endpoint (403) in favor of `/playlists/{id}/items` — see
  `src/background/spotify-provider.ts`, `createPlaylist()` / `addItems()`.

Both breakages presented the same way: playlist search or writes started
failing (some with a 403 that read like an auth bug rather than an endpoint
change), while other parts of the extension kept working. Each time, the
root cause was diagnosed by re-reading the current provider API docs and
comparing them against the endpoints hardcoded in `tidal-provider.ts` /
`spotify-provider.ts`, not by guessing at token/auth issues first.

## Decision

Whenever a Rawk On bug report involves Spotify or TIDAL not working
(search misses, playlist creation fails, add-to-playlist fails, unexpected
401/403/404), **verify the provider's current API surface before assuming
the bug is in our code**:

1. **Reproduce with the built-in diagnostic first.** Both providers expose
   `searchDebug()` (wired to `chrome.runtime` message `SEARCH_DEBUG` and to
   `rawkSearch(query)` in the service-worker console — see
   `src/background/service-worker.ts`). Run it against the failing
   query/provider before touching provider code, to isolate search from
   playlist-write failures.
2. **Distinguish auth failures from endpoint failures.** A 401 from our
   `api()` wrapper throws `NeedsAuthError` (session expired — re-login is
   the fix). A 403/404 on an endpoint we haven't changed recently is a
   signal the endpoint itself moved or its contract changed, not that
   auth is broken — don't chase token/scope issues first for those codes.
3. **Check the endpoints we actually call** against the live API reference
   before changing code:
   - TIDAL Open API reference (developer.tidal.com) — confirm
     `TIDAL.apiBase` paths used in `tidal-provider.ts`
     (`/searchSuggestions`, `/playlists`,
     `/playlists/{id}/relationships/items`) are still current.
   - Spotify Web API reference (developer.spotify.com) — confirm
     `SPOTIFY.apiBase` paths used in `spotify-provider.ts` (`/search`,
     `/me/playlists`, `/playlists/{id}/items`) are still current.
   Both providers version and retire endpoints without notifying
   integrators; a changelog/announcement search for the failing endpoint
   name is often faster than trawling the full reference.
4. **Confirm subscription-tier requirements haven't changed.** Both APIs
   gate playlist writes behind a paid plan (see README "Prerequisites").
   If only writes fail and reads/search succeed, tier/entitlement is worth
   ruling out alongside endpoint drift.
5. **Only after 1–4 rule out an API-surface change**, treat the failure as
   an extension bug (matching logic in `src/shared/match.ts`, storage
   caching in `src/background/storage.ts`, etc.).
6. **Record the fix.** Endpoint changes get a one-line code comment at the
   call site (see the two existing examples above) and a README changelog
   entry, so the next person hitting the same symptom finds the answer
   without re-deriving it.

## Consequences

- Faster triage: API-surface drift is checked first, before auth/token
  state or extension logic, since it has been the actual root cause both
  times this class of bug has occurred.
- `rawkSearch()` / `searchDebug()` stays a supported, load-bearing
  diagnostic — don't remove it as dead code; it's the fastest way to
  isolate search-layer failures from playlist-write failures.
- Provider API references are external and can drift further; this ADR
  doesn't pin specific endpoint paths as permanent — those live in the
  provider source files and their inline comments, which are the source
  of truth for "what we currently call."
