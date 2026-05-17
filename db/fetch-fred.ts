/**
 * CLI wrapper for the FRED fetch — same orchestrator the API route uses.
 *
 *   npm run fetch:fred
 *
 * Reads FRED_API_KEY + DATABASE_URL from .env.local (via tsx --env-file).
 * Exits non-zero if any metric failed.
 */
import { runFredFetch } from '../lib/fetchers/run-fred-fetch'
import { sql } from '../lib/db'

async function main() {
  let failed = 0
  try {
    const summary = await runFredFetch()
    failed = summary.failed
    console.log(
      `FRED fetch — ${summary.succeeded}/${summary.total} ok, ${summary.failed} failed`
    )
    for (const r of summary.results) {
      if (r.ok) {
        console.log(
          `  ✓ ${r.metricId.padEnd(20)} ${String(r.latestValue).padStart(12)}  ` +
            `@ ${r.latestDate}  ${r.freshness}/${r.confidence}  ` +
            `(${r.observationsStored} obs via ${r.sourceUsed})`
        )
      } else {
        console.log(`  ✗ ${r.metricId.padEnd(20)} ERROR: ${r.error}`)
      }
    }
  } catch (e) {
    failed = 1
    console.error('FRED fetch FAILED:', e)
  } finally {
    await sql.end()
  }
  process.exit(failed === 0 ? 0 : 1)
}

main()
