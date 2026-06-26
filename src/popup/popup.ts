import type { Message, AuthResult } from '../shared/types.ts'

const dot = document.getElementById('dot') as HTMLSpanElement
const status = document.getElementById('status') as HTMLParagraphElement
const settingsBtn = document.getElementById('settings') as HTMLButtonElement

function send<T>(msg: Message): Promise<T> {
  return chrome.runtime.sendMessage(msg) as Promise<T>
}

settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage())

async function init(): Promise<void> {
  const res = await send<AuthResult>({ type: 'GET_AUTH_STATE' })
  const connected = res.ok && res.state.connected
  const providerLabel = res.ok && res.state.provider === 'spotify' ? 'Spotify' : 'TIDAL'
  dot.classList.toggle('on', connected)
  dot.classList.toggle('off', !connected)
  status.textContent = connected ? `Connected to ${providerLabel}` : `Not connected to ${providerLabel}`
}

void init()
