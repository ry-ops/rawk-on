# Chrome Web Store listing — copy & answers

Ready-to-paste content for the CWS Developer Dashboard. Upload package:
**`rawk-on-v1.1.1.zip`** (repo root). Build it with **`npm run pack`** — that runs
the build and strips the manifest `key` (the store rejects uploads containing
`key`; we only pin it for a stable dev ID). Do **not** upload a plain
`npm run build` zip, or you'll get *"key field is not allowed in manifest."*

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
Catch songs from The Current's family of streams and save them to a daily TIDAL or Spotify playlist - one click, or a whole hour.
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

(written as one line per paragraph on purpose — hard-wrapping this text plus
its em dashes/curly quotes is what mangled it in chat; paste each paragraph
below as-is and let the CWS form do its own wrapping)

```
That song The Current just played? The one you meant to remember? Rawk On catches it before the next track buries it.

Rawk On adds a little to every stream in The Current's family - The Current, Radio Heartland, Local Current, Purple Current, The Siren, Teenage Kicks, Ritmofonica, Rock the Cradle, and more - plus sister station Carbon Sound. Hover any song on its playlist page and an "Add" pill appears - one click files it into a playlist on your own TIDAL or Spotify, stamped with today's date. Hear a whole hour worth keeping? Tap "Add hour" and the entire block lands at once, with anything you already saved quietly skipped.

Every stream gets its own playlist for every day, so a Tuesday afternoon on Radio Heartland never blurs into a Friday night on The Current. And because it names tracks by what actually landed - with a quick toast confirming the match - you're never guessing whether the right version made it in.

Run TIDAL today and Spotify tomorrow? Flip between them anytime. Each service keeps its own login and its own daily playlists, so there's no re-authenticating and nothing to reset when you switch.

WHY YOU'LL KEEP IT
- Hover, click, saved - no copy-pasting song titles into a search box.
- Works across all of The Current's streams, plus Carbon Sound.
- Bank a whole hour in a single tap.
- TIDAL or Spotify, switchable on a whim.
- A fresh, dated playlist for every stream you listen to.
- Duplicate-aware, with a toast that shows exactly what was added.

QUIETLY PRIVATE
No accounts. No servers. No analytics. No tracking. Your login stays in your browser and Rawk On only ever talks to the music service you connected - it uses OAuth (PKCE), so the only thing you paste in is a public client ID, never a password.
Full policy: https://ry-ops.dev/privacy

ONE-TIME SETUP
Rawk On runs on your own free developer credentials. Create a developer app on TIDAL or Spotify, paste the client ID into Settings, and you're set. Walkthroughs for both:
https://github.com/ry-ops/rawk-on

Built by a listener, for listeners. Rawk on.

---
Icon: "Metal Hand" by Berkah Icon from the Noun Project.
```

> Privacy URL is `https://ry-ops.dev/privacy` — **live and verified**; it includes a
> "Rawk On (browser extension)" section under Product-specific disclosures.

---

## Privacy tab

**Single purpose**
```
Rawk On adds songs from The Current's family of streams (and Carbon Sound) to a daily,
per-stream playlist on the user's own TIDAL or Spotify account.
```

**Permission justifications**

| Permission | Justification |
|---|---|
| `storage` | Persist the user's Client ID, OAuth tokens, and which service is active, locally in the browser. |
| `identity` | Open the TIDAL/Spotify OAuth login window via Chrome's identity API (PKCE). |
| `webNavigation` | Detect the redirect back from TIDAL's login page (opened in a normal tab so its bot-protection challenge can run) and capture the OAuth code, since `chrome.identity.launchWebAuthFlow`'s isolated popup can't clear that challenge. |
| `host: www.thecurrent.org` | Inject the "Add" / "Add hour" buttons onto whichever of The Current's stream playlist pages the user is viewing. |
| `host: www.carbonsound.fm` | Same, for Carbon Sound's playlist page (a sister MPR stream using the same template). |
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
https://ry-ops.dev/privacy
```
*(Hosted on the ry-ops.dev site; content lives in `public/privacy.html`. Confirm it loads before submitting.)*

---

## Assets — all ready
- [x] **Repo public** — done (secret scan came back clean).
- [x] **Privacy policy live** at `https://ry-ops.dev/privacy` — verified; includes a
      "Rawk On (browser extension)" section.
- [x] **Package** — `rawk-on-v1.1.1.zip` built with `npm run pack` (no manifest `key`).
- [x] **Screenshots** — two 1280×800 24-bit PNGs (no alpha) in `docs/store/`
      (`screenshot-1`, `screenshot-2`).
- [x] **Store icon** — `docs/store/store-icon-128.png` (128×128).
- [x] **Small promo tile** — `docs/store/promo-small-440x280.png` (440×280, no alpha).
- [x] **Marquee promo tile** — `docs/store/promo-marquee-1400x560.png` (1400×560, no alpha).
