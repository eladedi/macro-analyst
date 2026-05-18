import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Saved interpretations, newest-first (append-only history, D9).
// Optional ?snapshot_id= filter; ?limit= (default 20).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const snapshotId = searchParams.get('snapshot_id')
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))

  const interpretations = await sql`
    SELECT id, snapshot_id, prompt_template_id, interpretation_type,
           output_text, model, token_usage, created_at::text AS created_at
    FROM ai_interpretations
    WHERE (${snapshotId}::uuid IS NULL OR snapshot_id = ${snapshotId}::uuid)
    ORDER BY created_at DESC
    LIMIT ${limit}`

  return Response.json({ interpretations })
}
