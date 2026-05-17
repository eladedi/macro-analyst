/**
 * Regime selection + trend — Spec §11 and §12.
 */
import type { Changes } from './changes'
import type { MetricTrend, SnapshotTrend } from '../db/types'

export interface RegimeBand {
  min_score: number
  max_score: number
  regime_label: string
  posture: string | null
}

export interface RegimeResult {
  label: string
  posture: string | null
}

/**
 * Pick the band with the highest min_score the score reaches. This is exact at
 * integer boundaries (e.g. 65 → Risk-On, 64 → Early Risk-On) and well-defined
 * for fractional scores (64.5 → Early Risk-On).
 */
export function selectRegime(bands: RegimeBand[], marketScore: number): RegimeResult {
  const score = Math.min(100, Math.max(0, marketScore))
  const ordered = [...bands].sort((a, b) => b.min_score - a.min_score)
  const band = ordered.find((b) => score >= b.min_score) ?? ordered[ordered.length - 1]
  return { label: band.regime_label, posture: band.posture }
}

/** Market trend vs the previous snapshot — Spec §12 ±5 rule. */
export function marketTrend(current: number, previous: number | null): SnapshotTrend {
  if (previous === null) return 'unknown'
  if (current >= previous + 5) return 'improving'
  if (current <= previous - 5) return 'deteriorating'
  return 'stable'
}

/** Metric trend from its changes — prefers 1W, then 1M, then 1D. */
export function metricTrend(changes: Changes | null): MetricTrend {
  if (!changes) return 'unknown'
  const c = changes.change_1w ?? changes.change_1m ?? changes.change_1d
  if (c === null || c === undefined) return 'unknown'
  if (c > 0) return 'up'
  if (c < 0) return 'down'
  return 'flat'
}
