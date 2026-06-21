# Tidal Pool

Hover a song on [The Current](https://www.thecurrent.org/playlist/the-current)'s
playlist and add it to a daily TIDAL playlist (`The Current - YYYY-MM-DD`), with
automatic find-or-create and de-duplication.

Manifest V3 · TypeScript · Vite · [CRXJS](https://crxjs.dev) · TIDAL OAuth (PKCE).

## How it works

```
Hover a song row  →  [➕ TIDAL] button  →  background worker:
  search TIDAL for "artist title"
  find-or-create today's playlist (cached by date)
  skip if already present, else add
  →  toast: "Added to TIDAL"
```

- **No client secret.** Auth is Authorization Code + PKCE, the public-client
  flow. The only credential is the **client ID**, which is public by design.
- **Nothing sensitive in the bundle.** The client ID is entered at runtime and
  stored in `chrome.storage.local`; OAuth tokens live there too (same risk
  profile as a logged-in session cookie). The shipped extension contains no
  secrets.

## Prerequisites

- Node 20+ and npm
- A TIDAL developer application — https://developer.tidal.com

## Build

```bash
npm install
npm run build      # type-checks, then emits dist/
npm run dev        # optional: HMR dev server
```

## Load it in Chrome

1. `npm run build`
2. Go to `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select the `dist/` folder.
4. Note the extension ID Chrome assigns (stays constant while the unpacked
   folder path is constant).

## Connect TIDAL (one-time)

1. Click the extension icon → **Settings & login** (opens the options page).
2. **Copy the Redirect URI** shown there. It looks like:
   `https://<extension-id>.chromiumapp.org/`
3. In the [TIDAL developer portal](https://developer.tidal.com), open your app
   and add that exact URI to its **allowed redirect URIs**. TIDAL requires
   redirect URIs to be HTTPS, non-localhost, no query params — the Chrome URI
   satisfies all three.
4. Back on the options page, paste your **Client ID** (a default is pre-filled)
   and **Save**.
5. Click **Log in to TIDAL**, approve the consent screen. The status dot turns
   green.

## Use it

Open a playlist, e.g. https://www.thecurrent.org/playlist/the-current, hover a
song, and click **➕ TIDAL**. A toast confirms the add (or tells you it was
already in today's playlist).

## Tuning the playlist selectors

The Current renders its playlist with JavaScript, so the exact CSS class names
can change. If the **➕** button doesn't appear, or it can't read a song:

1. Open a playlist page, open DevTools console.
2. Run `__tidalPoolSelfTest()`. It reports how many rows matched and what
   title/artist it extracted from the first few.
3. Edit `src/content/selectors.ts` → `SELECTORS.row` / `.title` / `.artist`
   with the real selectors (inspect a row in DevTools to find them).
4. `npm run build`, then reload the extension at `chrome://extensions`.

## Things that may need a live smoke test

These could not be verified without an approved TIDAL app + live login. All are
isolated in one or two files, and `DEBUG = true` in `src/shared/config.ts` logs
every request/response in the service-worker console (`chrome://extensions` →
the extension → **service worker**):

- **OAuth endpoints** — `authorizeUrl` / `tokenUrl` in `src/shared/config.ts`.
- **Scope names** — `scopes` in `src/shared/config.ts`. If consent rejects one,
  trim the list. (Older TIDAL apps used `r_usr w_usr`.)
- **API request/response shapes** — search, create-playlist, list-items, and
  add-items in `src/background/tidal-api.ts` follow TIDAL's Open API v2 JSON:API
  style. Adjust field paths there if the live responses differ.

## Project layout

```
manifest.config.ts          MV3 manifest (CRXJS)
src/
  shared/
    config.ts               endpoints, scopes, DEBUG, playlist naming
    settings.ts             client ID in chrome.storage.local
    types.ts                shared types + message protocol
  background/
    service-worker.ts       message router
    auth.ts                 PKCE login / refresh / logout
    tidal-api.ts            search · find-or-create · dedup · add
    storage.ts              tokens + per-day playlist-id cache
  content/
    main.ts                 observe rows, inject button, toast
    selectors.ts            ⭐ tune these against the live DOM
    extract.ts              row → { title, artist }
    ui.ts                   hover button + toast styles
  options/                  settings + login hub
  popup/                    quick status + open settings
```

## Publishing later (optional)

For a stable extension ID (and thus a stable redirect URI) across machines, add
a `key` to `manifest.config.ts`. Generate one per the
[Chrome docs](https://developer.chrome.com/docs/extensions/reference/manifest/key-permissions),
register the resulting `chromiumapp.org` redirect URI in TIDAL, and rebuild.
```
