/**
 * Score preview — loads current config + metric_values from Supabase, runs the
 * Phase 5 scoring engine, and prints the snapshot that WOULD be produced.
 * Read-only: nothing is persisted (snapshots are Phase 6).
 *
 *   npm run score:preview
 */
import { sql } from '../lib/db'
import type { ConfidenceLevel, Freshness } from '../lib/db/types'
import { computeChanges, type Observation } from '../lib/scoring/changes'
import type { RuleConfig } from '../lib/scoring/rules'
import {
  computeSnapshot,
  type EngineMetricInput,
  type EngineCategoryInput,
} from '../lib/scoring/compute-snapshot'

async function main() {
  try {
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
      }[]
    >`
      SELECT id, name, category_id, metric_weight::float8 AS metric_weight, enabled
      FROM metrics ORDER BY display_order`

    const values = await sql<
      { metric_id: string; value: number; timestamp: string; freshness: Freshness; confidence: ConfidenceLevel }[]
    >`
      SELECT metric_id, value::float8 AS value, "timestamp"::text AS timestamp,
             freshness, confidence
      FROM metric_values ORDER BY metric_id, "timestamp"`

    const obsByMetric = new Map<string, Observation[]>()
    const latestQualityByMetric = new Map<string, { freshness: Freshness; confidence: ConfidenceLevel }>()
    for (const v of values) {
      if (!obsByMetric.has(v.metric_id)) obsByMetric.set(v.metric_id, [])
      obsByMetric.get(v.metric_id)!.push({ value: v.value, timestamp: v.timestamp })
      // rows are timestamp-ascending, so the last seen is the latest
      latestQualityByMetric.set(v.metric_id, { freshness: v.freshness, confidence: v.confidence })
    }

    const metrics: EngineMetricInput[] = metricRows.map((m) => {
      const obs = obsByMetric.get(m.id) ?? []
      const q = latestQualityByMetric.get(m.id)
      return {
        metricId: m.id,
        name: m.name,
        categoryId: m.category_id,
        metricWeight: m.metric_weight,
        enabled: m.enabled,
        ruleConfig: ruleByMetric.get(m.id) as RuleConfig,
        changes: computeChanges(obs),
        freshness: q?.freshness ?? 'stale',
        confidence: q?.confidence ?? 'low',
      }
    })

    const regimeBands = await sql<
      { min_score: number; max_score: number; regime_label: string; posture: string | null }[]
    >`SELECT min_score::float8, max_score::float8, regime_label, posture FROM regime_thresholds`

    const snap = computeSnapshot({
      categories,
      metrics,
      regimeBands,
      previousMarketScore: null, // snapshots table is empty until Phase 6
    })

    const r2 = (n: number) => Math.round(n * 100) / 100

    console.log('\n=== Score Preview (read-only — not persisted) ===\n')
    console.log(`  Market Score : ${r2(snap.marketScore)} / 100`)
    console.log(`  Oscillator   : ${r2(snap.oscillatorValue)}`)
    console.log(`  Regime       : ${snap.regimeLabel}  (posture: ${snap.investorPosture})`)
    console.log(`  Trend        : ${snap.trend}`)
    console.log(`  Confidence   : ${snap.confidence}   Data freshness: ${snap.dataFreshness}`)

    console.log('\n  Category scores:')
    for (const c of snap.categoryScores) {
      const s = c.rawCategoryScore === null ? '   — (no data)' : r2(c.rawCategoryScore).toFixed(2).padStart(7)
      console.log(
        `    ${c.name.padEnd(16)} ${s}   wt ${(c.categoryWeight * 100).toFixed(0).padStart(2)}%   ` +
          `contrib ${c.weightedContribution === null ? '—' : r2(c.weightedContribution)}   (${c.metricCount} metrics)`
      )
    }

    console.log('\n  Top positive:', snap.topPositiveSignals.join(' | ') || '(none)')
    console.log('  Top negative:', snap.topNegativeSignals.join(' | ') || '(none)')

    console.log('\n  Scored metrics:')
    for (const m of snap.metrics) {
      console.log(
        `    ${m.metricId.padEnd(20)} raw ${String(m.rawScore).padStart(2)}  ` +
          `${m.trend.padEnd(7)} contrib ${r2(m.weightedContribution).toFixed(4).padStart(8)}  ` +
          `[${m.freshness}/${m.confidence}]  ${m.reason}`
      )
    }
    console.log('')
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
