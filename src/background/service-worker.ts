import type { Message, AddTrackResult, AddHourResult, AuthResult, RedirectUriResult, SearchDebugResult, ClearCacheResult } from '../shared/types.ts'
import { getSettings } from '../shared/settings.ts'
import { TidalProvider } from './tidal-provider.ts'
import { SpotifyProvider } from './spotify-provider.ts'
import { clearDaily, purgeLegacyDaily } from './storage.ts'
import type { MusicProvider } from './provider.ts'

type Response = AddTrackResult | AddHourResult | AuthResult | RedirectUriResult | SearchDebugResult | ClearCacheResult

const providers: Record<string, MusicProvider> = {
  tidal: new TidalProvider(),
  spotify: new SpotifyProvider(),
}

// On load, drop any pre-provider-scoping cache entries so a stale id from one
// service can never be reused by the other.
void purgeLegacyDaily(Object.keys(providers)).then((n) => {
  if (n) console.log(`[rawk-on] purged ${n} legacy playlist-cache entr${n === 1 ? 'y' : 'ies'}`)
})

async function getProvider(): Promise<MusicProvider> {
  const { provider } = await getSettings()
  return providers[provider] ?? providers.tidal
}

async function handle(msg: Message): Promise<Response> {
  switch (msg.type) {
    case 'ADD_TRACK': {
      const p = await getProvider()
      return p.addTrack(msg.track)
    }

    case 'GET_AUTH_STATE': {
      const p = await getProvider()
      return { ok: true, state: { connected: await p.isConnected(), provider: p.id } }
    }

    case 'LOGIN': {
      const p = await getProvider()
      try {
        await p.login()
        return { ok: true, state: { connected: true, provider: p.id } }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    }

    case 'LOGOUT': {
      const p = await getProvider()
      await p.logout()
      return { ok: true, state: { connected: false, provider: p.id } }
    }

    case 'GET_REDIRECT_URI': {
      const p = await getProvider()
      return { redirectUri: p.redirectUri() }
    }

    case 'SEARCH_DEBUG': {
      const p = await getProvider()
      return p.searchDebug(msg.query)
    }

    case 'ADD_HOUR': {
      const p = await getProvider()
      return p.addHour(msg.date, msg.hourLabel, msg.tracks)
    }

    case 'CLEAR_CACHE': {
      const removed = await clearDaily(msg.provider)
      return { ok: true, removed }
    }
  }
}

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  handle(msg).then(sendResponse, (err: unknown) => {
    console.error('[rawk-on] handler error', err)
    sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) })
  })
  return true
})

// Diagnostic: run `await rawkSearch('Death Cab for Cutie Riptides')` from the
// service-worker console — uses whichever provider is currently active.
;(globalThis as unknown as { rawkSearch: (q: string) => Promise<SearchDebugResult> }).rawkSearch =
  async (q: string) => (await getProvider()).searchDebug(q)
