/**
 * Per-metric change calculation — Spec §12.
 *
 * From a metric's observation history, compute the latest value plus absolute
 * and percent change over 1D / 1W / 1M / 3M windows. For each window the
 * comparison point is the most recent observation strictly older than the
 * latest and on or before (latestDate − window); if history doesn't reach
 * that far the change is null. For sparse series a short window falls back to
 * the nearest earlier point — harmless since each metric's scoring rule only
 * reads the window matching its own frequency (e.g. M2 uses change_1m).
 */

export interface Observation {
  value: number
  timestamp: string // YYYY-MM-DD
}

export interface Changes {
  value: number
  asOf: string
  change_1d: number | null
  change_1w: number | null
  change_1m: number | null
  change_3m: number | null
  change_1d_percent: number | null
  change_1w_percent: number | null
  change_1m_percent: number | null
  change_3m_percent: number | null
}

const DAY_MS = 86_400_000

function toTime(ts: string): number {
  return new Date(ts + 'T00:00:00Z').getTime()
}

export function computeChanges(observations: Observation[]): Changes | null {
  if (observations.length === 0) return null

  const sorted = [...observations].sort((a, b) => toTime(b.timestamp) - toTime(a.timestamp))
  const latest = sorted[0]
  const latestTime = toTime(latest.timestamp)

  // Most recent observation strictly older than latest and on/before target.
  const pastAt = (days: number): number | null => {
    const target = latestTime - days * DAY_MS
    for (let i = 1; i < sorted.length; i++) {
      const t = toTime(sorted[i].timestamp)
      if (t < latestTime && t <= target) return sorted[i].value
    }
    return null
  }

  const abs = (past: number | null) => (past === null ? null : latest.value - past)
  const pct = (past: number | null) =>
    past === null || past === 0 ? null : ((latest.value - past) / Math.abs(past)) * 100

  const p1d = pastAt(1)
  const p1w = pastAt(7)
  const p1m = pastAt(30)
  const p3m = pastAt(90)

  return {
    value: latest.value,
    asOf: latest.timestamp,
    change_1d: abs(p1d),
    change_1w: abs(p1w),
    change_1m: abs(p1m),
    change_3m: abs(p3m),
    change_1d_percent: pct(p1d),
    change_1w_percent: pct(p1w),
    change_1m_percent: pct(p1m),
    change_3m_percent: pct(p3m),
  }
}
