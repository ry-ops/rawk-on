import type { Message, AddTrackResult } from '../shared/types.ts'
import { SELECTORS, pickAll } from './selectors.ts'
import { extractTrack } from './extract.ts'
import {
  injectStyles,
  createAddButton,
  setButtonState,
  toast,
} from './ui.ts'

const MARK = 'tpWired' // dataset flag so we never double-wire a row

function send(msg: Message): Promise<AddTrackResult> {
  return chrome.runtime.sendMessage(msg) as Promise<AddTrackResult>
}

/** True once the extension has been reloaded/updated out from under this page. */
function contextInvalidated(): boolean {
  // chrome.runtime.id becomes undefined when the context is gone.
  return !chrome.runtime?.id
}

async function handleAdd(row: HTMLElement, btn: HTMLButtonElement): Promise<void> {
  const track = extractTrack(row)
  if (!track) {
    setButtonState(btn, 'error')
    toast('Couldn’t read this song’s title/artist. Check selectors.', 'bad')
    return
  }

  if (contextInvalidated()) {
    setButtonState(btn, 'error')
    toast('Rawk On was updated — reload this page to keep adding.', 'bad', 6000)
    return
  }

  setButtonState(btn, 'loading')
  let res: AddTrackResult
  try {
    res = await send({ type: 'ADD_TRACK', track })
  } catch (err) {
    setButtonState(btn, 'error')
    const msg = err instanceof Error ? err.message : String(err)
    toast(
      /context invalidated/i.test(msg)
        ? 'Rawk On was updated — reload this page to keep adding.'
        : `Couldn’t reach the extension: ${msg}`,
      'bad',
      6000,
    )
    return
  }

  if (res.ok && res.status === 'added') {
    const secs = (res.ms / 1000).toFixed(1)
    const open = res.playlistUrl
      ? ` · <a href="${res.playlistUrl}" target="_blank">open</a>`
      : ''
    // If TIDAL matched a title different from what you clicked, flag it so a
    // bad match is obvious instead of silently landing the wrong song.
    const mism =
      res.matchedTitle &&
      res.matchedTitle.toLowerCase() !== track.title.toLowerCase()
    if (mism) {
      setButtonState(btn, 'dupe')
      toast(
        `Added <strong>${res.matchedTitle}</strong> — but you clicked ` +
          `<strong>${track.title}</strong>. Check it’s right.${open}`,
        'info',
        7000,
      )
    } else {
      setButtonState(btn, 'done')
      toast(
        `Added <strong>${res.matchedTitle ?? track.title}</strong> to TIDAL · ${secs}s${open}`,
        'ok',
      )
    }
  } else if (res.ok && res.status === 'duplicate') {
    setButtonState(btn, 'dupe')
    toast(`Already in today’s playlist: <strong>${track.title}</strong>`, 'info')
  } else if (!res.ok && res.needsAuth) {
    setButtonState(btn, 'error')
    toast('Not connected to TIDAL. Open the extension settings to log in.', 'bad', 5000)
  } else if (!res.ok) {
    setButtonState(btn, 'error')
    toast(`Couldn’t add: ${res.error}`, 'bad', 5000)
  }
}

function wireRow(row: HTMLElement): void {
  if (row.dataset[MARK]) return
  row.dataset[MARK] = '1'
  row.classList.add('tp-row')
  const btn = createAddButton((b) => void handleAdd(row, b))
  row.appendChild(btn)
}

function scan(): void {
  for (const row of pickAll(document, SELECTORS.row)) wireRow(row)
}

// Console helper for tuning selectors against the live DOM.
function selfTest(): void {
  const rows = pickAll(document, SELECTORS.row)
  console.log(`[tidal-pool] rows matched: ${rows.length}`)
  rows.slice(0, 5).forEach((r, i) => {
    console.log(`  row ${i}:`, extractTrack(r), r)
  })
  if (!rows.length) {
    console.log(
      '[tidal-pool] No rows matched. Edit src/content/selectors.ts → SELECTORS.row.',
    )
  }
}

// Console helper: see exactly what TIDAL returns for a query, ranked.
//   __rawkSearch('Death Cab for Cutie Riptides')
async function rawkSearch(query: string): Promise<unknown> {
  const res = (await chrome.runtime.sendMessage({
    type: 'SEARCH_DEBUG',
    query,
  })) as { ok: boolean; query?: string; count?: number; top?: unknown[]; error?: string }
  if (!res.ok) {
    console.warn('[rawk] search failed:', res.error)
    return res
  }
  console.log(`[rawk] "${res.query}" → ${res.count} tracks; top 15:`)
  console.table(res.top)
  return res
}

function start(): void {
  injectStyles()
  scan()
  // The playlist hydrates and updates over time; keep wiring new rows.
  const observer = new MutationObserver(() => scan())
  observer.observe(document.body, { childList: true, subtree: true })
  const w = window as unknown as {
    __tidalPoolSelfTest: () => void
    __rawkSearch: (q: string) => Promise<unknown>
  }
  w.__tidalPoolSelfTest = selfTest
  w.__rawkSearch = rawkSearch
  console.log(
    '[tidal-pool] active. __tidalPoolSelfTest() checks selectors; ' +
      "__rawkSearch('artist title') shows TIDAL's ranked results.",
  )
}

if (document.body) start()
else document.addEventListener('DOMContentLoaded', start)
