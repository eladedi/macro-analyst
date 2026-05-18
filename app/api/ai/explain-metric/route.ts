import { runInterpretation } from '@/lib/ai/interpret'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Spec §15.7 — explain a single metric.
export async function POST(req: Request) {
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as {
    metric_id?: string
    snapshot_id?: string
  }
  if (!body.metric_id) {
    return Response.json({ error: 'metric_id is required' }, { status: 400 })
  }
  try {
    const result = await runInterpretation({
      type: 'metric',
      metricId: body.metric_id,
      snapshotId: body.snapshot_id,
    })
    return Response.json(result, { status: 200 })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
