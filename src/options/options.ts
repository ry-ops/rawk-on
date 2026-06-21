import type {
  Message,
  AuthResult,
  RedirectUriResult,
} from '../shared/types.ts'
import { getSettings, setSettings } from '../shared/settings.ts'

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`missing #${id}`)
  return el as T
}

const clientIdInput = $<HTMLInputElement>('clientId')
const saveCredsBtn = $<HTMLButtonElement>('saveCreds')
const savedMsg = $<HTMLSpanElement>('savedMsg')
const redirectCode = $<HTMLElement>('redirectUri')
const copyRedirectBtn = $<HTMLButtonElement>('copyRedirect')
const statusDot = $<HTMLSpanElement>('statusDot')
const statusText = $<HTMLSpanElement>('statusText')
const loginBtn = $<HTMLButtonElement>('loginBtn')
const logoutBtn = $<HTMLButtonElement>('logoutBtn')
const authError = $<HTMLParagraphElement>('authError')

function send<T>(msg: Message): Promise<T> {
  return chrome.runtime.sendMessage(msg) as Promise<T>
}

async function loadSettings(): Promise<void> {
  const s = await getSettings()
  clientIdInput.value = s.clientId
}

async function loadRedirectUri(): Promise<void> {
  const { redirectUri } = await send<RedirectUriResult>({ type: 'GET_REDIRECT_URI' })
  redirectCode.textContent = redirectUri
}

function renderAuth(connected: boolean): void {
  statusDot.classList.toggle('on', connected)
  statusDot.classList.toggle('off', !connected)
  statusText.textContent = connected ? 'Connected to TIDAL' : 'Not connected'
  loginBtn.hidden = connected
  logoutBtn.hidden = !connected
}

async function refreshAuth(): Promise<void> {
  const res = await send<AuthResult>({ type: 'GET_AUTH_STATE' })
  renderAuth(res.ok ? res.state.connected : false)
}

saveCredsBtn.addEventListener('click', async () => {
  await setSettings({ clientId: clientIdInput.value })
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
  // Persist whatever is currently typed before launching the flow.
  await setSettings({ clientId: clientIdInput.value })
  loginBtn.disabled = true
  loginBtn.textContent = 'Opening TIDAL…'
  const res = await send<AuthResult>({ type: 'LOGIN' })
  loginBtn.disabled = false
  loginBtn.textContent = 'Log in to TIDAL'
  if (res.ok) renderAuth(res.state.connected)
  else authError.textContent = res.error
})

logoutBtn.addEventListener('click', async () => {
  const res = await send<AuthResult>({ type: 'LOGOUT' })
  if (res.ok) renderAuth(res.state.connected)
})

void loadSettings()
void loadRedirectUri()
void refreshAuth()
