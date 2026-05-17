import { runFredFetch } from '@/lib/fetchers/run-fred-fetch'

// Hits an external API and writes the DB — must run server-side on Node.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // Optional shared-secret gate. Until D2 auth lands, this protects the
  // write endpoint when AUTH_SECRET is set (e.g. in deployment); unset in
  // local dev means open, which is acceptable personal-first.
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const summary = await runFredFetch()
    return Response.json(summary, { status: summary.failed === 0 ? 200 : 207 })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
