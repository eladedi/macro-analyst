import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Spec §15.10 — list editable prompt templates.
export async function GET() {
  const prompts = await sql`
    SELECT id, name, slug, description, prompt_text, variables,
           output_format, enabled, version
    FROM prompt_templates ORDER BY name`
  return Response.json({ prompts })
}

// Spec §15.11 — update a prompt template; takes effect on the next AI call.
export async function PUT(req: Request) {
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as {
    id?: string
    prompt_text?: string
    enabled?: boolean
  }
  if (!body.id || typeof body.prompt_text !== 'string') {
    return Response.json({ error: 'id and prompt_text are required' }, { status: 400 })
  }

  const [updated] = await sql`
    UPDATE prompt_templates
    SET prompt_text = ${body.prompt_text},
        enabled = ${body.enabled ?? true},
        updated_at = now()
    WHERE id = ${body.id}
    RETURNING id, name, slug, prompt_text, enabled`
  if (!updated) {
    return Response.json({ error: 'prompt template not found' }, { status: 404 })
  }
  return Response.json({ prompt: updated })
}
