import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Spec §15.2 — latest metric values + scores (from the most recent snapshot).
export async function GET() {
  const [latest] = await sql<{ id: string }[]>`
    SELECT id FROM snapshots ORDER BY created_at DESC LIMIT 1`
  const snapshotId = latest?.id ?? null

  const metrics = await sql`
    SELECT
      m.id AS metric_id, m.name, m.unit,
      c.id AS category_id, c.name AS category,
      c.weight::float8 AS category_weight,
      m.metric_weight::float8 AS metric_weight,
      ds.name AS source,
      ms.raw_score::float8 AS raw_score, ms.trend,
      ms.weighted_contribution::float8 AS weighted_contribution,
      mv.value::float8 AS value, mv."timestamp"::text AS timestamp,
      mv.freshness, mv.confidence
    FROM metrics m
    JOIN categories c ON c.id = m.category_id
    LEFT JOIN data_sources ds ON ds.id = m.source_primary_id
    LEFT JOIN LATERAL (
      SELECT raw_score, trend, weighted_contribution
      FROM metric_scores
      WHERE metric_id = m.id AND snapshot_id = ${snapshotId}
      LIMIT 1
    ) ms ON true
    LEFT JOIN LATERAL (
      SELECT value, "timestamp", freshness, confidence
      FROM metric_values WHERE metric_id = m.id
      ORDER BY "timestamp" DESC LIMIT 1
    ) mv ON true
    ORDER BY m.display_order`

  return Response.json({ snapshot_id: snapshotId, metrics })
}
