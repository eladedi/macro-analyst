/**
 * Persists a computed snapshot across snapshots, metric_scores,
 * category_scores and snapshot_metrics in one transaction (Brief §15).
 */
import type { Sql } from 'postgres'
import type { ComputedSnapshot } from '../scoring/compute-snapshot'
import type { MetricMeta } from './load-inputs'

export interface SavedSnapshot {
  id: string
  createdAt: string
}

export async function saveSnapshot(
  sql: Sql,
  snap: ComputedSnapshot,
  metricMeta: Map<string, MetricMeta>
): Promise<SavedSnapshot> {
  return sql.begin(async (tx) => {
    const [row] = await tx<{ id: string; created_at: string }[]>`
      INSERT INTO snapshots
        (market_score, oscillator_value, regime_label, investor_posture,
         trend, confidence, data_freshness, top_positive_signals, top_negative_signals)
      VALUES
        (${snap.marketScore}, ${snap.oscillatorValue}, ${snap.regimeLabel},
         ${snap.investorPosture}, ${snap.trend}, ${snap.confidence},
         ${snap.dataFreshness}, ${tx.json(snap.topPositiveSignals)},
         ${tx.json(snap.topNegativeSignals)})
      RETURNING id, created_at::text AS created_at`
    const snapshotId = row.id

    const scoreIdByMetric = new Map<string, string>()
    for (const m of snap.metrics) {
      const c = m.changes
      const [ms] = await tx<{ id: string }[]>`
        INSERT INTO metric_scores
          (metric_id, snapshot_id, raw_score, trend, change_1d, change_1w,
           change_1m, change_3m, score_reason, weighted_contribution)
        VALUES
          (${m.metricId}, ${snapshotId}, ${m.rawScore}, ${m.trend},
           ${c?.change_1d ?? null}, ${c?.change_1w ?? null},
           ${c?.change_1m ?? null}, ${c?.change_3m ?? null},
           ${m.reason}, ${m.weightedContribution})
        RETURNING id`
      scoreIdByMetric.set(m.metricId, ms.id)
    }

    for (const cat of snap.categoryScores) {
      if (cat.rawCategoryScore === null || cat.weightedContribution === null) continue
      await tx`
        INSERT INTO category_scores
          (snapshot_id, category_id, raw_category_score, category_weight, weighted_contribution)
        VALUES
          (${snapshotId}, ${cat.categoryId}, ${cat.rawCategoryScore},
           ${cat.categoryWeight}, ${cat.weightedContribution})`
    }

    for (const m of snap.metrics) {
      const meta = metricMeta.get(m.metricId)
      await tx`
        INSERT INTO snapshot_metrics
          (snapshot_id, metric_id, metric_value_id, metric_score_id, category_id)
        VALUES
          (${snapshotId}, ${m.metricId}, ${meta?.latestValueId ?? null},
           ${scoreIdByMetric.get(m.metricId) ?? null}, ${m.categoryId})`
    }

    return { id: snapshotId, createdAt: row.created_at }
  })
}
