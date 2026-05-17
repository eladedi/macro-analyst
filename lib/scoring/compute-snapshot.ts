/**
 * Snapshot composition — ties the pure pieces together into the full computed
 * result (Spec §10–§14). Pure: callers load data and persist; this only
 * computes. Phase 6 will feed it DB rows and save a snapshot.
 */
import type { Changes } from './changes'
import type { RuleConfig } from './rules'
import { applyScoringRule } from './rules'
import {
  metricContribution,
  categoryScore,
  weightedRawScore,
  marketScore,
  oscillator,
} from './engine'
import { selectRegime, marketTrend, metricTrend, type RegimeBand } from './regime'
import { aggregateQuality } from './confidence'
import type { ConfidenceLevel, Freshness, MetricTrend, SnapshotTrend } from '../db/types'

export interface EngineCategoryInput {
  categoryId: string
  name: string
  weight: number
  enabled: boolean
}

export interface EngineMetricInput {
  metricId: string
  name: string
  categoryId: string
  metricWeight: number
  enabled: boolean
  ruleConfig: RuleConfig
  changes: Changes | null
  freshness: Freshness
  confidence: ConfidenceLevel
}

export interface EngineParams {
  categories: EngineCategoryInput[]
  metrics: EngineMetricInput[]
  regimeBands: RegimeBand[]
  previousMarketScore: number | null
}

export interface ComputedMetric {
  metricId: string
  name: string
  categoryId: string
  rawScore: number
  reason: string
  trend: MetricTrend
  metricWeight: number
  weightedContribution: number
  value: number | null
  freshness: Freshness
  confidence: ConfidenceLevel
}

export interface ComputedCategory {
  categoryId: string
  name: string
  rawCategoryScore: number | null
  categoryWeight: number
  weightedContribution: number | null
  metricCount: number
}

export interface ComputedSnapshot {
  marketScore: number
  oscillatorValue: number
  regimeLabel: string
  investorPosture: string | null
  trend: SnapshotTrend
  confidence: ConfidenceLevel
  dataFreshness: ComputedSnapshotFreshness
  categoryScores: ComputedCategory[]
  metrics: ComputedMetric[]
  topPositiveSignals: string[]
  topNegativeSignals: string[]
}

type ComputedSnapshotFreshness = ReturnType<typeof aggregateQuality>['dataFreshness']

export function computeSnapshot(params: EngineParams): ComputedSnapshot {
  const enabledCategories = new Map(
    params.categories.filter((c) => c.enabled).map((c) => [c.categoryId, c])
  )

  // 1. Score each enabled metric whose category is also enabled.
  const computedMetrics: ComputedMetric[] = []
  for (const m of params.metrics) {
    const cat = enabledCategories.get(m.categoryId)
    if (!m.enabled || !cat) continue

    const { score, reason } = m.changes
      ? applyScoringRule(m.ruleConfig, m.changes)
      : { score: m.ruleConfig.fallback_score, reason: 'no input data' }

    computedMetrics.push({
      metricId: m.metricId,
      name: m.name,
      categoryId: m.categoryId,
      rawScore: score,
      reason,
      trend: metricTrend(m.changes),
      metricWeight: m.metricWeight,
      weightedContribution: metricContribution(score, m.metricWeight, cat.weight),
      value: m.changes?.value ?? null,
      freshness: m.freshness,
      confidence: m.confidence,
    })
  }

  // 2. Category scores (weighted avg of enabled metrics).
  const computedCategories: ComputedCategory[] = []
  for (const c of params.categories) {
    const metricsInCat = computedMetrics.filter((m) => m.categoryId === c.categoryId)
    const cs =
      c.enabled && metricsInCat.length > 0
        ? categoryScore(metricsInCat.map((m) => ({ score: m.rawScore, weight: m.metricWeight })))
        : null
    computedCategories.push({
      categoryId: c.categoryId,
      name: c.name,
      rawCategoryScore: cs,
      categoryWeight: c.weight,
      weightedContribution: cs === null ? null : cs * c.weight,
      metricCount: metricsInCat.length,
    })
  }

  // 3. Weighted raw → Market Score → Oscillator (Spec §10.3–§10.5).
  const active = computedCategories
    .filter((c) => c.rawCategoryScore !== null)
    .map((c) => ({ score: c.rawCategoryScore as number, weight: c.categoryWeight }))
  const wr = weightedRawScore(active)
  const ms = marketScore(wr)
  const osc = oscillator(ms)

  // 4. Regime, trend, quality.
  const regime = selectRegime(params.regimeBands, ms)
  const trend = marketTrend(ms, params.previousMarketScore)
  const quality = aggregateQuality(
    computedMetrics.map((m) => m.freshness),
    computedMetrics.map((m) => m.confidence)
  )

  // 5. Top ± signals by weighted contribution.
  const ranked = [...computedMetrics]
    .filter((m) => m.weightedContribution !== 0)
    .sort((a, b) => b.weightedContribution - a.weightedContribution)
  const fmt = (m: ComputedMetric) => `${m.name} (${m.reason})`
  const topPositiveSignals = ranked.filter((m) => m.weightedContribution > 0).slice(0, 3).map(fmt)
  const topNegativeSignals = ranked
    .filter((m) => m.weightedContribution < 0)
    .slice(-3)
    .reverse()
    .map(fmt)

  return {
    marketScore: ms,
    oscillatorValue: osc,
    regimeLabel: regime.label,
    investorPosture: regime.posture,
    trend,
    confidence: quality.confidence,
    dataFreshness: quality.dataFreshness,
    categoryScores: computedCategories,
    metrics: computedMetrics,
    topPositiveSignals,
    topNegativeSignals,
  }
}
