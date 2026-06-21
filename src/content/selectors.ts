// ─────────────────────────────────────────────────────────────────────────────
// Selectors for thecurrent.org playlist cards, verified against the rendered
// DOM (June 2026). Each entry is a list of candidates tried in order, so the
// first (real) one wins but we degrade gracefully if the markup shifts.
//
// Real structure of one card:
//   <li class="playlist-card">
//     <h4 class="playlist-title"><a href="/song/the-current/86497">My Dad</a></h4>
//     <div class="playlist-artist"><a>Paul Westerberg</a></div>   ← artist (1st)
//     <div class="playlist-artist"><a>Folker</a></div>            ← album  (2nd)
//     <div class="playlist-time">10:01 am</div>
//   </li>
//
// Tune by running __tidalPoolSelfTest() in the page console.
// ─────────────────────────────────────────────────────────────────────────────

export const SELECTORS = {
  // A single song card.
  row: ['li.playlist-card', '[class*="playlist-card"]'],
  // Track title.
  title: ['.playlist-title', 'h4[class*="title"]'],
  // ALL artist/album lines — the FIRST is the artist, the SECOND (if any) is
  // the album. extract.ts relies on this ordering.
  artistLines: ['.playlist-artist', '[class*="playlist-artist"]'],
  // The per-song link, e.g. /song/the-current/86497 — the trailing number is
  // The Current's song_id (also present in the JSON API).
  songLink: ['a[href*="/song/"]'],
} as const

/** First element matching any candidate selector, or null. */
export function pick(
  root: ParentNode,
  candidates: readonly string[],
): HTMLElement | null {
  for (const sel of candidates) {
    const el = root.querySelector<HTMLElement>(sel)
    if (el) return el
  }
  return null
}

/** All elements matching the first candidate selector that matches anything. */
export function pickAll(
  root: ParentNode,
  candidates: readonly string[],
): HTMLElement[] {
  for (const sel of candidates) {
    const els = root.querySelectorAll<HTMLElement>(sel)
    if (els.length) return Array.from(els)
  }
  return []
}
