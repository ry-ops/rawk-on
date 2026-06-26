import { TIDAL } from './config.ts'

export type ProviderId = 'tidal' | 'spotify'

export interface Settings {
  provider: ProviderId
  tidalClientId: string
  spotifyClientId: string
}

const KEY = 'rawkOnSettings'

export async function getSettings(): Promise<Settings> {
  const out = await chrome.storage.local.get(KEY)
  const saved = (out[KEY] as Partial<Settings> | undefined) ?? {}
  return {
    provider: saved.provider ?? 'tidal',
    tidalClientId: saved.tidalClientId?.trim() || TIDAL.clientId,
    spotifyClientId: saved.spotifyClientId?.trim() || '',
  }
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings()
  const next: Settings = {
    provider: patch.provider ?? current.provider,
    tidalClientId: (patch.tidalClientId ?? current.tidalClientId).trim(),
    spotifyClientId: (patch.spotifyClientId ?? current.spotifyClientId).trim(),
  }
  await chrome.storage.local.set({ [KEY]: next })
  return next
}
