# Connect Spotify

Rawk On uses **your own** Spotify developer app (a free, ~5-minute setup). You'll
create the app, register a redirect URI, and paste the Client ID into the
extension. No client secret is involved — it uses the secure PKCE flow.

> **Two requirements that trip people up** (both cause a confusing `403 Forbidden`
> when adding songs, even though login works):
> 1. The Spotify account that **owns the app must have Spotify Premium.**
> 2. You must **add your listening account to the app's allowlist** (User Management).
>
> Reads (search) work without these; **writes** (creating playlists, adding tracks)
> do not. Both steps are covered below.

## 1. Open the extension's Settings

1. Click the Rawk On toolbar icon → **Settings & login**.
2. Click the **Spotify** tab at the top.
3. Leave this open — you'll copy the **Redirect URI** from here in step 3.

## 2. Create a Spotify app

1. Go to <https://developer.spotify.com/dashboard> and log in.
2. Click **Create app**.
3. Fill in:
   - **App name:** e.g. `Rawk On`
   - **App description:** e.g. `Saves songs from The Current to a daily playlist.`
   - **Redirect URI:** paste the exact URI from the extension's Settings → Spotify
     tab (looks like `https://<extension-id>.chromiumapp.org/`). **Use the value
     from Settings** — don't type it by hand.
   - **Which API/SDKs:** check **Web API**.
4. Agree to the Developer Terms of Service and click **Save**.

## 3. Make sure you can use the Web API (development mode)

A new app is in **development mode**. For it to make changes (create playlists, add
tracks) you need both:

- **Premium on the owner account.** If the dashboard shows a banner like
  *"blocked from accessing the Web API… no Spotify Premium subscription,"* the
  account that created the app needs an active Premium subscription.
- **Your listening account on the allowlist.** In your app, open
  **User Management** and add the **exact name and email** of the Spotify account
  you'll log in with (it can be the same account that owns the app). Up to 5 users
  are allowed in development mode.

## 4. Connect the extension

1. In the app's **Basic Information**, copy the **Client ID**.
2. Back in the extension's Settings → Spotify tab, paste it into **Client ID** →
   **Save**.
3. Click **Log in to Spotify** and approve the consent screen.
4. The status dot turns green: **Connected to Spotify**. Add a song from
   [The Current](https://www.thecurrent.org/playlist/the-current) to test.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `403 Forbidden` when adding | Confirm Premium on the owner account **and** that your login account is in **User Management**. |
| Login fails / redirect error | The Redirect URI in the dashboard must **exactly** match the one in Settings (copy it again; mind the trailing `/`). |
| Logged in but still 403 | Log out and back in so a fresh token picks up the allowlist, then retry. |
| Changed accounts | Whichever account you log in with must be the one on the allowlist. |

See also: [Connect TIDAL](setup-tidal.md) · main [README](../README.md).
