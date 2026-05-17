/**
 * Snapshot-level freshness + confidence aggregation — Spec §14.
 *
 * The spec requires this be derived from per-metric confidence and freshness
 * but gives no exact formula, so this is a documented, tunable heuristic:
 * if more than a third of metrics are degraded the snapshot drops a level.
 */
import type { ConfidenceLevel, Freshness, SnapshotFreshness } from '../db/types'

export interface SnapshotQuality {
  dataFreshness: SnapshotFreshness
  confidence: ConfidenceLevel
}

const THIRD = 1 / 3

export function aggregateQuality(
  freshness: Freshness[],
  confidence: ConfidenceLevel[]
): SnapshotQuality {
  const n = Math.max(freshness.length, 1)

  const staleFrac = freshness.filter((f) => f === 'stale').length / n
  const degradedFreshFrac =
    freshness.filter((f) => f === 'stale' || f === 'delayed').length / n

  let dataFreshness: SnapshotFreshness = 'good'
  if (staleFrac > THIRD) dataFreshness = 'stale'
  else if (degradedFreshFrac > THIRD) dataFreshness = 'mixed'

  const m = Math.max(confidence.length, 1)
  const lowFrac = confidence.filter((c) => c === 'low').length / m
  const degradedConfFrac = confidence.filter((c) => c === 'low' || c === 'medium').length / m

  let conf: ConfidenceLevel = 'high'
  if (lowFrac > THIRD) conf = 'low'
  else if (degradedConfFrac > THIRD) conf = 'medium'

  return { dataFreshness, confidence: conf }
}
