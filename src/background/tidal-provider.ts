import { TIDAL, DEBUG, dailyPlaylistName, localISODate } from '../shared/config.ts'
import { getSettings } from '../shared/settings.ts'
import { bestMatch, titleScore, type ScoredCandidate } from '../shared/match.ts'
import type { TrackInfo, Tokens, AddTrackResult, AddHourResult, SearchDebugResult } from '../shared/types.ts'
import { getTokens, setTokens, clearTokens, getDaily, setDaily, dropDaily, recordAddedTrack, recordAddedTracks, type DailyPlaylist } from './storage.ts'
import type { MusicProvider } from './provider.ts'

const TOKEN_KEY = 'tidalTokens'

class NeedsAuthError extends Error {}
class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

// ── JSON:API helpers ─────────────────────────────────────────────────────────

interface ResourceId { type: string; id: string }
interface JsonApiResource extends ResourceId {
  attributes?: Record<string, unknown>
  relationships?: Record<string, { data?: ResourceId | ResourceId[] }>
}
interface JsonApiDoc {
  data?: JsonApiResource | JsonApiResource[]
  included?: JsonApiResource[]
}

function relIds(rel?: { data?: ResourceId | ResourceId[] }): string[] {
  const d = rel?.data
  return (Array.isArray(d) ? d : d ? [d] : []).map((x) => x.id)
}

// ── Shared utils ─────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const t = performance.now()
  return [await fn(), performance.now() - t]
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  async function worker(): Promise<void> {
    while (next < items.length) { const i = next++; results[i] = await fn(items[i]) }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function base64UrlEncode(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(64)).buffer)
}

async function challengeFor(verifier: string): Promise<string> {
  return base64UrlEncode(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
}

// ── TidalProvider ────────────────────────────────────────────────────────────

export class TidalProvider implements MusicProvider {
  readonly id = 'tidal' as const
  readonly label = 'TIDAL'

  redirectUri(): string {
    return chrome.identity.getRedirectURL()
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(): Promise<void> {
    const { tidalClientId: clientId } = await getSettings()
    if (!clientId) throw new Error('No TIDAL client ID set. Open Settings first.')

    const verifier = randomVerifier()
    const challenge = await challengeFor(verifier)
    const redirect = this.redirectUri()

    const authUrl = new URL(TIDAL.authorizeUrl)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirect)
    authUrl.searchParams.set('scope', TIDAL.scopes.join(' '))
    authUrl.searchParams.set('code_challenge_method', 'S256')
    authUrl.searchParams.set('code_challenge', challenge)

    if (DEBUG) console.log('[rawk-on] tidal auth url', authUrl.toString())

    const responseUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl.toString(), interactive: true })
    if (!responseUrl) throw new Error('Login was cancelled.')

    const returned = new URL(responseUrl)
    const error = returned.searchParams.get('error')
    if (error) throw new Error(`TIDAL denied: ${error} ${returned.searchParams.get('error_description') ?? ''}`)

    const code = returned.searchParams.get('code')
    if (!code) throw new Error('No auth code returned from TIDAL.')

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirect,
      client_id: clientId,
      code_verifier: verifier,
    })
    const res = await fetch(TIDAL.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`)

    const json = await res.json() as { access_token: string; refresh_token: string; expires_in: number }
    await setTokens(TOKEN_KEY, {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    })
  }

  async logout(): Promise<void> {
    await clearTokens(TOKEN_KEY)
  }

  async isConnected(): Promise<boolean> {
    return (await getTokens(TOKEN_KEY)) !== null
  }

  private async getAccessToken(): Promise<string | null> {
    let tokens = await getTokens(TOKEN_KEY)
    if (!tokens) return null
    if (Date.now() > tokens.expiresAt - 60_000) tokens = await this.refresh(tokens)
    return tokens.accessToken
  }

  private async refresh(tokens: Tokens): Promise<Tokens> {
    const { tidalClientId: clientId } = await getSettings()
    const res = await fetch(TIDAL.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: clientId,
      }),
    })
    if (!res.ok) { await clearTokens(TOKEN_KEY); throw new Error('SESSION_EXPIRED') }
    const json = await res.json() as { access_token: string; refresh_token?: string; expires_in: number }
    const next: Tokens = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? tokens.refreshToken,
      expiresAt: Date.now() + json.expires_in * 1000,
    }
    await setTokens(TOKEN_KEY, next)
    return next
  }

  // ── API client ────────────────────────────────────────────────────────────

  private async api(
    path: string,
    init: RequestInit & { query?: Record<string, string> } = {},
    attempt = 0,
  ): Promise<JsonApiDoc> {
    const token = await this.getAccessToken()
    if (!token) throw new NeedsAuthError('Not connected to TIDAL.')

    const url = new URL(TIDAL.apiBase + path)
    url.searchParams.set('countryCode', TIDAL.countryCode)
    for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v)

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.api+json',
      ...(init.body ? { 'Content-Type': 'application/vnd.api+json' } : {}),
      ...(init.headers as Record<string, string>),
    }

    const res = await fetch(url.toString(), { ...init, headers })
    if (DEBUG) console.log('[rawk-on/tidal]', init.method ?? 'GET', url.pathname, res.status)

    if (res.status === 429 && attempt < 5) {
      const ra = Number(res.headers.get('Retry-After'))
      const waitMs = Number.isFinite(ra) && ra > 0 ? ra * 1000 : Math.min(8000, 400 * 2 ** attempt)
      if (DEBUG) console.log(`[rawk-on/tidal] 429 — retry in ${waitMs}ms`)
      await sleep(waitMs)
      return this.api(path, init, attempt + 1)
    }

    if (res.status === 401) throw new NeedsAuthError('TIDAL session expired.')

    const text = await res.text()
    const json = text ? (JSON.parse(text) as JsonApiDoc) : {}
    if (!res.ok) {
      if (DEBUG) console.error('[rawk-on/tidal] error', res.status, text)
      throw new ApiError(res.status, `TIDAL ${res.status}: ${text.slice(0, 300)}`)
    }
    return json
  }

  // ── Search ────────────────────────────────────────────────────────────────

  private async searchTrackId(track: TrackInfo): Promise<{ id: string; title?: string } | null> {
    const query = `${track.artist} ${track.title}`.trim()
    const doc = await this.api(`/searchResults/${encodeURIComponent(query)}`, {
      query: { include: 'tracks,tracks.artists,tracks.albums' },
    })

    const data = Array.isArray(doc.data) ? doc.data[0] : doc.data
    const rel = data?.relationships?.tracks?.data
    const ranked = (Array.isArray(rel) ? rel : rel ? [rel] : []).filter((r) => r.type === 'tracks')

    const included = doc.included ?? []
    const trackById = new Map(included.filter((r) => r.type === 'tracks').map((r) => [r.id, r]))
    const nameById = new Map(included.filter((r) => r.type === 'artists').map((r) => [r.id, r.attributes?.name as string | undefined]))
    const albumById = new Map(included.filter((r) => r.type === 'albums').map((r) => [r.id, r.attributes?.title as string | undefined]))

    const candidates: ScoredCandidate[] = (ranked.length ? ranked : included.filter((r) => r.type === 'tracks'))
      .slice(0, 12)
      .map((r, i) => {
        const tr = trackById.get(r.id)
        const artists = relIds(tr?.relationships?.artists).map((id) => nameById.get(id)).filter((n): n is string => Boolean(n))
        const album = relIds(tr?.relationships?.albums).map((id) => albumById.get(id)).filter(Boolean)[0] as string | undefined
        return { id: r.id, title: tr?.attributes?.title as string | undefined, artists, album, rank: i }
      })

    const match = bestMatch(track, candidates)
    if (DEBUG && match) {
      const c = candidates.find((x) => x.id === match.id)!
      console.log(`[rawk-on/tidal] "${track.artist} – ${track.title}" → rank${c.rank} "${match.title}" ts=${titleScore(track.title, match.title ?? '')}`)
    }
    return match
  }

  // ── Playlist ops ──────────────────────────────────────────────────────────

  private async createPlaylist(name: string): Promise<string> {
    const doc = await this.api('/playlists', {
      method: 'POST',
      body: JSON.stringify({ data: { type: 'playlists', attributes: { name, description: 'Captured from The Current via Rawk On.', accessType: 'UNLISTED' } } }),
    })
    const created = Array.isArray(doc.data) ? doc.data[0] : doc.data
    if (!created?.id) throw new Error('Playlist creation returned no id.')
    return created.id
  }

  private async ensurePlaylist(cacheKey: string, name: string): Promise<DailyPlaylist> {
    const existing = await getDaily(cacheKey)
    if (existing) return existing
    const id = await this.createPlaylist(name)
    await setDaily(cacheKey, id, [])
    return { id, trackIds: [] }
  }

  private async addItems(playlistId: string, trackIds: string[]): Promise<void> {
    for (let i = 0; i < trackIds.length; i += 20) {
      const chunk = trackIds.slice(i, i + 20)
      await this.api(`/playlists/${playlistId}/relationships/items`, {
        method: 'POST',
        body: JSON.stringify({ data: chunk.map((id) => ({ type: 'tracks', id })) }),
      })
    }
  }

  private async addWithRecreate(cacheKey: string, name: string, daily: DailyPlaylist, trackIds: string[]): Promise<string> {
    try {
      await this.addItems(daily.id, trackIds)
      return daily.id
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        await dropDaily(cacheKey)
        const id = await this.createPlaylist(name)
        await setDaily(cacheKey, id, [])
        await this.addItems(id, trackIds)
        return id
      }
      throw err
    }
  }

  playlistUrl(playlistId: string): string {
    return `https://tidal.com/playlist/${playlistId}`
  }

  // ── Public entry points ───────────────────────────────────────────────────

  async addTrack(track: TrackInfo): Promise<AddTrackResult> {
    const t0 = performance.now()
    try {
      const isoDate = localISODate(new Date())
      const cacheKey = `${this.id}·${isoDate}` // provider-scoped so Spotify/Tidal don't share playlist ids
      const [[match, msSearch], [daily, msEnsure]] = await Promise.all([
        timed(() => this.searchTrackId(track)),
        timed(() => this.ensurePlaylist(cacheKey, dailyPlaylistName(isoDate))),
      ])

      if (!match) return { ok: false, error: `No TIDAL match for "${track.artist} – ${track.title}".` }

      if (daily.trackIds.includes(match.id)) {
        if (DEBUG) console.log(`[rawk-on/tidal] timing search=${Math.round(msSearch)}ms ensure=${Math.round(msEnsure)}ms add=0ms`)
        return { ok: true, status: 'duplicate', playlistId: daily.id, playlistUrl: this.playlistUrl(daily.id), matched: track, matchedTitle: match.title, ms: Math.round(performance.now() - t0) }
      }

      const [playlistId, msAdd] = await timed(() => this.addWithRecreate(cacheKey, dailyPlaylistName(isoDate), daily, [match.id]))
      await recordAddedTrack(cacheKey, match.id)

      if (DEBUG) console.log(`[rawk-on/tidal] timing search=${Math.round(msSearch)}ms ensure=${Math.round(msEnsure)}ms add=${Math.round(msAdd)}ms`)
      return { ok: true, status: 'added', playlistId, playlistUrl: this.playlistUrl(playlistId), matched: track, matchedTitle: match.title, ms: Math.round(performance.now() - t0) }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), needsAuth: err instanceof NeedsAuthError }
    }
  }

  async addHour(date: string, hourLabel: string, tracks: TrackInfo[]): Promise<AddHourResult> {
    const t0 = performance.now()
    try {
      const cacheKey = `${this.id}·${date}·${hourLabel}` // provider-scoped
      const name = `The Current - ${date} · ${hourLabel}`
      const daily = await this.ensurePlaylist(cacheKey, name)
      const seen = new Set(daily.trackIds)

      const matches = await mapLimit(tracks, 2, async (tr) => ({ tr, id: (await this.searchTrackId(tr))?.id ?? null }))

      const notFound: string[] = []
      const toAdd: string[] = []
      let duplicates = 0
      for (const { tr, id } of matches) {
        if (!id) notFound.push(`${tr.artist} – ${tr.title}`)
        else if (seen.has(id)) duplicates++
        else { seen.add(id); toAdd.push(id) }
      }

      if (toAdd.length) {
        await this.addWithRecreate(cacheKey, name, daily, toAdd)
        await recordAddedTracks(cacheKey, toAdd)
      }

      const ms = Math.round(performance.now() - t0)
      if (DEBUG) console.log(`[rawk-on/tidal] hour "${hourLabel}" — added ${toAdd.length}, dupes ${duplicates}, not found ${notFound.length}, ${ms}ms`)
      return { ok: true, playlistId: daily.id, playlistUrl: this.playlistUrl(daily.id), added: toAdd.length, duplicates, notFound, total: tracks.length, ms }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), needsAuth: err instanceof NeedsAuthError }
    }
  }

  async searchDebug(query: string): Promise<SearchDebugResult> {
    try {
      const doc = await this.api(`/searchResults/${encodeURIComponent(query.trim())}`, {
        query: { include: 'tracks,tracks.artists,tracks.albums' },
      })
      const data = Array.isArray(doc.data) ? doc.data[0] : doc.data
      const rel = data?.relationships?.tracks?.data
      const ranked = (Array.isArray(rel) ? rel : rel ? [rel] : []).filter((r) => r.type === 'tracks')
      const included = doc.included ?? []
      const trackById = new Map(included.filter((r) => r.type === 'tracks').map((r) => [r.id, r]))
      const nameById = new Map(included.filter((r) => r.type === 'artists').map((r) => [r.id, r.attributes?.name as string | undefined]))
      const albumById = new Map(included.filter((r) => r.type === 'albums').map((r) => [r.id, r.attributes?.title as string | undefined]))

      const top = ranked.slice(0, 15).map((r, i) => {
        const tr = trackById.get(r.id)
        const artists = relIds(tr?.relationships?.artists).map((id) => nameById.get(id)).filter(Boolean).join(', ')
        const album = relIds(tr?.relationships?.albums).map((id) => albumById.get(id)).filter(Boolean)[0]
        return { rank: i + 1, id: r.id, title: tr?.attributes?.title as string | undefined, artists: artists || undefined, album }
      })
      return { ok: true, query, count: ranked.length, top }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  }
}
