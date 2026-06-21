import type {
  Message,
  AddTrackResult,
  AddHourResult,
  AuthResult,
  RedirectUriResult,
  SearchDebugResult,
} from '../shared/types.ts'
import { login, logout, isConnected, redirectUri } from './auth.ts'
import { addTrack, addHour, searchDebug } from './tidal-api.ts'

type Response =
  | AddTrackResult
  | AddHourResult
  | AuthResult
  | RedirectUriResult
  | SearchDebugResult

async function handle(msg: Message): Promise<Response> {
  switch (msg.type) {
    case 'ADD_TRACK':
      return addTrack(msg.track)

    case 'GET_AUTH_STATE':
      return { ok: true, state: { connected: await isConnected() } }

    case 'LOGIN':
      try {
        await login()
        return { ok: true, state: { connected: true } }
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }

    case 'LOGOUT':
      await logout()
      return { ok: true, state: { connected: false } }

    case 'GET_REDIRECT_URI':
      return { redirectUri: redirectUri() }

    case 'SEARCH_DEBUG':
      return searchDebug(msg.query)

    case 'ADD_HOUR':
      return addHour(msg.date, msg.hourLabel, msg.tracks)
  }
}

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  // Always respond — even on an unexpected throw — so the caller never hangs
  // waiting for a reply that never comes.
  handle(msg).then(sendResponse, (err: unknown) => {
    console.error('[tidal-pool] handler error', err)
    sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) })
  })
  return true // keep the message channel open for the async response
})

// Diagnostic: run `await rawkSearch('Death Cab for Cutie Riptides')` straight
// from the service-worker console to see TIDAL's ranked results for a query.
;(globalThis as unknown as { rawkSearch: typeof searchDebug }).rawkSearch =
  searchDebug
