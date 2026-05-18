import { runTwelveDataFetch } from '@/lib/fetchers/run-twelvedata-fetch'

// Hits an external API and writes the DB — must run server-side on Node.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const summary = await runTwelveDataFetch()
    return Response.json(summary, { status: summary.failed === 0 ? 200 : 207 })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
