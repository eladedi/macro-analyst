/**
 * Freshness + confidence derivation — Spec §13 and §14.
 *
 * Freshness is judged against the metric's expected-frequency window
 * (metrics.freshness_window_hours: daily 48h, weekly 240h, monthly 1080h), so
 * a monthly series is NOT marked stale just for not updating daily (Spec §12).
 */
import type { ConfidenceLevel, Freshness } from '../db/types'

export type FetchFreshness = Exclude<Freshness, 'manual'>

const HOUR_MS = 3_600_000

/**
 * fresh   : within the expected window
 * delayed : up to 2x the window (slightly outside)
 * stale   : beyond 2x the window (significantly outdated)
 */
export function computeFreshness(
  latestObservationDate: Date,
  freshnessWindowHours: number,
  now: Date = new Date()
): FetchFreshness {
  const ageHours = (now.getTime() - latestObservationDate.getTime()) / HOUR_MS
  if (ageHours <= freshnessWindowHours) return 'fresh'
  if (ageHours <= freshnessWindowHours * 2) return 'delayed'
  return 'stale'
}

/**
 * Confidence from freshness + the metric's default (source-derived) confidence:
 * fresh keeps the source default, delayed drops to medium, stale drops to low.
 */
export function computeConfidence(
  freshness: FetchFreshness,
  defaultConfidence: ConfidenceLevel
): ConfidenceLevel {
  if (freshness === 'fresh') return defaultConfidence
  if (freshness === 'delayed') return 'medium'
  return 'low'
}
