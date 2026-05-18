import { runInterpretation } from '@/lib/ai/interpret'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Spec §17.3 — weekly macro regime review across recent snapshots.
export async function POST(req: Request) {
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const result = await runInterpretation({ type: 'weekly' })
    return Response.json(result, { status: 200 })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
