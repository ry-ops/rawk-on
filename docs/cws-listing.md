# Chrome Web Store listing — copy & answers

Ready-to-paste content for the CWS Developer Dashboard. Upload package:
**`rawk-on-v1.0.1.zip`** (repo root, from `npm run build` → zipped `dist/`).

> ⚠️ **Redirect URI / extension ID:** the *published* extension ID is assigned by
> the store and differs from the dev ID (`cdimphoionaa…`). Users copy the live
> redirect URI from the extension's **Settings** page at runtime and paste it into
> their TIDAL/Spotify dev app — the setup docs already cover this. No listing change
> needed, just be aware the example URI in older docs is the dev one.

---

## Store listing tab

**Name**
```
Rawk On
```

**Summary** (short description, ≤132 chars)
```
Hover a song on The Current's playlist and add it to a daily TIDAL or Spotify playlist — one track, or a whole hour.
```

**Category**
```
Entertainment
```

**Language**
```
English (United States)
```

**Detailed description**
```
Rawk On turns The Current's on-air playlist into your daily playlist on TIDAL or Spotify.

Open a Current playlist page (thecurrent.org), hover any song, and a 🤘 "Add" pill
appears — one click drops that track into a dated playlist on the service you've
connected. Want the whole hour? Each hour block gets an "Add hour" button that adds
every song at once, skipping anything already there.

FEATURES
• Add one track, or a whole hour block, in a click.
• Works with TIDAL or Spotify — switch anytime, no re-login.
• Daily playlists, named by date, so each day's listening stays its own.
• Smart matching with a clear toast showing exactly what landed (and the time).
• Duplicate-aware: a song already in today's playlist won't be added twice.

PRIVATE BY DESIGN
Rawk On has no servers, no accounts, and no analytics. Your login tokens stay in your
browser (chrome.storage.local) and the extension talks only to the music service you
choose. Full policy: https://ry-ops.github.io/rawk-on/privacy.html

SETUP (one-time)
Because Rawk On uses your own developer credentials, you'll create a free developer app
on TIDAL or Spotify and paste a public Client ID into Settings. Step-by-step guides:
https://github.com/ry-ops/rawk-on

———
Icon: "Metal Hand" by Berkah Icon from the Noun Project.
```

> Replace `https://ry-ops.github.io/rawk-on/privacy.html` with the hosted privacy.html URL once it's live.

---

## Privacy tab

**Single purpose**
```
Rawk On adds songs from The Current's on-air playlist to a daily playlist on the user's
own TIDAL or Spotify account.
```

**Permission justifications**

| Permission | Justification |
|---|---|
| `storage` | Persist the user's Client ID, OAuth tokens, and which service is active, locally in the browser. |
| `identity` | Open the TIDAL/Spotify OAuth login window via Chrome's identity API (PKCE). |
| `host: www.thecurrent.org` | Inject the "Add" / "Add hour" buttons onto the playlist page the user is viewing. |
| `host: openapi.tidal.com, auth.tidal.com, login.tidal.com` | Authenticate with TIDAL and add tracks to the user's playlists. |
| `host: api.spotify.com, accounts.spotify.com` | Authenticate with Spotify and add tracks to the user's playlists. |

**Remote code:** No — all code is bundled in the package; nothing is loaded remotely.

**Data usage / privacy practices** (check these in the form)
- Does NOT collect or use data for: analytics, advertising, personalization, credit, sale.
- The only stored items (client ID, OAuth tokens, settings, a daily playlist-ID cache)
  live in `chrome.storage.local` on the user's device and are never sent to the developer.
- Authentication and playlist data are exchanged **directly** with TIDAL/Spotify under
  their own privacy policies.
- Certify: not selling data, not using it for unrelated purposes, not for creditworthiness.

**Privacy policy URL**
```
https://ry-ops.github.io/rawk-on/privacy.html
```
*(Live once the repo is public + the Pages workflow has run. Confirm it loads before submitting.)*

---

## Assets still needed before submit
- [ ] **Privacy policy hosted** at a public URL → fill `https://ry-ops.github.io/rawk-on/privacy.html` above.
- [ ] **Screenshots** — at least one 1280×800 or 640×400 PNG/JPEG. Best captured from
      the live extension on a Current playlist page (the Add pill + a success toast),
      plus the Settings page.
- [ ] *(optional)* 440×280 promo tile.
