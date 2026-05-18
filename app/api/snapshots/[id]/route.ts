import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Spec §15.5 — full snapshot detail.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params

  // `latest` resolves to the most recent snapshot so the dashboard needs one call.
  let id = raw
  if (raw === 'latest') {
    const [recent] = await sql<{ id: string }[]>`
      SELECT id FROM snapshots ORDER BY created_at DESC LIMIT 1`
    if (!recent) return Response.json({ error: 'no snapshots yet' }, { status: 404 })
    id = recent.id
  }

  const [snapshot] = await sql`
    SELECT id, created_at::text AS created_at,
           market_score::float8 AS market_score,
           oscillator_value::float8 AS oscillator_value,
           regime_label, investor_posture, trend, confidence, data_freshness,
           top_positive_signals, top_negative_signals, notes
    FROM snapshots WHERE id = ${id}`

  if (!snapshot) {
    return Response.json({ error: 'snapshot not found' }, { status: 404 })
  }

  const category_scores = await sql`
    SELECT cs.category_id, c.name AS category,
           cs.raw_category_score::float8 AS raw_category_score,
           cs.category_weight::float8 AS category_weight,
           cs.weighted_contribution::float8 AS weighted_contribution
    FROM category_scores cs
    JOIN categories c ON c.id = cs.category_id
    WHERE cs.snapshot_id = ${id}
    ORDER BY c.display_order`

  const metrics = await sql`
    SELECT ms.metric_id, m.name, m.category_id,
           ms.raw_score::float8 AS raw_score, ms.trend,
           ms.change_1d::float8 AS change_1d, ms.change_1w::float8 AS change_1w,
           ms.change_1m::float8 AS change_1m, ms.change_3m::float8 AS change_3m,
           ms.score_reason,
           ms.weighted_contribution::float8 AS weighted_contribution
    FROM metric_scores ms
    JOIN metrics m ON m.id = ms.metric_id
    WHERE ms.snapshot_id = ${id}
    ORDER BY m.display_order`

  return Response.json({ snapshot, category_scores, metrics })
}
