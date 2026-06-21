import type { Tokens } from '../shared/types.ts'

// chrome.storage.local schema:
//   tidalTokens: Tokens
//   dailyPlaylists: { [isoDate]: { id: string, trackIds: string[] } }
//     trackIds = TIDAL track ids we've already added that day (local dedup,
//     durable across service-worker restarts).

const KEYS = {
  tokens: 'tidalTokens',
  dailyPlaylists: 'dailyPlaylists',
} as const

export interface DailyPlaylist {
  id: string
  trackIds: string[]
}

export async function getTokens(): Promise<Tokens | null> {
  const out = await chrome.storage.local.get(KEYS.tokens)
  return (out[KEYS.tokens] as Tokens | undefined) ?? null
}

export async function setTokens(tokens: Tokens): Promise<void> {
  await chrome.storage.local.set({ [KEYS.tokens]: tokens })
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove(KEYS.tokens)
}

// ── Daily playlist + local dedup set ────────────────────────────────────────

async function readMap(): Promise<Record<string, DailyPlaylist>> {
  const out = await chrome.storage.local.get(KEYS.dailyPlaylists)
  return (out[KEYS.dailyPlaylists] as Record<string, DailyPlaylist>) ?? {}
}

async function writeMap(map: Record<string, DailyPlaylist>): Promise<void> {
  await chrome.storage.local.set({ [KEYS.dailyPlaylists]: map })
}

export async function getDaily(isoDate: string): Promise<DailyPlaylist | null> {
  return (await readMap())[isoDate] ?? null
}

export async function setDaily(
  isoDate: string,
  id: string,
  trackIds: string[] = [],
): Promise<void> {
  const map = await readMap()
  map[isoDate] = { id, trackIds }
  await writeMap(map)
}

export async function recordAddedTrack(
  isoDate: string,
  trackId: string,
): Promise<void> {
  await recordAddedTracks(isoDate, [trackId])
}

/** Append several track ids in a single read/write. */
export async function recordAddedTracks(
  key: string,
  trackIds: string[],
): Promise<void> {
  const map = await readMap()
  const entry = map[key]
  if (!entry) return
  for (const id of trackIds) {
    if (!entry.trackIds.includes(id)) entry.trackIds.push(id)
  }
  await writeMap(map)
}

export async function dropDaily(isoDate: string): Promise<void> {
  const map = await readMap()
  delete map[isoDate]
  await writeMap(map)
}
