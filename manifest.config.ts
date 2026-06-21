import { defineManifest } from '@crxjs/vite-plugin'

// No `key` is pinned here. For an unpacked extension Chrome derives a stable
// ID from the install folder path, so your OAuth redirect URI stays constant
// on your machine during development. The popup shows the exact redirect URI
// to register in the TIDAL portal. When you publish, add a real `key` (see
// README) so the ID — and thus the redirect URI — is stable everywhere.
export default defineManifest({
  manifest_version: 3,
  // Pinned public key → permanent extension ID (cdimphoionaangeagpenibioamgmbbfd),
  // independent of folder path or machine. Redirect URI therefore stays constant:
  //   https://cdimphoionaangeagpenibioamgmbbfd.chromiumapp.org/
  // The matching private key is in extension-private-key.pem (gitignored — keep it
  // safe; it's only needed to self-pack a .crx, not to load unpacked or publish to CWS).
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjxFVmrB7NFKOTEkCktLmJ6atRbQdKjbgFU2DqvnyynySHpfbxyMlK6U11fwxMPF+RLULDYfGu0fiSLNoaQWxDI1IDDnkYcAs/KgZrL1Gkv4N868KPiQmZtS9MPdt0bgpopvt257JKZSMPN+uwduRD7+M0d4Qe/aMlql3BSQuoD4jHFE8DsndEH4j6it2+nBxYpfWymbG9z5QXpKzGnP8jOLxI3vN9M7YR5o479pL31OK0Rm/3e8RQyBo8MuDhLzhIGEJv8y4T+5YzEoi0bcbfrDulKDcV4URz85/bGOUNq6rrf92ZD1a2b9m+kGZ4byZ3k0CZS+7dUMHXwDW8KDN6QIDAQAB',
  name: 'Rawk On',
  version: '0.1.0',
  description:
    "Hover a song on The Current's playlist and add it to a daily TIDAL playlist.",
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Rawk On',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
    },
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://www.thecurrent.org/playlist/*'],
      js: ['src/content/main.ts'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['storage', 'identity'],
  host_permissions: [
    'https://www.thecurrent.org/*',
    'https://openapi.tidal.com/*',
    'https://auth.tidal.com/*',
    'https://login.tidal.com/*',
  ],
})
