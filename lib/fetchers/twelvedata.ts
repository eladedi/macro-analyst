/**
 * Twelve Data API client (server-side only). Fetches a daily time series for
 * one symbol. Key is read from the environment and never leaves the server.
 *
 * Docs: https://twelvedata.com/docs#time-series
 */

const TD_BASE = 'https://api.twelvedata.com/time_series'

// ~120 daily points: >3 months for the Phase 5 change calculations.
export const TD_OUTPUTSIZE = 120

export interface TdObservation {
  date: string // YYYY-MM-DD
  value: number // close
}

export class TwelveDataError extends Error {}

interface TdResponse {
  status?: string
  code?: number
  message?: string
  values?: { datetime: string; close: string }[]
}

/**
 * Returns daily closes newest-first. Throws TwelveDataError on a missing key,
 * API error envelope (status !== "ok"), rate limit, or empty series.
 */
export async function fetchTwelveDataSeries(
  symbol: string,
  apiKey: string
): Promise<TdObservation[]> {
  if (!apiKey) throw new TwelveDataError('TWELVE_DATA_API_KEY is not set')

  const url = new URL(TD_BASE)
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('interval', '1day')
  url.searchParams.set('outputsize', String(TD_OUTPUTSIZE))
  url.searchParams.set('order', 'desc')
  url.searchParams.set('format', 'JSON')
  url.searchParams.set('apikey', apiKey)

  const ac = new AbortController()
  const timeout = setTimeout(() => ac.abort(), 15_000)
  let res: Response
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ac.signal })
  } catch (e) {
    const msg = ac.signal.aborted ? 'request timed out after 15s' : (e as Error).message
    throw new TwelveDataError(`Network error fetching ${symbol}: ${msg}`)
  } finally {
    clearTimeout(timeout)
  }

  let body: TdResponse
  try {
    body = (await res.json()) as TdResponse
  } catch {
    throw new TwelveDataError(`Twelve Data returned non-JSON for ${symbol} (HTTP ${res.status})`)
  }

  // Twelve Data returns HTTP 200 with an error envelope: {status:"error",code,message}
  if (body.status !== 'ok' || !Array.isArray(body.values)) {
    const detail = body.message ?? `status=${body.status ?? 'unknown'}`
    if (body.code === 429) throw new TwelveDataError(`Twelve Data rate limited for ${symbol}`)
    throw new TwelveDataError(`Twelve Data error for ${symbol}: ${detail}`)
  }

  const parsed = body.values
    .map((v) => ({ date: v.datetime.slice(0, 10), value: Number(v.close) }))
    .filter((o) => o.date && Number.isFinite(o.value))

  if (parsed.length === 0) {
    throw new TwelveDataError(`No usable observations returned for ${symbol}`)
  }

  return parsed
}
