# 🤘 Rawk On

Add songs from [The Current](https://www.thecurrent.org/playlist/the-current)'s
On-Air Playlist to **TIDAL** or **Spotify** — one track at a time, or a whole hour block at once.

![Rawk On — add a track, or a whole hour](docs/demo.svg)

A Chrome (Manifest V3) extension: hover a song card for a 🤘 **Add** pill, or use
**Add hour** in any hour header to bulk-capture that hour into its own playlist.

Manifest V3 · TypeScript · Vite · [CRXJS](https://crxjs.dev) · TIDAL & Spotify OAuth (PKCE).

## What it does

- **Add a track** — hover a card, click 🤘 **Add**. It searches your chosen service, matches on
  **title + artist + album**, and files the song in a daily playlist
  (`The Current - YYYY-MM-DD`), de-duped.
- **Add an hour** — click **Add hour** on a block (e.g. `9 AM–10 AM`) to bulk-add
  every song to its own playlist (`The Current - <date> · 9 AM–10 AM`).
- **Right song, not just the popular one** — candidates are scored on title +
  artist + album; if nothing matches the title, it adds *nothing* rather than the
  wrong track.
- **Resilient** — backs off and retries on rate limits (HTTP 429).
- **Your choice of service** — switch between TIDAL and Spotify anytime from Settings.

## Privacy / security

- **No client secret.** Auth is Authorization Code + PKCE (the public-client flow)
  for both TIDAL and Spotify. The only credential is the **client ID**, which is public by design.
- **Nothing sensitive in the bundle.** Client IDs are entered at runtime and
  kept in `chrome.storage.local`; OAuth tokens live there too (same risk profile
  as a logged-in session cookie). The shipped extension contains no secrets.

## Prerequisites

- Node 20+ and npm
- A developer app for whichever service(s) you want to use:
  - TIDAL — https://developer.tidal.com
  - Spotify — https://developer.spotify.com/dashboard

## Build & load

```bash
npm install
npm run build        # type-checks, then emits dist/
```

1. Go to `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → select the `dist/` folder.

(`npm run dev` runs an HMR dev server if you're iterating.)

## Connect your music service (one-time)

1. Click the extension icon → **Settings & login**.
2. Choose **TIDAL** or **Spotify** using the tab at the top.
3. **Copy the Redirect URI** shown (e.g. `https://<extension-id>.chromiumapp.org/`).
4. In the developer portal for your chosen service, open your app and
   add that exact URI to its **Redirect URIs**, then **Save**. Login fails until you do this.
5. Back in Settings, enter your **Client ID**, **Save**, then **Log in**.

A `key` is pinned in `manifest.config.ts`, so the extension ID — and thus the
redirect URI — stays constant across reloads and machines.

> The account you log in with at the consent screen is the one whose playlists get
> created — sign in with your **listening** account.

### Spotify-specific note

Spotify requires your app to be in "development mode" and explicitly add testers
until you apply for a quota extension. If you're the only user, just add your own
Spotify account as a tester in the developer dashboard.

## Use it

Open <https://www.thecurrent.org/playlist/the-current>:
- Hover a card → 🤘 **Add** (the toast shows the matched title + time).
- Click **Add hour** in any hour header → the whole hour lands in its own playlist.

## Debugging

`DEBUG = false` in `src/shared/config.ts` — flip to `true` to log every request
in the service-worker console (`chrome://extensions` → Rawk On → **service worker**).

- `await rawkSearch('artist title')` — in the **service-worker** console, prints
  the ranked results for a query using whichever provider is currently active.
- `__tidalPoolSelfTest()` — in the **page** console, checks the DOM selectors.

If the page DOM changes and buttons stop appearing, the selectors live in one
place: `src/content/selectors.ts`.

## Project layout

```
manifest.config.ts          MV3 manifest (CRXJS) — pinned key, icons, host_permissions
public/privacy.html         Privacy policy (host this and link from CWS listing)
docs/demo.svg               Animated README demo
src/
  shared/
    config.ts               TIDAL + Spotify endpoints, scopes, playlist naming
    match.ts                Shared scoring (norm, titleScore, artistScore, albumScore)
    settings.ts             Active provider + per-provider client IDs in storage
    types.ts                Shared types + message protocol
  background/
    provider.ts             MusicProvider interface
    tidal-provider.ts       TidalProvider — auth, search, playlist ops (JSON:API)
    spotify-provider.ts     SpotifyProvider — auth, search, playlist ops (REST)
    storage.ts              Token + playlist cache storage (provider-keyed)
    service-worker.ts       Message router → active provider
  content/
    main.ts                 Wire cards + hour headers, toasts
    selectors.ts            ⭐ DOM selectors (tune here if the page changes)
    extract.ts              Card → { title, artist, album, songId }
    ui.ts                   Add pill, Add-hour pill, toasts
  options/                  Settings hub — provider switcher, client ID, login
  popup/                    Quick status + open settings
```

## Chrome Web Store

To publish:
1. Host `public/privacy.html` somewhere and add the URL to your CWS listing.
2. Add at least one 1280×800 or 640×400 screenshot to the listing.
3. For the icon: the metal-hand icon is CC BY (Noun Project #1200426) — attribute
   the creator in your listing description, or purchase a Noun Project license.
4. Zip the `dist/` folder and upload to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## Credits

Metal-hand icon: [Noun Project #1200426](https://thenounproject.com/icon/metal-hand-1200426/)
(CC BY) — add creator attribution if you distribute publicly.
