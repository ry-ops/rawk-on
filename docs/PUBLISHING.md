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

- [x] **Fix manifest `description`** — now mentions TIDAL **and** Spotify (also
      synced `package.json`).
- [x] **Clean stale comment** in `manifest.config.ts` (removed the contradictory
      "No key is pinned" block).
- [x] **Icon licensing** — Noun Project #1200426 "Metal Hand" by **Berkah Icon**,
      **CC BY**. Decision: attribute (no purchase). Attribution string:
      **"Metal Hand by Berkah Icon from the Noun Project."** Added to README credits;
      must also appear in each store listing description (see Phase 2).
- [~] **Privacy policy** — `public/privacy.html` is **written and current** (covers
      TIDAL + Spotify, brand-themed). Canonical URL: **https://ry-ops.dev/privacy/rawk-on**.
      Deploy the content there and confirm it loads before submitting.
- [x] **Screenshots / promo art** — two 1280×800 PNGs in `docs/store/`
      (`screenshot-1`, `screenshot-2`). 440×280 promo tile still optional.
- [ ] **Version** — bump `0.1.0` → `1.0.0` for first release (manifest + package.json).

## Phase 1 — User-facing provider setup docs (essential for Model A)

Write step-by-step guides; link from README **and** the extension's Settings page.

- [x] `docs/setup-spotify.md` — create app, redirect URI, **owner Premium**,
      **User Management allowlist**, client ID, troubleshooting table.
- [x] `docs/setup-tidal.md` — create app, redirect URI, scopes, client ID,
      troubleshooting table.
- [x] Linked from README "Connect your music service" + Spotify notes, and from the
      Settings page (per-provider "Setup guide ↗" link via `PROVIDER_META.guide`).

## Phase 2 — Chrome Web Store

- [ ] Register a CWS developer account (one-time **$5**).
- [ ] Build + zip `dist/` (`npm run build`).
- [ ] Listing: name, detailed description, category, language, screenshots, promo tile.
- [ ] **Icon attribution in the listing description (required):** `Metal Hand by Berkah Icon from the Noun Project.`
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
