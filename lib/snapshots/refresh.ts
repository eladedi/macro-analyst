/**
 * Refresh orchestrator — the core MVP loop (Spec §15.3, 14 steps):
 * FRED fetch → load → score → what-changed → persist snapshot → payload.
 *
 * FRED failures are non-fatal: scoring proceeds on whatever is already in
 * metric_values (the failure is surfaced in the server log), so a transient
 * FRED outage still produces a snapshot from the last good data.
 */
import { sql } from '../db'
import { runFredFetch } from '../fetchers/run-fred-fetch'
import { loadEngineInputs } from './load-inputs'
import { computeSnapshot } from '../scoring/compute-snapshot'
import { whatChanged, type WhatChanged } from './what-changed'
import { saveSnapshot } from './save-snapshot'

export interface RefreshPayload {
  snapshot: {
    id: string
    created_at: string
    market_score: number
    oscillator_value: number
    regime_label: string
    investor_posture: string | null
    trend: string
    confidence: string
    data_freshness: string
  }
  category_scores: Array<{
    category: string
    raw_category_score: number
    category_weight: number
    weighted_contribution: number
  }>
  metrics: Array<{
    metric_id: string
    value: number | null
    raw_score: number
    weighted_contribution: number
    source: string
    freshness: string
    confidence: string
  }>
  what_changed: WhatChanged
}

export async function refreshSnapshot(): Promise<RefreshPayload> {
  // Steps 1–4: fetch + store latest values (non-fatal on failure).
  try {
    const fred = await runFredFetch()
    if (fred.failed > 0) {
      console.warn(
        `refresh: FRED fetch had ${fred.failed}/${fred.total} failures:`,
        fred.results.filter((r) => !r.ok).map((r) => `${r.metricId}: ${r.error}`)
      )
    }
  } catch (e) {
    console.error('refresh: FRED fetch threw, proceeding on existing data:', e)
  }

  // Steps 5–12: load + compute.
  const { engineParams, previousRawScores, metricMeta } = await loadEngineInputs(sql)
  const snap = computeSnapshot(engineParams)

  const wc = whatChanged(
    snap.metrics,
    previousRawScores,
    snap.marketScore,
    engineParams.previousMarketScore
  )

  // Step 13: persist.
  const saved = await saveSnapshot(sql, snap, metricMeta)

  // Step 14: payload (Spec §15.3 shape).
  return {
    snapshot: {
      id: saved.id,
      created_at: saved.createdAt,
      market_score: snap.marketScore,
      oscillator_value: snap.oscillatorValue,
      regime_label: snap.regimeLabel,
      investor_posture: snap.investorPosture,
      trend: snap.trend,
      confidence: snap.confidence,
      data_freshness: snap.dataFreshness,
    },
    category_scores: snap.categoryScores
      .filter((c) => c.rawCategoryScore !== null && c.weightedContribution !== null)
      .map((c) => ({
        category: c.categoryId,
        raw_category_score: c.rawCategoryScore as number,
        category_weight: c.categoryWeight,
        weighted_contribution: c.weightedContribution as number,
      })),
    metrics: snap.metrics.map((m) => ({
      metric_id: m.metricId,
      value: m.value,
      raw_score: m.rawScore,
      weighted_contribution: m.weightedContribution,
      source: metricMeta.get(m.metricId)?.sourceName ?? 'unknown',
      freshness: m.freshness,
      confidence: m.confidence,
    })),
    what_changed: wc,
  }
}
