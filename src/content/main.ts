import type { Message, AddTrackResult, AddHourResult, TrackInfo } from '../shared/types.ts'
import { SELECTORS, pick, pickAll } from './selectors.ts'
import { extractTrack } from './extract.ts'
import {
  injectStyles,
  createAddButton,
  setButtonState,
  createHourButton,
  setHourButtonState,
  toast,
  setServiceLabel,
  getServiceLabel,
} from './ui.ts'
import { localISODate } from '../shared/config.ts'
import { getSettings } from '../shared/settings.ts'

const MARK = 'tpWired' // dataset flag so we never double-wire a row
const HOUR_MARK = 'tpHourWired'

function send(msg: Message): Promise<AddTrackResult> {
  return chrome.runtime.sendMessage(msg) as Promise<AddTrackResult>
}

/** The date the playlist page is showing (from its date input), else today. */
function pageDate(): string {
  const input = document.querySelector<HTMLInputElement>('input[name="playlistDate"]')
  return input?.value || localISODate(new Date())
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
        `Added <strong>${res.matchedTitle ?? track.title}</strong> to ${getServiceLabel()} · ${secs}s${open}`,
        'ok',
      )
    }
  } else if (res.ok && res.status === 'duplicate') {
    setButtonState(btn, 'dupe')
    toast(`Already in today’s playlist: <strong>${track.title}</strong>`, 'info')
  } else if (!res.ok && res.needsAuth) {
    setButtonState(btn, 'error')
    toast(`Not connected to ${getServiceLabel()}. Open the extension settings to log in.`, 'bad', 5000)
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
  for (const header of pickAll(document, SELECTORS.hourHeader)) wireHour(header)
}

// ── "Add hour" — bulk-add a whole hour block ────────────────────────────────

function wireHour(header: HTMLElement): void {
  if (header.dataset[HOUR_MARK]) return
  // The hour's songs live in the <ul> right after the header.
  const ul = header.nextElementSibling
  if (!(ul instanceof HTMLElement) || ul.tagName !== 'UL') return
  header.dataset[HOUR_MARK] = '1'
  const label = (pick(header, SELECTORS.hourLabel)?.textContent ?? '').trim()
  const btn = createHourButton((b) => void handleAddHour(ul, label, b))
  header.appendChild(btn)
}

async function handleAddHour(
  ul: HTMLElement,
  hourLabel: string,
  btn: HTMLButtonElement,
): Promise<void> {
  if (contextInvalidated()) {
    setHourButtonState(btn, 'error', 'Reload page')
    toast('Rawk On was updated — reload this page.', 'bad', 6000)
    return
  }
  const tracks = pickAll(ul, SELECTORS.row)
    .map(extractTrack)
    .filter((t): t is TrackInfo => Boolean(t))
  if (!tracks.length) {
    setHourButtonState(btn, 'error', 'No songs')
    toast('Couldn’t read any songs from this hour.', 'bad')
    return
  }

  setHourButtonState(btn, 'loading', `Adding 0/${tracks.length}…`)
  let res: AddHourResult
  try {
    res = (await chrome.runtime.sendMessage({
      type: 'ADD_HOUR',
      date: pageDate(),
      hourLabel,
      tracks,
    })) as AddHourResult
  } catch (err) {
    setHourButtonState(btn, 'error', 'Retry')
    const msg = err instanceof Error ? err.message : String(err)
    toast(
      /context invalidated/i.test(msg)
        ? 'Rawk On was updated — reload this page.'
        : `Couldn’t add hour: ${msg}`,
      'bad',
      6000,
    )
    return
  }

  if (!res.ok) {
    setHourButtonState(btn, 'error', 'Retry')
    toast(
      res.needsAuth
        ? `Not connected to ${getServiceLabel()}. Open settings to log in.`
        : `Couldn’t add hour: ${res.error}`,
      'bad',
      6000,
    )
    return
  }

  setHourButtonState(btn, 'done', `Added ${res.added}/${res.total}`)
  const open = res.playlistUrl
    ? ` · <a href="${res.playlistUrl}" target="_blank">open</a>`
    : ''
  const extras = [
    res.duplicates ? `${res.duplicates} already there` : '',
    res.notFound.length ? `${res.notFound.length} not found` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  toast(
    `Added <strong>${res.added} of ${res.total}</strong> from ${hourLabel}` +
      `${extras ? ` · ${extras}` : ''} · ${(res.ms / 1000).toFixed(1)}s${open}`,
    res.added ? 'ok' : 'info',
    6000,
  )
  if (res.notFound.length) {
    console.log(`[tidal-pool] ${hourLabel} not found:`, res.notFound)
  }
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

/** Read the active provider so pill captions name the right service. */
async function syncServiceLabel(): Promise<void> {
  try {
    const { provider } = await getSettings()
    setServiceLabel(provider)
  } catch {
    /* settings unavailable (e.g. context invalidated) — keep current label */
  }
}

function start(): void {
  injectStyles()
  void syncServiceLabel()
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes['rawkOnSettings']) void syncServiceLabel()
  })
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
