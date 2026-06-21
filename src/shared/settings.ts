import { TIDAL } from './config.ts'

// User-supplied config lives in chrome.storage.local (never in the shipped
// bundle). With PKCE there is NO client secret — the only field is the client
// ID, which is public by design.

export interface Settings {
  clientId: string
}

const KEY = 'tidalSettings'

export async function getSettings(): Promise<Settings> {
  const out = await chrome.storage.local.get(KEY)
  const saved = (out[KEY] as Partial<Settings> | undefined) ?? {}
  return {
    // Seed with the default client ID so it works out of the box; anything
    // entered on the settings page overrides it.
    clientId: saved.clientId?.trim() || TIDAL.clientId,
  }
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings()
  const next: Settings = {
    clientId: (patch.clientId ?? current.clientId).trim(),
  }
  await chrome.storage.local.set({ [KEY]: next })
  return next
}
