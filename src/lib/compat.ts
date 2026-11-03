import { CATEGORIES, QUESTIONS, type Answers, type CategoryId, type Question } from '@/data/questions'

export interface Compatibility {
  /** Score global sur 100, pondéré par catégorie. */
  total: number
  /** Score par catégorie sur 100. */
  byCategory: Record<CategoryId, number>
  /** Points communs marquants, pour la fiche profil. */
  highlights: string[]
}

function questionScore(q: Question, a?: string | string[], b?: string | string[]): number | null {
  if (a == null || b == null) return null
  if (q.kind === 'multi') {
    const sa = new Set(a as string[])
    const sb = new Set(b as string[])
    if (!sa.size || !sb.size) return null
    let common = 0
    sa.forEach((x) => sb.has(x) && common++)
    // 0 commun → 0.25, 1 → ~0.6, 2+ → ~0.9-1
    return Math.min(1, 0.25 + common * 0.36)
  }
  const x = a as string
  const y = b as string
  if (q.kind === 'ordinal') {
    const i = q.options.findIndex((o) => o.id === x)
    const j = q.options.findIndex((o) => o.id === y)
    if (i < 0 || j < 0) return null
    return 1 - Math.abs(i - j) / Math.max(1, q.options.length - 1)
  }
  if (x === y) return q.matrix?.[x]?.[y] ?? 1
  return q.matrix?.[x]?.[y] ?? q.matrix?.[y]?.[x] ?? 0.2
}

export function computeCompatibility(mine: Answers, theirs: Answers): Compatibility {
  const sums = {} as Record<CategoryId, { s: number; n: number }>
  CATEGORIES.forEach((c) => (sums[c.id] = { s: 0, n: 0 }))
  const highlights: string[] = []

  for (const q of QUESTIONS) {
    const score = questionScore(q, mine[q.id], theirs[q.id])
    if (score == null) continue
    sums[q.category].s += score
    sums[q.category].n += 1
    if (score >= 0.99 && q.kind !== 'multi' && highlights.length < 4) {
      const opt = q.options.find((o) => o.id === mine[q.id])
      if (opt) highlights.push(`${opt.emoji} ${opt.label}`)
    }
  }

  const mineP = (mine.passions as string[] | undefined) ?? []
  const theirP = (theirs.passions as string[] | undefined) ?? []
  const passionsQ = QUESTIONS.find((q) => q.id === 'passions')!
  mineP
    .filter((p) => theirP.includes(p))
    .forEach((p) => {
      const o = passionsQ.options.find((x) => x.id === p)
      if (o) highlights.unshift(`${o.emoji} ${o.label}`)
    })

  const byCategory = {} as Record<CategoryId, number>
  let total = 0
  let weights = 0
  for (const c of CATEGORIES) {
    const { s, n } = sums[c.id]
    if (!n) {
      byCategory[c.id] = 0
      continue
    }
    const v = s / n
    byCategory[c.id] = Math.round(v * 100)
    total += v * c.weight
    weights += c.weight
  }

  return {
    total: weights ? Math.round((total / weights) * 100) : 0,
    byCategory,
    highlights: highlights.slice(0, 5),
  }
}
