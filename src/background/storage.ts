import type { Tokens } from '../shared/types.ts'

// chrome.storage.local schema:
//   {provider}Tokens: Tokens        (e.g. tidalTokens, spotifyTokens)
//   dailyPlaylists: { [key]: { id: string, trackIds: string[] } }

export interface DailyPlaylist {
  id: string
  trackIds: string[]
}

// ── Token storage (provider-keyed) ───────────────────────────────────────────

export async function getTokens(key: string): Promise<Tokens | null> {
  const out = await chrome.storage.local.get(key)
  return (out[key] as Tokens | undefined) ?? null
}

export async function setTokens(key: string, tokens: Tokens): Promise<void> {
  await chrome.storage.local.set({ [key]: tokens })
}

export async function clearTokens(key: string): Promise<void> {
  await chrome.storage.local.remove(key)
}

// ── Daily playlist + local dedup set ────────────────────────────────────────

async function readMap(): Promise<Record<string, DailyPlaylist>> {
  const out = await chrome.storage.local.get('dailyPlaylists')
  return (out['dailyPlaylists'] as Record<string, DailyPlaylist>) ?? {}
}

async function writeMap(map: Record<string, DailyPlaylist>): Promise<void> {
  await chrome.storage.local.set({ dailyPlaylists: map })
}

export async function getDaily(key: string): Promise<DailyPlaylist | null> {
  return (await readMap())[key] ?? null
}

export async function setDaily(
  key: string,
  id: string,
  trackIds: string[] = [],
): Promise<void> {
  const map = await readMap()
  map[key] = { id, trackIds }
  await writeMap(map)
}

export async function recordAddedTrack(key: string, trackId: string): Promise<void> {
  await recordAddedTracks(key, [trackId])
}

export async function recordAddedTracks(key: string, trackIds: string[]): Promise<void> {
  const map = await readMap()
  const entry = map[key]
  if (!entry) return
  for (const id of trackIds) {
    if (!entry.trackIds.includes(id)) entry.trackIds.push(id)
  }
  await writeMap(map)
}

export async function dropDaily(key: string): Promise<void> {
  const map = await readMap()
  delete map[key]
  await writeMap(map)
}
