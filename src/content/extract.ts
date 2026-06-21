import type { TrackInfo } from '../shared/types.ts'
import { SELECTORS, pick, pickAll } from './selectors.ts'

function clean(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim()
}

/** Pull title/artist (+ album, songId) out of a playlist card, or null. */
export function extractTrack(row: HTMLElement): TrackInfo | null {
  const title = clean(pick(row, SELECTORS.title)?.textContent)

  // First .playlist-artist is the artist; a second one (if present) is the album.
  const lines = pickAll(row, SELECTORS.artistLines).map((el) => clean(el.textContent))
  const artist = lines[0] ?? ''
  const album = lines[1] || undefined

  if (title && artist) {
    return { title, artist, album, currentSongId: songId(row) }
  }

  // Fallback: "Artist – Title" rendered in one element.
  const whole = clean(row.textContent)
  const dash = whole.match(/^(.+?)\s+[–-]\s+(.+)$/)
  if (dash) {
    const [, a, t] = dash
    if (a && t) return { artist: clean(a), title: clean(t), currentSongId: songId(row) }
  }
  return null
}

/** The Current's song_id from the /song/the-current/<id> link, if present. */
function songId(row: HTMLElement): string | undefined {
  const href = pick(row, SELECTORS.songLink)?.getAttribute('href') ?? ''
  return href.match(/\/song\/[^/]+\/(\d+)/)?.[1]
}
