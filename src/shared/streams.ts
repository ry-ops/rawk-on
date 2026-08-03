// ─────────────────────────────────────────────────────────────────────────────
// The Current's family of streams (thecurrent.org/listen/streams) plus Carbon
// Sound, a sister MPR site that renders the same playlist-card template on a
// different domain. Every stream shares the extension's DOM selectors — only
// the URL differs — so a new stream only needs an entry here + a manifest match.
// ─────────────────────────────────────────────────────────────────────────────

export interface StreamInfo {
  /** Stable id used for cache keys and playlist scoping, e.g. "radio-heartland". */
  slug: string
  /** Display name used in playlist titles/descriptions, e.g. "Radio Heartland". */
  label: string
}

const KNOWN_STREAMS: Record<string, string> = {
  'the-current': 'The Current',
  'radio-heartland': 'Radio Heartland',
  'current-pride': "The Current's Pride Stream",
  'the-siren': 'The Siren',
  current20: 'The Current 20th Anniversary',
  teenagekicks: 'Teenage Kicks',
  ritmofonica: 'Ritmofonica',
  'purple-current': 'Purple Current',
  'local-current': 'Local Current',
  rockthecradle: 'Rock the Cradle',
  'carbon-sound': 'Carbon Sound',
}

function titleCase(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Identify which stream a playlist page belongs to, from its URL. Unknown
 * thecurrent.org/playlist/<slug> pages still resolve (title-cased slug as the
 * label) so a new stream MPR adds works immediately, without a code change.
 */
export function detectStream(url: URL): StreamInfo | null {
  if (url.hostname === 'www.thecurrent.org' && url.pathname.startsWith('/playlist/')) {
    const slug = url.pathname.split('/')[2] || ''
    if (!slug) return null
    return { slug, label: KNOWN_STREAMS[slug] ?? titleCase(slug) }
  }
  if (url.hostname === 'www.carbonsound.fm' && url.pathname.startsWith('/playlist')) {
    return { slug: 'carbon-sound', label: KNOWN_STREAMS['carbon-sound'] }
  }
  return null
}
