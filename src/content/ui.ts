// Hover "Save" pill (The Current logo + label) and toast notifications.
// Styled to echo the site's own save control: icon + word, flex row, rounded.

// Button icon — "metal hand" 🤘 (Noun Project icon #1200426; CC BY, attribution
// required). Black line art on transparent, inlined as a data: URI so it works
// inside the content script with no web_accessible_resources plumbing. It's
// inverted to white in CSS to read on the dark pill. Swap this import + the
// .tp-logo filter to change the icon.
import logoUrl from '../assets/metal-hand.png?inline'

const STYLE_ID = 'tidal-pool-styles'

const CSS = `
.tp-row { position: relative; }
.tp-add-btn {
  position: absolute;
  top: 8px;
  right: 8px;                 /* top-right corner of the song card */
  display: inline-flex;
  align-items: center;
  gap: 8px;                   /* like the site's save control (gap: .5rem) */
  padding: 7px 15px 7px 8px;
  font: 600 15px/1 system-ui, sans-serif;
  color: #fff;
  background: rgba(17,17,17,.92);
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 999px;
  box-shadow: 0 1px 5px rgba(0,0,0,.35);
  cursor: pointer;
  opacity: 0;
  transition: opacity .12s ease, transform .12s ease, background .12s ease;
  z-index: 5;
}
.tp-logo {
  width: 28px;
  height: 28px;
  display: block;
  flex: 0 0 auto;
  filter: invert(1);          /* black line art → white on the dark pill */
}
.tp-label { white-space: nowrap; }
.tp-row:hover .tp-add-btn,
.tp-add-btn:focus-visible { opacity: 1; }
.tp-add-btn:hover { transform: scale(1.05); }
.tp-add-btn[disabled] { cursor: default; }
.tp-add-btn.tp-done { background: #1db954; border-color: #1db954; }
.tp-add-btn.tp-dupe { background: #6b7280; border-color: #6b7280; }
.tp-add-btn.tp-err  { background: #dc2626; border-color: #dc2626; }

/* Inline "Add hour" pill in each hour header — always visible. */
.tp-hour-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 14px;
  padding: 6px 14px 6px 7px;
  font: 600 14px/1 system-ui, sans-serif;
  color: #fff;
  background: rgba(17,17,17,.92);
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 999px;
  box-shadow: 0 1px 5px rgba(0,0,0,.3);
  cursor: pointer;
  vertical-align: middle;
  transition: filter .12s ease, background .12s ease;
}
.tp-hour-btn:hover { filter: brightness(1.12); }
.tp-hour-btn[disabled] { cursor: default; }
.tp-hour-btn .tp-logo { width: 24px; height: 24px; }
.tp-hour-btn .tp-spin { width: 24px; height: 24px; }
.tp-hour-btn.tp-done { background: #1db954; border-color: #1db954; }
.tp-hour-btn.tp-err  { background: #dc2626; border-color: #dc2626; }

@keyframes tp-spin { to { transform: rotate(360deg); } }
.tp-spin {
  width: 28px; height: 28px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  border-radius: 50%;
  box-sizing: border-box;
  animation: tp-spin .7s linear infinite;
  flex: 0 0 auto;
}

.tp-toast-wrap {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2147483647;
}
.tp-toast {
  min-width: 220px;
  max-width: 360px;
  padding: 12px 14px;
  font: 500 13px/1.4 system-ui, sans-serif;
  color: #fff;
  background: #111;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.3);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity .18s ease, transform .18s ease;
}
.tp-toast.tp-show { opacity: 1; transform: translateY(0); }
.tp-toast.tp-ok   { background: #1db954; }
.tp-toast.tp-info { background: #374151; }
.tp-toast.tp-bad  { background: #dc2626; }
.tp-toast a { color: #fff; text-decoration: underline; }
`

const logoImg = `<img class="tp-logo" src="${logoUrl}" alt="" />`

function pill(label: string, opts: { spinner?: boolean } = {}): string {
  const icon = opts.spinner ? '<span class="tp-spin"></span>' : logoImg
  return `${icon}<span class="tp-label">${label}</span>`
}

export function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.documentElement.appendChild(style)
}

export function createAddButton(
  onClick: (btn: HTMLButtonElement) => void,
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.className = 'tp-add-btn'
  btn.type = 'button'
  btn.title = 'Add to today’s TIDAL playlist'
  btn.setAttribute('aria-label', 'Add to TIDAL')
  btn.innerHTML = pill('Add')
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClick(btn)
  })
  return btn
}

export function setButtonState(
  btn: HTMLButtonElement,
  state: 'idle' | 'loading' | 'done' | 'dupe' | 'error',
): void {
  btn.classList.remove('tp-done', 'tp-dupe', 'tp-err')
  btn.disabled = state === 'loading'
  switch (state) {
    case 'loading':
      btn.innerHTML = pill('Adding…', { spinner: true })
      btn.title = 'Adding…'
      break
    case 'done':
      btn.classList.add('tp-done')
      btn.innerHTML = pill('Added ✓')
      btn.title = 'Added to TIDAL'
      break
    case 'dupe':
      btn.classList.add('tp-dupe')
      btn.innerHTML = pill('Already')
      btn.title = 'Already in today’s playlist'
      break
    case 'error':
      btn.classList.add('tp-err')
      btn.innerHTML = pill('Retry')
      btn.title = 'Failed — click to retry'
      break
    default:
      btn.innerHTML = pill('Add')
      btn.title = 'Add to today’s TIDAL playlist'
  }
}

// ── "Add hour" pill ───────────────────────────────────────────────────────────

export function createHourButton(
  onClick: (btn: HTMLButtonElement) => void,
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.className = 'tp-hour-btn'
  btn.type = 'button'
  btn.title = 'Add this hour’s songs to a new TIDAL playlist'
  btn.innerHTML = pill('Add hour')
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClick(btn)
  })
  return btn
}

export function setHourButtonState(
  btn: HTMLButtonElement,
  state: 'idle' | 'loading' | 'done' | 'error',
  label?: string,
): void {
  btn.classList.remove('tp-done', 'tp-err')
  btn.disabled = state === 'loading'
  switch (state) {
    case 'loading':
      btn.innerHTML = pill(label ?? 'Adding…', { spinner: true })
      break
    case 'done':
      btn.classList.add('tp-done')
      btn.innerHTML = pill(label ?? 'Done ✓')
      break
    case 'error':
      btn.classList.add('tp-err')
      btn.innerHTML = pill(label ?? 'Retry')
      break
    default:
      btn.innerHTML = pill('Add hour')
  }
}

let wrap: HTMLElement | null = null
function toastWrap(): HTMLElement {
  if (wrap && document.body.contains(wrap)) return wrap
  wrap = document.createElement('div')
  wrap.className = 'tp-toast-wrap'
  document.body.appendChild(wrap)
  return wrap
}

export function toast(
  html: string,
  kind: 'ok' | 'info' | 'bad' = 'ok',
  ms = 3500,
): void {
  const el = document.createElement('div')
  el.className = `tp-toast tp-${kind}`
  el.innerHTML = html
  toastWrap().appendChild(el)
  requestAnimationFrame(() => el.classList.add('tp-show'))
  setTimeout(() => {
    el.classList.remove('tp-show')
    setTimeout(() => el.remove(), 220)
  }, ms)
}
