import { refreshSnapshot } from '@/lib/snapshots/refresh'

// Hits FRED + writes the DB — server-side, Node runtime, never static.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const payload = await refreshSnapshot()
    return Response.json(payload, { status: 200 })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
