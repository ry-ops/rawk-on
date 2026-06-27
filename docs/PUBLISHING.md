# Publishing Rawk On

Roadmap for shipping the extension to the **Chrome Web Store** and (later) the
**Mac/iOS App Store** (Safari Web Extension).

## Decision: credentials model — **A, bring-your-own** (chosen)

Each user creates their **own** Spotify/Tidal developer app and pastes a client ID.
No shared app, no Extended Quota application, shippable today. Trade-off: onboarding
friction is high, so **clear per-provider setup docs are essential** (Phase 1).

> If onboarding friction proves too high post-launch, revisit Model B (one shared
> app per service + Extended Quota Mode → users just click "Log in"). That's an
> architecture change and requires provider approval; out of scope for v1.

---

## Phase 0 — Store-agnostic prep (serves both stores)

- [ ] **Fix manifest `description`** — currently TIDAL-only ("add it to a daily
      TIDAL playlist"); should mention TIDAL **and** Spotify.
- [ ] **Clean stale comment** in `manifest.config.ts` (top comment says "No key is
      pinned" but a key *is* pinned).
- [ ] **Icon licensing** — metal-hand is Noun Project #1200426 (**CC BY**). Either
      attribute the creator in every store listing, buy a Noun Project license, or
      commission/replace the icon. Required before public distribution.
- [ ] **Host the privacy policy** — `public/privacy.html` needs a public URL
      (Cloudflare Pages is a good fit). Both stores require a privacy policy link.
- [ ] **Screenshots / promo art** — at least one 1280×800 or 640×400; a 440×280
      promo tile for CWS helps. None exist yet (`docs/demo.svg` is README-only).
- [ ] **Version** — bump `0.1.0` → `1.0.0` for first release (manifest + package.json).

## Phase 1 — User-facing provider setup docs (essential for Model A)

Write step-by-step guides; link from README **and** the extension's Settings page.

- [ ] `docs/setup-spotify.md`
  - Create app at developer.spotify.com/dashboard
  - Add the **Redirect URI** shown in Settings (per-user, per published extension ID)
  - **App owner must have Spotify Premium** (else Web API is blocked)
  - **User Management** → add your listening account (name + email) — required for
    write operations (creating playlists / adding tracks), else `403 Forbidden`
  - Paste the Client ID into Settings → Save → Log in
- [ ] `docs/setup-tidal.md`
  - Create app at developer.tidal.com/dashboard
  - Add the Redirect URI from Settings
  - Scopes: `playlists.read`, `playlists.write`, `collection.*`, `search.read`
  - Paste the Client ID → Save → Log in
- [ ] Link both from README "Connect your music service" and from `credNote` in
      `options/index.html` (the per-provider hint text).

## Phase 2 — Chrome Web Store

- [ ] Register a CWS developer account (one-time **$5**).
- [ ] Build + zip `dist/` (`npm run build`).
- [ ] Listing: name, detailed description, category, language, screenshots, promo tile.
- [ ] **Privacy practices form:** stores OAuth tokens + client IDs in
      `chrome.storage.local`; **no remote servers**; no data sale. Justify each
      permission: `storage`, `identity`, and the 6 host permissions
      (thecurrent.org + tidal/spotify auth + api domains).
- [ ] **Single-purpose** statement.
- [ ] ⚠️ **Redirect URI:** the *published* extension ID differs from the dev ID
      (`cdimphoionaa…`), so the OAuth redirect URI changes. Under Model A users copy
      it from Settings at runtime (still works) — but update README's example URI and
      note this in the setup docs.
- [ ] Submit → review (typically a few days) → publish.

## Phase 3 — Safari / Mac (+ iOS) App Store

- [ ] ⚠️ **Prototype the OAuth flow on Safari FIRST.** Safari supports
      `browser.identity.launchWebAuthFlow`, but its redirect URL format differs from
      Chrome's `chromiumapp.org`. If PKCE doesn't round-trip, this is real rework —
      de-risk before investing in the rest.
- [ ] Apple Developer Program (**$99/year**), a Mac, Xcode.
- [ ] Convert: `xcrun safari-web-extension-converter dist/` → Xcode project (macOS,
      optionally iOS).
- [ ] Build, sign, **notarize**, submit; privacy nutrition labels + screenshots.
- [ ] Maintain the generated Xcode project alongside the web extension.

---

## Open items / risks

- **Icon license** (CC BY) — gate for both stores.
- **Safari OAuth** — unverified; prototype before committing to Track B.
- **Onboarding friction** (Model A) — mitigated by Phase 1 docs; watch post-launch.
- **Published vs dev extension ID** — redirect URI changes on publish; docs must
  tell users to copy the *runtime* value from Settings, not a hardcoded example.

## Cost summary

| | Chrome Web Store | Mac/iOS App Store |
|---|---|---|
| Fee | $5 one-time | $99/year |
| Review | ~days | ~days–weeks |
| OAuth | works today | **needs prototype** |
