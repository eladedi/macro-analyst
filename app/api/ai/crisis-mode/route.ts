import { runInterpretation } from '@/lib/ai/interpret'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Spec §17.4 — crisis-mode stress analysis of a snapshot (defaults to latest).
export async function POST(req: Request) {
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as { snapshot_id?: string }
  try {
    const result = await runInterpretation({ type: 'crisis', snapshotId: body.snapshot_id })
    return Response.json(result, { status: 200 })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
