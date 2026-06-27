import type { Message, AuthResult, RedirectUriResult, ClearCacheResult } from '../shared/types.ts'
import type { ProviderId } from '../shared/settings.ts'
import { getSettings, setSettings } from '../shared/settings.ts'
// Brand mark — the "metal hand" icon (Noun Project #1200426), inverted to white
// in CSS so it reads on the dark header. Same asset the content-script pills use.
import brandMarkUrl from '../assets/metal-hand.png?inline'

const brandMark = document.getElementById('brandMark') as HTMLImageElement | null
if (brandMark) brandMark.src = brandMarkUrl

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`missing #${id}`)
  return el as T
}

const providerTidalBtn = $<HTMLButtonElement>('providerTidal')
const providerSpotifyBtn = $<HTMLButtonElement>('providerSpotify')
const clientIdInput = $<HTMLInputElement>('clientId')
const saveCredsBtn = $<HTMLButtonElement>('saveCreds')
const savedMsg = $<HTMLSpanElement>('savedMsg')
const credNote = $<HTMLParagraphElement>('credNote')
const redirectCode = $<HTMLElement>('redirectUri')
const portalLink = $<HTMLAnchorElement>('portalLink')
const copyRedirectBtn = $<HTMLButtonElement>('copyRedirect')
const statusDot = $<HTMLSpanElement>('statusDot')
const statusText = $<HTMLSpanElement>('statusText')
const loginBtn = $<HTMLButtonElement>('loginBtn')
const logoutBtn = $<HTMLButtonElement>('logoutBtn')
const authError = $<HTMLParagraphElement>('authError')
const clearCacheBtn = $<HTMLButtonElement>('clearCacheBtn')
const clearMsg = $<HTMLSpanElement>('clearMsg')

const PROVIDER_META: Record<ProviderId, { label: string; portal: string; note: string; guide: string }> = {
  tidal: {
    label: 'TIDAL',
    portal: 'https://developer.tidal.com/dashboard',
    note: 'PKCE flow — no client secret needed. Register your app at developer.tidal.com.',
    guide: 'https://github.com/ry-ops/rawk-on/blob/main/docs/setup-tidal.md',
  },
  spotify: {
    label: 'Spotify',
    portal: 'https://developer.spotify.com/dashboard',
    note: 'PKCE flow — no client secret needed. Register your app at developer.spotify.com.',
    guide: 'https://github.com/ry-ops/rawk-on/blob/main/docs/setup-spotify.md',
  },
}

let activeProvider: ProviderId = 'tidal'

function send<T>(msg: Message): Promise<T> {
  return chrome.runtime.sendMessage(msg) as Promise<T>
}

function renderProvider(p: ProviderId): void {
  activeProvider = p
  const meta = PROVIDER_META[p]

  providerTidalBtn.classList.toggle('tab-active', p === 'tidal')
  providerSpotifyBtn.classList.toggle('tab-active', p === 'spotify')

  credNote.textContent = `${meta.note} `
  const guideLink = document.createElement('a')
  guideLink.href = meta.guide
  guideLink.target = '_blank'
  guideLink.rel = 'noopener'
  guideLink.textContent = 'Setup guide ↗'
  credNote.appendChild(guideLink)
  portalLink.href = meta.portal
  portalLink.textContent = `developer.${p === 'tidal' ? 'tidal' : 'spotify'}.com`
  loginBtn.textContent = `Log in to ${meta.label}`
  resetClearBtn()
}

function renderAuth(connected: boolean): void {
  const label = PROVIDER_META[activeProvider].label
  statusDot.classList.toggle('on', connected)
  statusDot.classList.toggle('off', !connected)
  statusText.textContent = connected ? `Connected to ${label}` : `Not connected to ${label}`
  loginBtn.hidden = connected
  logoutBtn.hidden = !connected
}

async function loadSettings(): Promise<void> {
  const s = await getSettings()
  renderProvider(s.provider)
  clientIdInput.value = s.provider === 'tidal' ? s.tidalClientId : s.spotifyClientId
}

async function switchProvider(p: ProviderId): Promise<void> {
  // Persist current client ID before switching.
  const currentValue = clientIdInput.value
  if (activeProvider === 'tidal') await setSettings({ tidalClientId: currentValue })
  else await setSettings({ spotifyClientId: currentValue })

  await setSettings({ provider: p })
  const s = await getSettings()
  renderProvider(p)
  clientIdInput.value = p === 'tidal' ? s.tidalClientId : s.spotifyClientId
  await refreshAuth()
}

async function loadRedirectUri(): Promise<void> {
  const { redirectUri } = await send<RedirectUriResult>({ type: 'GET_REDIRECT_URI' })
  redirectCode.textContent = redirectUri
}

async function refreshAuth(): Promise<void> {
  const res = await send<AuthResult>({ type: 'GET_AUTH_STATE' })
  renderAuth(res.ok ? res.state.connected : false)
}

providerTidalBtn.addEventListener('click', () => switchProvider('tidal'))
providerSpotifyBtn.addEventListener('click', () => switchProvider('spotify'))

saveCredsBtn.addEventListener('click', async () => {
  const patch = activeProvider === 'tidal'
    ? { tidalClientId: clientIdInput.value }
    : { spotifyClientId: clientIdInput.value }
  await setSettings(patch)
  savedMsg.textContent = 'Saved ✓'
  setTimeout(() => (savedMsg.textContent = ''), 1800)
})

copyRedirectBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(redirectCode.textContent ?? '')
  copyRedirectBtn.textContent = 'Copied ✓'
  setTimeout(() => (copyRedirectBtn.textContent = 'Copy'), 1500)
})

loginBtn.addEventListener('click', async () => {
  authError.textContent = ''
  // Persist whatever is typed before launching the flow.
  const patch = activeProvider === 'tidal'
    ? { tidalClientId: clientIdInput.value }
    : { spotifyClientId: clientIdInput.value }
  await setSettings(patch)
  loginBtn.disabled = true
  loginBtn.textContent = `Opening ${PROVIDER_META[activeProvider].label}…`
  const res = await send<AuthResult>({ type: 'LOGIN' })
  loginBtn.disabled = false
  loginBtn.textContent = `Log in to ${PROVIDER_META[activeProvider].label}`
  if (res.ok) renderAuth(res.state.connected)
  else authError.textContent = res.error
})

logoutBtn.addEventListener('click', async () => {
  const res = await send<AuthResult>({ type: 'LOGOUT' })
  if (res.ok) renderAuth(res.state.connected)
})

// ── Clear cached playlists (two-click confirm, scoped to active provider) ─────

let clearArmed = false
let clearTimer: ReturnType<typeof setTimeout> | undefined

function resetClearBtn(): void {
  clearArmed = false
  if (clearTimer) clearTimeout(clearTimer)
  clearCacheBtn.textContent = `Clear ${PROVIDER_META[activeProvider].label} cached playlists`
}

clearCacheBtn.addEventListener('click', async () => {
  if (!clearArmed) {
    clearArmed = true
    clearCacheBtn.textContent = 'Click again to confirm'
    clearTimer = setTimeout(resetClearBtn, 3000)
    return
  }
  resetClearBtn()
  const res = await send<ClearCacheResult>({ type: 'CLEAR_CACHE', provider: activeProvider })
  clearMsg.textContent = res.ok ? `Cleared ${res.removed} ✓` : res.error
  setTimeout(() => (clearMsg.textContent = ''), 2500)
})

void loadSettings()
void loadRedirectUri()
void refreshAuth()
