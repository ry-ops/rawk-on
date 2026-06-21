import type {
  Message,
  AddTrackResult,
  AuthResult,
  RedirectUriResult,
  SearchDebugResult,
} from '../shared/types.ts'
import { login, logout, isConnected, redirectUri } from './auth.ts'
import { addTrack, searchDebug } from './tidal-api.ts'

type Response = AddTrackResult | AuthResult | RedirectUriResult | SearchDebugResult

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
  }
}

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  handle(msg).then(sendResponse)
  return true // keep the message channel open for the async response
})

// Diagnostic: run `await rawkSearch('Death Cab for Cutie Riptides')` straight
// from the service-worker console to see TIDAL's ranked results for a query.
;(globalThis as unknown as { rawkSearch: typeof searchDebug }).rawkSearch =
  searchDebug
