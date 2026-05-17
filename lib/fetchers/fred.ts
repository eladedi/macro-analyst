/**
 * FRED API client (server-side only). Fetches recent observations for a single
 * FRED series. The API key is read from the environment and never leaves the
 * server.
 *
 * Docs: https://fred.stlouisfed.org/docs/api/fred/series_observations.html
 */

const FRED_BASE = 'https://api.stlouisfed.org/fred'

// Latest 120 observations covers >3 months for daily series and years for
// weekly/monthly series — enough history for the Phase 5 change calculations.
export const FRED_OBSERVATION_LIMIT = 120

export interface FredObservation {
  date: string // YYYY-MM-DD, the period the value refers to
  value: number
}

export class FredError extends Error {}

interface FredObservationsResponse {
  observations?: { date: string; value: string }[]
  error_message?: string
}

/**
 * Returns recent observations newest-first, with FRED missing values (".")
 * dropped. Throws FredError on a missing key, API error, or empty series.
 */
export async function fetchFredObservations(
  seriesId: string,
  apiKey: string
): Promise<FredObservation[]> {
  if (!apiKey) throw new FredError('FRED_API_KEY is not set')

  const url = new URL(`${FRED_BASE}/series/observations`)
  url.searchParams.set('series_id', seriesId)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('sort_order', 'desc')
  url.searchParams.set('limit', String(FRED_OBSERVATION_LIMIT))

  let res: Response
  const ac = new AbortController()
  const timeout = setTimeout(() => ac.abort(), 15_000)
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ac.signal })
  } catch (e) {
    const msg = ac.signal.aborted ? 'request timed out after 15s' : (e as Error).message
    throw new FredError(`Network error fetching ${seriesId}: ${msg}`)
  } finally {
    clearTimeout(timeout)
  }

  let body: FredObservationsResponse
  try {
    body = (await res.json()) as FredObservationsResponse
  } catch {
    throw new FredError(`FRED returned non-JSON for ${seriesId} (HTTP ${res.status})`)
  }

  if (!res.ok || body.error_message) {
    throw new FredError(
      `FRED error for ${seriesId} (HTTP ${res.status}): ${body.error_message ?? 'unknown'}`
    )
  }

  const parsed = (body.observations ?? [])
    .filter((o) => o.value !== '.' && o.value !== '')
    .map((o) => ({ date: o.date, value: Number(o.value) }))
    .filter((o) => Number.isFinite(o.value))

  if (parsed.length === 0) {
    throw new FredError(`No usable observations returned for ${seriesId}`)
  }

  return parsed
}
