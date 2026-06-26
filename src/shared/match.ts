/** Normalize for comparison: lowercase, strip diacritics, parentheticals,
 *  "feat. …", and punctuation. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\bfeat\.?\b.*$/g, ' ')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** 0 = no relation, 4 = exact. */
export function titleScore(want: string, cand: string): number {
  const w = norm(want)
  const c = norm(cand)
  if (!w || !c) return 0
  if (c === w) return 4
  if (c.startsWith(w) || w.startsWith(c)) return 3
  if (c.includes(w) || w.includes(c)) return 2
  return 0
}

/** 0–2 across the candidate's artist list. */
export function artistScore(want: string, cands: string[]): number {
  const w = norm(want)
  const cs = cands.map(norm)
  if (cs.some((a) => a === w)) return 2
  if (cs.some((a) => a && (a.includes(w) || w.includes(a)))) return 1
  return 0
}

/** 0–2; 0 when either side is missing. */
export function albumScore(want: string | undefined, cand: string | undefined): number {
  if (!want || !cand) return 0
  const w = norm(want)
  const c = norm(cand)
  if (!w || !c) return 0
  if (c === w) return 2
  if (c.includes(w) || w.includes(c)) return 1
  return 0
}

export interface ScoredCandidate {
  id: string
  title?: string
  artists: string[]
  album?: string
  rank: number
}

/** Pick the best candidate, returning null if no confident title match (score < 2).
 *  Shared by both providers — the scoring logic is provider-agnostic. */
export function bestMatch(
  want: { title: string; artist: string; album?: string },
  candidates: ScoredCandidate[],
): { id: string; title?: string } | null {
  if (!candidates.length) return null

  let best = candidates[0]
  let bestScore = -1
  let bestTitle = 0

  for (const c of candidates) {
    const ts = titleScore(want.title, c.title ?? '')
    const total =
      ts * 100 +
      artistScore(want.artist, c.artists) * 10 +
      albumScore(want.album, c.album) -
      c.rank * 0.001
    if (total > bestScore) {
      bestScore = total
      bestTitle = ts
      best = c
    }
  }

  if (bestTitle < 2) return null
  return { id: best.id, title: best.title }
}
