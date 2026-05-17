/**
 * Core scoring math — Spec §10.
 *
 * Pure, side-effect-free primitives so they can be unit-tested directly
 * against the spec formulas.
 */

/** Spec §10.7 — a metric's influence on the final score: raw × mw × cw. */
export function metricContribution(
  rawScore: number,
  metricWeight: number,
  categoryWeight: number
): number {
  return rawScore * metricWeight * categoryWeight
}

/**
 * Spec §10.2 — category score = weighted average of its enabled metrics.
 * Returns null when the category has no enabled, scored metrics.
 */
export function categoryScore(metrics: { score: number; weight: number }[]): number | null {
  const sumW = metrics.reduce((s, m) => s + m.weight, 0)
  if (metrics.length === 0 || sumW === 0) return null
  const sumSW = metrics.reduce((s, m) => s + m.score * m.weight, 0)
  return sumSW / sumW
}

/**
 * Spec §10.3 — weighted raw score. Normalized over the categories that are
 * actually active (enabled + have a score), so empty/disabled categories
 * (e.g. unpopulated Breadth/Sentiment in the MVP) neither dilute nor cap the
 * score. This is a deliberate, documented refinement of the literal sum so
 * disabled categories are "excluded from weighting correctly" (roadmap §5).
 */
export function weightedRawScore(categories: { score: number; weight: number }[]): number {
  const sumW = categories.reduce((s, c) => s + c.weight, 0)
  if (categories.length === 0 || sumW === 0) return 0
  const sumSW = categories.reduce((s, c) => s + c.score * c.weight, 0)
  return sumSW / sumW
}

/** Spec §10.4 — map weighted raw (−5..+5) to a 0–100 Market Score. */
export function marketScore(weightedRaw: number): number {
  const ms = ((weightedRaw + 5) / 10) * 100
  return Math.min(100, Math.max(0, ms))
}

/** Spec §10.5 — Macro Regime Oscillator (−100..+100). */
export function oscillator(market: number): number {
  return (market - 50) * 2
}
