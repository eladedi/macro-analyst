import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Spec §15.4 — historical snapshots (limit default 30, optional from/to).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(365, Math.max(1, Number(searchParams.get('limit')) || 30))
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const snapshots = await sql`
    SELECT id, created_at::text AS created_at,
           market_score::float8 AS market_score,
           oscillator_value::float8 AS oscillator_value,
           regime_label, investor_posture, trend, confidence, data_freshness,
           top_positive_signals, top_negative_signals
    FROM snapshots
    WHERE (${from}::timestamptz IS NULL OR created_at >= ${from}::timestamptz)
      AND (${to}::timestamptz IS NULL OR created_at <= ${to}::timestamptz)
    ORDER BY created_at DESC
    LIMIT ${limit}`

  return Response.json({ snapshots })
}
