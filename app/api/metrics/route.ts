import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Spec §15.1 — metric definitions.
export async function GET() {
  const metrics = await sql`
    SELECT m.id, m.name, m.slug, m.category_id, c.name AS category, m.unit,
           m.metric_weight::float8 AS metric_weight,
           m.source_primary_id AS source, m.enabled
    FROM metrics m
    JOIN categories c ON c.id = m.category_id
    ORDER BY m.display_order`
  return Response.json({ metrics })
}
