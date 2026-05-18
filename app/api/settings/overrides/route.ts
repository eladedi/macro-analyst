import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Manual overrides (Spec §8.14 / Brief §10). Append-only audit: DELETE
// disables rather than hard-deletes, preserving the trail.
export async function GET() {
  const overrides = await sql`
    SELECT mo.id, mo.metric_id, m.name AS metric_name, mo.override_type,
           mo.override_value, mo.reason, mo.enabled,
           mo.created_at::text AS created_at
    FROM manual_overrides mo
    JOIN metrics m ON m.id = mo.metric_id
    ORDER BY mo.created_at DESC`
  return Response.json({ overrides })
}

export async function POST(req: Request) {
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as {
    metric_id?: string
    override_type?: 'value' | 'score' | 'weight' | 'note'
    override_value?: unknown
    reason?: string
  }
  if (!body.metric_id || !body.override_type) {
    return Response.json({ error: 'metric_id and override_type are required' }, { status: 400 })
  }
  if (body.override_type === 'score' || body.override_type === 'weight') {
    if (typeof body.override_value !== 'number') {
      return Response.json(
        { error: `${body.override_type} override_value must be a number` },
        { status: 400 }
      )
    }
  }
  const [row] = await sql`
    INSERT INTO manual_overrides (metric_id, override_type, override_value, reason, enabled)
    VALUES (${body.metric_id}, ${body.override_type},
            ${sql.json((body.override_value ?? null) as never)},
            ${body.reason ?? null}, true)
    RETURNING id, created_at::text AS created_at`
  return Response.json({ ok: true, override: row })
}

export async function DELETE(req: Request) {
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })
  const [row] = await sql`
    UPDATE manual_overrides SET enabled = false, updated_at = now()
    WHERE id = ${id} RETURNING id`
  if (!row) return Response.json({ error: 'override not found' }, { status: 404 })
  return Response.json({ ok: true, disabled: row.id })
}
