/**
 * FRED fetch orchestrator. Loads enabled FRED-sourced metrics, applies the
 * source-priority rule (Spec §16.1: primary → fallback → unavailable, never a
 * silent swap), fetches each series, derives freshness/confidence, and upserts
 * the observation window into metric_values idempotently.
 *
 * Used by both the API route and the CLI — keep imports relative so it runs
 * under tsx (which does not resolve the "@/" tsconfig alias).
 */
import { sql } from '../db'
import type { ConfidenceLevel } from '../db/types'
import { fetchFredObservations, FredError } from './fred'
import { computeFreshness, computeConfidence, type FetchFreshness } from './freshness'

interface FredMetricRow {
  id: string
  name: string
  source_symbol: string
  source_primary_id: string
  source_fallback_id: string | null
  freshness_window_hours: number
  confidence_default: ConfidenceLevel
}

export interface MetricFetchResult {
  metricId: string
  name: string
  ok: boolean
  sourceUsed?: string
  latestValue?: number
  latestDate?: string
  observationsStored?: number
  freshness?: FetchFreshness
  confidence?: ConfidenceLevel
  error?: string
}

export interface FredFetchSummary {
  startedAt: string
  finishedAt: string
  total: number
  succeeded: number
  failed: number
  results: MetricFetchResult[]
}

export async function runFredFetch(): Promise<FredFetchSummary> {
  const startedAt = new Date().toISOString()
  const apiKey = process.env.FRED_API_KEY ?? ''

  const metrics = await sql<FredMetricRow[]>`
    SELECT id, name, source_symbol, source_primary_id, source_fallback_id,
           freshness_window_hours, confidence_default
    FROM metrics
    WHERE enabled = true AND source_primary_id = 'fred'
    ORDER BY display_order`

  const results: MetricFetchResult[] = []

  for (const m of metrics) {
    // Source priority: only the FRED fetcher exists in this phase, so the
    // chain is [primary]. No fallback is defined for FRED metrics; on failure
    // the metric is reported unavailable rather than silently re-sourced.
    try {
      if (!apiKey) throw new FredError('FRED_API_KEY is not set')

      const observations = await fetchFredObservations(m.source_symbol, apiKey)
      const latest = observations[0] // newest-first
      const latestDate = new Date(latest.date + 'T00:00:00Z')

      const freshness = computeFreshness(latestDate, m.freshness_window_hours)
      const confidence = computeConfidence(freshness, m.confidence_default)

      // Per metric, only value + timestamp vary; metric_id, source, freshness,
      // confidence and metadata are constant — so one batched statement
      // (unnest) instead of one round-trip per observation.
      const values = observations.map((o) => o.value)
      const dates = observations.map((o) => o.date)
      const meta = { source_symbol: m.source_symbol, fetched_at: startedAt }

      await sql`
        INSERT INTO metric_values
          (metric_id, value, value_text, "timestamp", source_id, freshness, confidence, metadata)
        SELECT ${m.id}, v.value, ${null}::text, v.ts::date, ${m.source_primary_id},
               ${freshness}::freshness, ${confidence}::confidence, ${sql.json(meta)}
        FROM unnest(${sql.array(values)}::numeric[], ${sql.array(dates)}::text[]) AS v(value, ts)
        ON CONFLICT (metric_id, "timestamp", source_id) DO UPDATE SET
          value = EXCLUDED.value,
          freshness = EXCLUDED.freshness,
          confidence = EXCLUDED.confidence,
          metadata = EXCLUDED.metadata`

      results.push({
        metricId: m.id,
        name: m.name,
        ok: true,
        sourceUsed: m.source_primary_id,
        latestValue: latest.value,
        latestDate: latest.date,
        observationsStored: observations.length,
        freshness,
        confidence,
      })
    } catch (e) {
      results.push({
        metricId: m.id,
        name: m.name,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const succeeded = results.filter((r) => r.ok).length
  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    results,
  }
}
