import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config.ts'

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  // CRXJS uses a dev server websocket for HMR; bind it explicitly so the
  // service worker can connect during `npm run dev`.
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
})
