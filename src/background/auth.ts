import { TIDAL, DEBUG } from '../shared/config.ts'
import type { Tokens } from '../shared/types.ts'
import { getSettings } from '../shared/settings.ts'
import { getTokens, setTokens, clearTokens } from './storage.ts'

// ── PKCE helpers ────────────────────────────────────────────────────────────

function base64UrlEncode(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(64))
  return base64UrlEncode(bytes.buffer)
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )
  return base64UrlEncode(digest)
}

/** The redirect URI Chrome hands back to us. Register this in the TIDAL portal. */
export function redirectUri(): string {
  // e.g. https://<extension-id>.chromiumapp.org/
  return chrome.identity.getRedirectURL()
}

// ── Login / token exchange ──────────────────────────────────────────────────

export async function login(): Promise<Tokens> {
  const { clientId } = await getSettings()
  if (!clientId) {
    throw new Error('No TIDAL client ID set. Open the extension settings first.')
  }
  const verifier = randomVerifier()
  const challenge = await challengeFor(verifier)
  const redirect = redirectUri()

  const authUrl = new URL(TIDAL.authorizeUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirect)
  authUrl.searchParams.set('scope', TIDAL.scopes.join(' '))
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('code_challenge', challenge)

  if (DEBUG) console.log('[tidal-pool] auth url', authUrl.toString())

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  })
  if (!responseUrl) throw new Error('Login was cancelled.')

  const returned = new URL(responseUrl)
  const error = returned.searchParams.get('error')
  if (error) {
    throw new Error(
      `TIDAL denied authorization: ${error} ${returned.searchParams.get('error_description') ?? ''}`,
    )
  }
  const code = returned.searchParams.get('code')
  if (!code) throw new Error('No authorization code returned from TIDAL.')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirect,
    client_id: clientId,
    code_verifier: verifier,
  })

  const res = await fetch(TIDAL.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`)
  }
  const json = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }
  const tokens: Tokens = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
  await setTokens(tokens)
  return tokens
}

export async function logout(): Promise<void> {
  await clearTokens()
}

// ── Token freshness ─────────────────────────────────────────────────────────

async function refresh(tokens: Tokens): Promise<Tokens> {
  const { clientId } = await getSettings()
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
    client_id: clientId,
  })
  const res = await fetch(TIDAL.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    // Refresh token is dead — force a fresh login.
    await clearTokens()
    throw new Error('SESSION_EXPIRED')
  }
  const json = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }
  const next: Tokens = {
    accessToken: json.access_token,
    // TIDAL may or may not rotate the refresh token.
    refreshToken: json.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
  await setTokens(next)
  return next
}

/** Returns a valid access token, refreshing if it expires within 60s. */
export async function getAccessToken(): Promise<string | null> {
  let tokens = await getTokens()
  if (!tokens) return null
  if (Date.now() > tokens.expiresAt - 60_000) {
    tokens = await refresh(tokens)
  }
  return tokens.accessToken
}

export async function isConnected(): Promise<boolean> {
  return (await getTokens()) !== null
}
