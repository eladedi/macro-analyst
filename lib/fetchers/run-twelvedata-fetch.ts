/**
 * Twelve Data fetch orchestrator. Mirrors the FRED orchestrator: loads enabled
 * twelve_data-sourced metrics, fetches each daily series, derives
 * freshness/confidence, and upserts the window into metric_values
 * idempotently. On failure a metric is reported unavailable — never silently
 * re-sourced (Spec §16.1).
 *
 * Relative imports only — runs under Next routes and tsx.
 */
import { sql } from '../db'
import type { ConfidenceLevel } from '../db/types'
import { fetchTwelveDataSeries, TwelveDataError } from './twelvedata'
import { computeFreshness, computeConfidence } from './freshness'
import type { MetricFetchResult } from './run-fred-fetch'

interface TdMetricRow {
  id: string
  name: string
  source_symbol: string
  source_primary_id: string
  freshness_window_hours: number
  confidence_default: ConfidenceLevel
}

export interface TwelveDataFetchSummary {
  startedAt: string
  finishedAt: string
  total: number
  succeeded: number
  failed: number
  results: MetricFetchResult[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function runTwelveDataFetch(): Promise<TwelveDataFetchSummary> {
  const startedAt = new Date().toISOString()
  const apiKey = process.env.TWELVE_DATA_API_KEY ?? ''

  const metrics = await sql<TdMetricRow[]>`
    SELECT id, name, source_symbol, source_primary_id,
           freshness_window_hours, confidence_default
    FROM metrics
    WHERE enabled = true AND source_primary_id = 'twelve_data'
    ORDER BY display_order`

  const results: MetricFetchResult[] = []

  for (let i = 0; i < metrics.length; i++) {
    const m = metrics[i]
    try {
      if (!apiKey) throw new TwelveDataError('TWELVE_DATA_API_KEY is not set')

      const observations = await fetchTwelveDataSeries(m.source_symbol, apiKey)
      const latest = observations[0] // newest-first
      const latestDate = new Date(latest.date + 'T00:00:00Z')

      const freshness = computeFreshness(latestDate, m.freshness_window_hours)
      const confidence = computeConfidence(freshness, m.confidence_default)

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
    // Free tier = 8 credits/min. With 8 metrics, ~8s spacing keeps a full
    // run within the limit (a manual refresh, so the ~1 min is acceptable).
    if (i < metrics.length - 1) await sleep(8_000)
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
