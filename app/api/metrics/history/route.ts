import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Time series from metric_values for charts + sparklines.
// ?ids=m2,vix  (optional — defaults to every metric that has data)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get('ids')
  const ids = idsParam ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : null

  const rows = await sql<
    { metric_id: string; name: string; unit: string; timestamp: string; value: number }[]
  >`
    SELECT mv.metric_id, m.name, m.unit,
           mv."timestamp"::text AS timestamp, mv.value::float8 AS value
    FROM metric_values mv
    JOIN metrics m ON m.id = mv.metric_id
    WHERE mv.value IS NOT NULL
      AND (${ids}::text[] IS NULL OR mv.metric_id = ANY(${ids}::text[]))
    ORDER BY mv.metric_id, mv."timestamp"`

  const series: Record<string, { name: string; unit: string; points: { t: string; v: number }[] }> = {}
  for (const r of rows) {
    if (!series[r.metric_id]) series[r.metric_id] = { name: r.name, unit: r.unit, points: [] }
    series[r.metric_id].points.push({ t: r.timestamp, v: r.value })
  }

  return Response.json({ series })
}
