/**
 * Loads everything the scoring engine + snapshot persistence need from the DB
 * in one place, so the preview CLI and the refresh endpoint never drift.
 *
 * Relative imports only — runs under both Next and tsx.
 */
import type { Sql } from 'postgres'
import type { ConfidenceLevel, Freshness } from '../db/types'
import { computeChanges, type Observation } from '../scoring/changes'
import type { RuleConfig } from '../scoring/rules'
import type {
  EngineParams,
  EngineCategoryInput,
  EngineMetricInput,
} from '../scoring/compute-snapshot'
import type { RegimeBand } from '../scoring/regime'

export interface MetricMeta {
  sourceId: string
  sourceName: string
  categoryId: string
  latestValueId: string | null
}

export interface LoadedInputs {
  engineParams: EngineParams
  previousSnapshotId: string | null
  previousRawScores: Map<string, number>
  metricMeta: Map<string, MetricMeta>
}

export async function loadEngineInputs(sql: Sql): Promise<LoadedInputs> {
  const categories = await sql<EngineCategoryInput[]>`
    SELECT id AS "categoryId", name, weight::float8 AS weight, enabled
    FROM categories ORDER BY display_order`

  const rules = await sql<{ metric_id: string; rule_config: RuleConfig }[]>`
    SELECT metric_id, rule_config FROM scoring_rules WHERE enabled = true`
  const ruleByMetric = new Map(rules.map((r) => [r.metric_id, r.rule_config]))

  const metricRows = await sql<
    {
      id: string
      name: string
      category_id: string
      metric_weight: number
      enabled: boolean
      source_primary_id: string
    }[]
  >`
    SELECT id, name, category_id, metric_weight::float8 AS metric_weight,
           enabled, source_primary_id
    FROM metrics ORDER BY display_order`

  const sources = await sql<{ id: string; name: string }[]>`SELECT id, name FROM data_sources`
  const sourceName = new Map(sources.map((s) => [s.id, s.name.split(' (')[0]]))

  // Ascending by timestamp → last row seen per metric is the latest.
  const values = await sql<
    {
      id: string
      metric_id: string
      value: number
      timestamp: string
      freshness: Freshness
      confidence: ConfidenceLevel
    }[]
  >`
    SELECT id, metric_id, value::float8 AS value, "timestamp"::text AS timestamp,
           freshness, confidence
    FROM metric_values ORDER BY metric_id, "timestamp"`

  const obsByMetric = new Map<string, Observation[]>()
  const latest = new Map<
    string,
    { id: string; freshness: Freshness; confidence: ConfidenceLevel }
  >()
  for (const v of values) {
    if (!obsByMetric.has(v.metric_id)) obsByMetric.set(v.metric_id, [])
    obsByMetric.get(v.metric_id)!.push({ value: v.value, timestamp: v.timestamp })
    latest.set(v.metric_id, { id: v.id, freshness: v.freshness, confidence: v.confidence })
  }

  // Manual overrides (Spec §8.14) — enabled rows, later wins per type.
  const ovRows = await sql<
    { metric_id: string; override_type: string; override_value: unknown; reason: string | null }[]
  >`
    SELECT metric_id, override_type, override_value, reason
    FROM manual_overrides WHERE enabled = true ORDER BY created_at`
  const overrideByMetric = new Map<
    string,
    { metricWeight?: number; scoreOverride?: { score: number; reason: string }; note?: string }
  >()
  for (const o of ovRows) {
    const cur = overrideByMetric.get(o.metric_id) ?? {}
    if (o.override_type === 'weight') cur.metricWeight = Number(o.override_value)
    else if (o.override_type === 'score')
      cur.scoreOverride = { score: Number(o.override_value), reason: o.reason ?? 'manual override' }
    else if (o.override_type === 'note') cur.note = String(o.override_value ?? o.reason ?? '')
    // 'value' overrides are accepted/stored but not applied in MVP.
    overrideByMetric.set(o.metric_id, cur)
  }

  const metricMeta = new Map<string, MetricMeta>()
  const metrics: EngineMetricInput[] = metricRows.map((m) => {
    const q = latest.get(m.id)
    const ov = overrideByMetric.get(m.id)
    metricMeta.set(m.id, {
      sourceId: m.source_primary_id,
      sourceName: sourceName.get(m.source_primary_id) ?? m.source_primary_id,
      categoryId: m.category_id,
      latestValueId: q?.id ?? null,
    })
    return {
      metricId: m.id,
      name: m.name,
      categoryId: m.category_id,
      metricWeight: ov?.metricWeight ?? m.metric_weight,
      enabled: m.enabled,
      ruleConfig: ruleByMetric.get(m.id) as RuleConfig,
      changes: computeChanges(obsByMetric.get(m.id) ?? []),
      freshness: q?.freshness ?? 'stale',
      confidence: q?.confidence ?? 'low',
      scoreOverride: ov?.scoreOverride ?? null,
      note: ov?.note ?? null,
    }
  })

  const regimeBands = await sql<RegimeBand[]>`
    SELECT min_score::float8, max_score::float8, regime_label, posture
    FROM regime_thresholds`

  const prev = await sql<{ id: string; market_score: number }[]>`
    SELECT id, market_score::float8 AS market_score
    FROM snapshots ORDER BY created_at DESC LIMIT 1`
  const previousSnapshotId = prev[0]?.id ?? null
  const previousMarketScore = prev[0]?.market_score ?? null

  const previousRawScores = new Map<string, number>()
  if (previousSnapshotId) {
    const ps = await sql<{ metric_id: string; raw_score: number }[]>`
      SELECT metric_id, raw_score::float8 AS raw_score
      FROM metric_scores WHERE snapshot_id = ${previousSnapshotId}`
    for (const r of ps) previousRawScores.set(r.metric_id, r.raw_score)
  }

  return {
    engineParams: { categories, metrics, regimeBands, previousMarketScore },
    previousSnapshotId,
    previousRawScores,
    metricMeta,
  }
}
