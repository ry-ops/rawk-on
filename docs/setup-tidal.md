# Connect TIDAL

Rawk On uses **your own** TIDAL developer app (free, ~5 minutes). You'll create the
app, register a redirect URI, and paste the Client ID into the extension. No client
secret is needed — it uses the secure PKCE flow.

## 1. Open the extension's Settings

1. Click the Rawk On toolbar icon → **Settings & login**.
2. Click the **TIDAL** tab at the top.
3. Leave this open — you'll copy the **Redirect URI** from here in step 3.

## 2. Create a TIDAL app

1. Go to <https://developer.tidal.com/dashboard> and log in with your TIDAL account.
2. Create a new app (e.g. `Rawk On`).
3. When prompted, add the **Redirect URI**: paste the exact value from the
   extension's Settings → TIDAL tab (looks like
   `https://<extension-id>.chromiumapp.org/`). **Copy it from Settings** — don't
   type it by hand (mind the trailing `/`).

## 3. Scopes

Make sure the app is allowed the scopes Rawk On needs (it requests these at login):

- `user.read`
- `collection.read`, `collection.write`
- `playlists.read`, `playlists.write`
- `search.read`

## 4. Connect the extension

1. Copy the app's **Client ID** from the dashboard.
2. Back in the extension's Settings → TIDAL tab, paste it into **Client ID** →
   **Save**.
3. Click **Log in to TIDAL** and approve the consent screen.
4. The status dot turns green: **Connected to TIDAL**. Add a song from
   [The Current](https://www.thecurrent.org/playlist/the-current) to test.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Login fails / redirect error | The Redirect URI in the dashboard must **exactly** match the one in Settings (copy it again; mind the trailing `/`). |
| No match / nothing added | The track may not be on TIDAL, or the title differs — Rawk On adds nothing rather than the wrong song. |
| `401` after a while | Log out and back in to refresh the session. |

See also: [Connect Spotify](setup-spotify.md) · main [README](../README.md).
