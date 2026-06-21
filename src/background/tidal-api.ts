import { TIDAL, DEBUG, dailyPlaylistName, localISODate } from '../shared/config.ts'
import type { TrackInfo, AddTrackResult, SearchDebugResult } from '../shared/types.ts'
import { getAccessToken } from './auth.ts'
import {
  getDaily,
  setDaily,
  dropDaily,
  recordAddedTrack,
  type DailyPlaylist,
} from './storage.ts'

// JSON:API resource identifier
interface ResourceId {
  type: string
  id: string
}
interface JsonApiResource extends ResourceId {
  attributes?: Record<string, unknown>
  relationships?: Record<string, { data?: ResourceId | ResourceId[] }>
}
interface JsonApiDoc {
  data?: JsonApiResource | JsonApiResource[]
  included?: JsonApiResource[]
}

class NeedsAuthError extends Error {}
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function api(
  path: string,
  init: RequestInit & { query?: Record<string, string> } = {},
): Promise<JsonApiDoc> {
  const token = await getAccessToken()
  if (!token) throw new NeedsAuthError('Not connected to TIDAL.')

  const url = new URL(TIDAL.apiBase + path)
  url.searchParams.set('countryCode', TIDAL.countryCode)
  for (const [k, v] of Object.entries(init.query ?? {})) {
    url.searchParams.set(k, v)
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.api+json',
    ...(init.body ? { 'Content-Type': 'application/vnd.api+json' } : {}),
    ...(init.headers as Record<string, string>),
  }

  const res = await fetch(url.toString(), { ...init, headers })
  if (DEBUG) console.log('[tidal-pool]', init.method ?? 'GET', url.pathname, res.status)

  if (res.status === 401) throw new NeedsAuthError('TIDAL session expired.')

  const text = await res.text()
  const json = text ? (JSON.parse(text) as JsonApiDoc) : {}
  if (!res.ok) {
    if (DEBUG) console.error('[tidal-pool] API error', res.status, text)
    throw new ApiError(res.status, `TIDAL API ${res.status}: ${text.slice(0, 300)}`)
  }
  return json
}

// ── Timing helper ────────────────────────────────────────────────────────────

async function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const t = performance.now()
  const result = await fn()
  return [result, performance.now() - t]
}

// ── Matching helpers ──────────────────────────────────────────────────────────

function relIds(rel?: { data?: ResourceId | ResourceId[] }): string[] {
  const d = rel?.data
  return (Array.isArray(d) ? d : d ? [d] : []).map((x) => x.id)
}

/** Normalize a title/artist for comparison: lowercase, strip diacritics,
 *  parentheticals, "feat. …", and punctuation. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\bfeat\.?\b.*$/g, ' ')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** 0 = no relation, 4 = exact. Parentheticals/feat already stripped by norm(). */
function titleScore(want: string, cand: string): number {
  const w = norm(want)
  const c = norm(cand)
  if (!w || !c) return 0
  if (c === w) return 4
  if (c.startsWith(w) || w.startsWith(c)) return 3
  if (c.includes(w) || w.includes(c)) return 2
  return 0
}

/** 0–2 across the candidate's artist list. */
function artistScore(want: string, cands: string[]): number {
  const w = norm(want)
  const cs = cands.map(norm)
  if (cs.some((a) => a === w)) return 2
  if (cs.some((a) => a && (a.includes(w) || w.includes(a)))) return 1
  return 0
}

/** 0–2; 0 when we have no album to compare. */
function albumScore(want: string | undefined, cand: string | undefined): number {
  if (!want || !cand) return 0
  const w = norm(want)
  const c = norm(cand)
  if (!w || !c) return 0
  if (c === w) return 2
  if (c.includes(w) || w.includes(c)) return 1
  return 0
}

// ── Search ──────────────────────────────────────────────────────────────────

interface TrackMatch {
  id: string
  title?: string
}

/** Find the best TIDAL track for a song. Searches free-text "artist title",
 *  then among the ranked candidates picks the one whose TITLE (and artist) best
 *  matches — so a more "popular but wrong" track by the same artist can't win. */
async function searchTrackId(track: TrackInfo): Promise<TrackMatch | null> {
  const query = `${track.artist} ${track.title}`.trim()
  const doc = await api(`/searchResults/${encodeURIComponent(query)}`, {
    query: { include: 'tracks,tracks.artists,tracks.albums' },
  })

  const data = Array.isArray(doc.data) ? doc.data[0] : doc.data
  const rel = data?.relationships?.tracks?.data
  const ranked = (Array.isArray(rel) ? rel : rel ? [rel] : []).filter(
    (r) => r.type === 'tracks',
  )

  const included = doc.included ?? []
  const trackById = new Map(included.filter((r) => r.type === 'tracks').map((r) => [r.id, r]))
  const nameById = new Map(
    included
      .filter((r) => r.type === 'artists')
      .map((r) => [r.id, r.attributes?.name as string | undefined]),
  )
  const albumById = new Map(
    included
      .filter((r) => r.type === 'albums')
      .map((r) => [r.id, r.attributes?.title as string | undefined]),
  )

  const candidates = (ranked.length ? ranked : included.filter((r) => r.type === 'tracks'))
    .slice(0, 12)
    .map((r, i) => {
      const tr = trackById.get(r.id)
      const artists = relIds(tr?.relationships?.artists)
        .map((id) => nameById.get(id))
        .filter((n): n is string => Boolean(n))
      const album = relIds(tr?.relationships?.albums)
        .map((id) => albumById.get(id))
        .filter(Boolean)[0] as string | undefined
      return {
        id: r.id,
        title: tr?.attributes?.title as string | undefined,
        artists,
        album,
        rank: i,
      }
    })

  if (!candidates.length) return null

  // Score on title (dominant) + artist + album; tiny rank tiebreak.
  let best = candidates[0]
  let bestScore = -1
  let bestTitle = 0
  for (const c of candidates) {
    const ts = titleScore(track.title, c.title ?? '')
    const total =
      ts * 100 +
      artistScore(track.artist, c.artists) * 10 +
      albumScore(track.album, c.album) -
      c.rank * 0.001
    if (total > bestScore) {
      bestScore = total
      bestTitle = ts
      best = c
    }
  }

  if (DEBUG) {
    console.log(
      `[tidal-pool] want "${track.artist} – ${track.title}" (album: ${track.album ?? '—'}) → ` +
        `rank${best.rank} "${best.title ?? '?'}" by ${best.artists.join(', ') || '?'} ` +
        `(album: ${best.album ?? '—'}) score=${bestScore.toFixed(2)} titleScore=${bestTitle}`,
    )
  }

  // Refuse to add an unrelated track: require at least a partial TITLE match.
  // Better to say "no match" than to silently add the wrong song.
  if (bestTitle < 2) {
    if (DEBUG) console.log('[tidal-pool] no confident title match — not adding.')
    return null
  }

  return { id: best.id, title: best.title }
}

/** Diagnostic: return the ranked track list for a query, with titles/artists/
 *  album, so you can see exactly what TIDAL returns and why a match was chosen. */
export async function searchDebug(query: string): Promise<SearchDebugResult> {
  try {
    const doc = await api(`/searchResults/${encodeURIComponent(query.trim())}`, {
      query: { include: 'tracks,tracks.artists,tracks.albums' },
    })
    const data = Array.isArray(doc.data) ? doc.data[0] : doc.data
    const rel = data?.relationships?.tracks?.data
    const ranked = (Array.isArray(rel) ? rel : rel ? [rel] : []).filter(
      (r) => r.type === 'tracks',
    )

    const included = doc.included ?? []
    const trackById = new Map(included.filter((r) => r.type === 'tracks').map((r) => [r.id, r]))
    const nameById = new Map(
      included
        .filter((r) => r.type === 'artists')
        .map((r) => [r.id, r.attributes?.name as string | undefined]),
    )
    const albumById = new Map(
      included
        .filter((r) => r.type === 'albums')
        .map((r) => [r.id, r.attributes?.title as string | undefined]),
    )

    const top = ranked.slice(0, 15).map((r, i) => {
      const tr = trackById.get(r.id)
      const artists = relIds(tr?.relationships?.artists)
        .map((id) => nameById.get(id))
        .filter(Boolean)
        .join(', ')
      const album = relIds(tr?.relationships?.albums)
        .map((id) => albumById.get(id))
        .filter(Boolean)[0]
      return {
        rank: i + 1,
        id: r.id,
        title: tr?.attributes?.title as string | undefined,
        artists: artists || undefined,
        album,
      }
    })
    return { ok: true, query, count: ranked.length, top }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Daily playlist ────────────────────────────────────────────────────────────

async function createDailyPlaylist(name: string): Promise<string> {
  const doc = await api('/playlists', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'playlists',
        attributes: {
          name,
          description: 'Captured from The Current via Rawk On.',
          accessType: 'UNLISTED',
        },
      },
    }),
  })
  const data = doc.data
  const created = Array.isArray(data) ? data[0] : data
  if (!created?.id) throw new Error('Playlist creation returned no id.')
  return created.id
}

/**
 * Return today's playlist + local dedup set from storage, creating the playlist
 * only if we have none cached. No network round-trip when it's already cached —
 * staleness is handled lazily on add (see addWithRecreate).
 */
async function ensureDailyPlaylist(isoDate: string): Promise<DailyPlaylist> {
  const existing = await getDaily(isoDate)
  if (existing) return existing
  const id = await createDailyPlaylist(dailyPlaylistName(isoDate))
  await setDaily(isoDate, id, [])
  return { id, trackIds: [] }
}

async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  await api(`/playlists/${playlistId}/relationships/items`, {
    method: 'POST',
    body: JSON.stringify({ data: [{ type: 'tracks', id: trackId }] }),
  })
}

/** Add the track; if the cached playlist was deleted on TIDAL (404), recreate
 *  it once and retry. Returns the playlist id actually used. */
async function addWithRecreate(
  isoDate: string,
  daily: DailyPlaylist,
  trackId: string,
): Promise<string> {
  try {
    await addTrackToPlaylist(daily.id, trackId)
    return daily.id
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await dropDaily(isoDate)
      const id = await createDailyPlaylist(dailyPlaylistName(isoDate))
      await setDaily(isoDate, id, [])
      await addTrackToPlaylist(id, trackId)
      return id
    }
    throw err
  }
}

function playlistUrl(playlistId: string): string {
  return `https://tidal.com/playlist/${playlistId}`
}

function logTimings(p: { search: number; ensure: number; add: number; total: number }): void {
  if (!DEBUG) return
  const r = (n: number) => Math.round(n)
  console.log(
    `[tidal-pool] add timing — search=${r(p.search)}ms ensure=${r(p.ensure)}ms ` +
      `add=${r(p.add)}ms total=${r(p.total)}ms`,
  )
}

// ── Public entry point used by the service worker ───────────────────────────

export async function addTrack(track: TrackInfo): Promise<AddTrackResult> {
  const t0 = performance.now()
  try {
    const isoDate = localISODate(new Date())

    // Search and ensure-playlist are independent — run them concurrently.
    const [[match, msSearch], [daily, msEnsure]] = await Promise.all([
      timed(() => searchTrackId(track)),
      timed(() => ensureDailyPlaylist(isoDate)),
    ])

    if (!match) {
      return { ok: false, error: `No TIDAL match for "${track.artist} – ${track.title}".` }
    }
    const trackId = match.id

    // Local dedup — no network call.
    if (daily.trackIds.includes(trackId)) {
      const total = performance.now() - t0
      logTimings({ search: msSearch, ensure: msEnsure, add: 0, total })
      return {
        ok: true,
        status: 'duplicate',
        playlistId: daily.id,
        playlistUrl: playlistUrl(daily.id),
        matched: track,
        matchedTitle: match.title,
        ms: Math.round(total),
      }
    }

    const [playlistId, msAdd] = await timed(() => addWithRecreate(isoDate, daily, trackId))
    await recordAddedTrack(isoDate, trackId)

    const total = performance.now() - t0
    logTimings({ search: msSearch, ensure: msEnsure, add: msAdd, total })
    return {
      ok: true,
      status: 'added',
      playlistId,
      playlistUrl: playlistUrl(playlistId),
      matched: track,
      matchedTitle: match.title,
      ms: Math.round(total),
    }
  } catch (err) {
    const needsAuth = err instanceof NeedsAuthError
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      needsAuth,
    }
  }
}
