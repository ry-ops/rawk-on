# Rawk On — YouTube Video Brief (for fabric-forge/social)

**Goal:** Produce a short, punchy promo/demo video (~60s) for *Rawk On*, a Chrome
extension that saves songs from The Current's on-air playlist to a daily **TIDAL**
or **Spotify** playlist. Tone: indie/garage-rock energy, clean and modern — not
cheesy. Think "music-nerd tool made with taste."

- **Primary deliverable:** 1920×1080 (16:9), ~60 seconds, MP4 (H.264), 30fps.
- **Also export:** a 9:16 vertical cut (1080×1920) for Shorts, and a 30s trim.
- **Captions:** burned-in captions on by default (most viewers watch muted).

---

## Brand: colors

The Current's palette — black, red, white. Use these exact values:

| Token | Hex | Use |
|---|---|---|
| Black (bg) | `#0A0A0A` | primary background |
| Lifted black | `#151515` / `#1C1C1C` | cards, surfaces, radial-gradient center |
| The Current red | `#DA291C` | brand accent, CTAs, highlights |
| Red (bright) | `#E4382C` | hovers, gradient top |
| Red (deep) | `#B6261C` | gradient bottom, pressed |
| White | `#FFFFFF` | primary text, the metal-hand mark |
| Muted gray | `#A6A6A6` | secondary text |

- Backgrounds: near-black with a subtle top-down radial (`#1C1C1C → #0A0A0A`).
- Red is a **spotlight**, not a wash — use it on the logo tile, CTAs, the
  "Added" confirmation, and accents. Everything else stays black/white/gray.

## Brand: typography & motion

- **Type:** bold geometric sans (system-ui / Inter / Helvetica Now). Headlines
  heavy (800), tight tracking. Body 600.
- **Motion:** quick, confident cuts on the beat. Snappy ease-outs, subtle scale
  pops on clicks, a soft red glow/ripple on "Added." No spinny 3D, no cheesy
  transitions. Match the clean in-app feel.
- **The mark:** the white "metal hand" 🤘 is the hero logo. It can punch in,
  flick up, or stamp onto a red tile. Use it as a recurring beat.
- **Motif:** spinning **vinyl record** (black disc, red label) for music moments
  and transitions. Wipes can be a record spin or a "needle drop."

## Themes / story beats

1. **The feeling:** you hear a great song on The Current and want to keep it —
   before it's gone.
2. **One click:** hover a song → 🤘 Add → it's in your daily playlist.
3. **Whole hour:** one tap banks an entire hour block.
4. **Your service, your call:** TIDAL or Spotify, switchable anytime.
5. **Quietly private:** no accounts, no servers, no tracking.
6. **Rawk on.** Logo + CTA.

---

## Narration script (~60s)

> VO = voiceover. OST = on-screen text. Keep OST short and bold. For music, use the
> rotating royalty-free "radio dial" approach described in the **Music bed** section
> below (a new snippet per beat, joined by tuning-static SFX). Duck music under VO.

**[0:00–0:05] Cold open — hook**
- VISUAL: Black screen. A vinyl record spins up; the white metal hand stamps onto
  a red tile (the store icon forms). Quick.
- OST: `RAWK ON 🤘`
- VO: "You just heard the perfect song on The Current…"

**[0:05–0:12] The problem**
- VISUAL: A Current playlist page (use screenshot/demo art). A song scrolls past;
  a faint clock ticks.
- OST: `…don't let it slip by.`
- VO: "…the kind you'll forget the name of by tomorrow. Rawk On catches it."

**[0:12–0:24] One click**
- VISUAL: Zoom on a song card. Cursor hovers → the red-pilled **🤘 Add** button
  appears → click → soft red ripple → pill flips to **✓ Added** → a red toast
  slides up: *"Added Float On · 0.7s."* (Mirror `demo-vinyl.svg`.)
- OST: `Hover → click → saved.`
- VO: "Hover any song, click once, and it lands in a playlist on your own TIDAL
  or Spotify — stamped with today's date."

**[0:24–0:34] Whole hour**
- VISUAL: An hour header "9 AM–10 AM" with an **Add hour** button; tap it; a row
  of vinyl thumbnails fills in; red toast: *"Added 12 of 14."*
- OST: `Or bank a whole hour.`
- VO: "Caught a whole hour worth keeping? One tap grabs the entire block —
  duplicates skipped."

**[0:34–0:44] Switch services**
- VISUAL: The Settings screen (use screenshot-1 styling). Toggle TIDAL ↔ Spotify;
  the status dot glows red "Connected." Clean, instant.
- OST: `TIDAL or Spotify. Switch anytime.`
- VO: "Run TIDAL today, Spotify tomorrow — each keeps its own login and its own
  daily playlists. No re-auth, nothing to reset."

**[0:44–0:52] Private by design**
- VISUAL: Minimal animated diagram — a browser holds a small lock; arrows go ONLY
  to TIDAL/Spotify logos; a struck-through "analytics / servers / accounts."
- OST: `No servers. No tracking.`
- VO: "It's quietly private — no accounts, no servers, no analytics. Your login
  stays in your browser."

**[0:52–0:60] CTA / sign-off**
- VISUAL: The marquee promo composition resolves — red tile + **Rawk On**
  wordmark + tagline; metal hand flicks up. End card.
- OST: `Rawk On — free on the Chrome Web Store` · `github.com/ry-ops/rawk-on`
- VO: "Built by a listener, for listeners. Rawk on."

---

## Music bed — the "radio dial" approach

Instead of one continuous music bed, score the video as if you're **turning the
tuner dial across The Current** — each beat is a different *station* (a short
royalty-free snippet in a different genre), bridged by a quick **FM-static + dial
click** SFX. It mirrors the eclectic mix the extension is built for, and gives
each section its own energy.

- Use **5–6 short royalty-free snippets** (~6–12s each), genres rotating to echo
  The Current's spread: garage rock → dreamy indie → punchy alt → synth/electronic
  → folk/acoustic → anthemic rock (finale). Sources: YouTube Audio Library,
  Uppbeat, Pixabay Music, Free Music Archive — confirm license per track.
- **Transition SFX:** a 0.2–0.4s burst of tuning static + a soft "click/clunk"
  on each cut, as if landing on the next station. Keep it tight and on the beat.
- **Land clean on dialogue:** snap the static out the instant VO starts so the
  voice is always clear; duck music under VO throughout.
- **Finale:** for the CTA, let the last snippet (anthemic) ring out without a
  static cut — you've "found your station." Optional radio-off *click* on the very
  last frame.
- Keep tempos/keys loosely compatible so the dial-flips feel intentional, not
  jarring. Total: ~60s.

---

## Thumbnail / title / description (for the YouTube upload)

- **Thumbnail (1280×720):** black bg, oversized white metal hand on the red tile
  (left), bold white **"RAWK ON"** + small red **"The Current → TIDAL / Spotify"**
  (right). Reuse the marquee composition, recropped.
- **Title:** `Rawk On — save The Current's playlist to TIDAL or Spotify (Chrome extension)`
- **Description (starter):**
  > Rawk On adds songs from The Current's on-air playlist to a daily playlist on
  > your own TIDAL or Spotify — one click per track, or a whole hour at a time.
  > No accounts, no servers, no tracking.
  > Get it: <Chrome Web Store link once live>
  > Source & setup: https://github.com/ry-ops/rawk-on
  > Privacy: https://ry-ops.dev/privacy

---

## Reference assets on this Mac

Use these for exact colors, the logo, and recreating the UI. Paths are absolute.

**Logo / icon (the metal hand):**
- `/Users/ryandahlberg/Projects/rawk-on/src/assets/metal-hand.png` — black line-art
  hand on transparent (invert to white per brand).
- `/Users/ryandahlberg/Projects/rawk-on/docs/store/store-icon-128.png` — final red
  tile + white hand (the icon to "stamp" in the cold open).
- `/Users/ryandahlberg/Projects/rawk-on/public/icons/icon-128.png` (also 16/32/48).

**Vinyl motif:**
- `/Users/ryandahlberg/Projects/rawk-on/src/assets/default-album-art.png` — black
  record, red label, red square bg (the spinning-record motif).
- `/Users/ryandahlberg/Desktop/default-album-art.png` — same art (reference copy).

**UI to recreate / screen-record (the product in action):**
- `/Users/ryandahlberg/Projects/rawk-on/docs/demo-vinyl.svg` — **animated** demo of
  the Add / Add-hour / Added flow with toasts. Best single reference for the
  click→added interaction; can be rendered to video directly.
- `/Users/ryandahlberg/Projects/rawk-on/docs/store/screenshot-1-1280x800.png` — idle
  "Add" state, both panels (One track / A whole hour).
- `/Users/ryandahlberg/Projects/rawk-on/docs/store/screenshot-2-1280x800.png` —
  "Added" success state with red toasts.

**Promo compositions (for the end card / thumbnail):**
- `/Users/ryandahlberg/Projects/rawk-on/docs/store/promo-marquee-1400x560.png` —
  wide hero (red tile + wordmark + tagline + faded hand watermark).
- `/Users/ryandahlberg/Projects/rawk-on/docs/store/promo-small-440x280.png` —
  compact lockup.

**Optional B-roll:** screen-record the live extension on
`https://www.thecurrent.org/playlist/the-current` for authentic UI, and the
extension Settings page for the service-switch beat.

---

## Notes for the editor

- Keep the red **earned** — it should hit hardest on "✓ Added" and the final CTA.
- Sync clicks/added moments to the music's downbeats.
- Don't show real third-party album covers — use the branded **vinyl** as cover
  art (it's the in-product default and keeps us copyright-clean).
- The metal hand is the throughline: open on it, close on it.
- Accessibility: captions on; ensure red/white text meets contrast on black.
