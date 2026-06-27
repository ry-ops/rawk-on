// Package dist/ into a Chrome Web Store-ready zip.
//
// The build pins a `key` in the manifest so the *unpacked dev* extension keeps a
// stable ID (and OAuth redirect URI) while developing. The Chrome Web Store
// rejects uploads that contain `key` ("key field is not allowed in manifest") —
// it assigns its own ID. So for the store package we strip `key` from a COPY of
// the manifest and zip that, leaving the dev build untouched.
//
// Usage:  npm run pack   (runs `npm run build` first via the npm script)

import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'

const version = JSON.parse(readFileSync('package.json', 'utf8')).version
const manifestPath = 'dist/manifest.json'

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
if ('key' in manifest) {
  delete manifest.key
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log('Stripped `key` from dist/manifest.json (store does not allow it).')
} else {
  console.log('No `key` field present — nothing to strip.')
}

const zip = `rawk-on-v${version}.zip`
rmSync(zip, { force: true })
execSync(`cd dist && zip -rq "../${zip}" .`, { stdio: 'inherit' })
console.log(`Packaged ${zip} — ready to upload to the Chrome Web Store.`)
