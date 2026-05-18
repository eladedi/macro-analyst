/**
 * CLI wrapper for the Twelve Data fetch — same orchestrator the API route uses.
 *
 *   npm run fetch:twelvedata
 *
 * Reads TWELVE_DATA_API_KEY + DATABASE_URL from .env.local (via tsx --env-file).
 * Exits non-zero if any metric failed.
 */
import { runTwelveDataFetch } from '../lib/fetchers/run-twelvedata-fetch'
import { sql } from '../lib/db'

async function main() {
  let failed = 0
  try {
    const summary = await runTwelveDataFetch()
    failed = summary.failed
    console.log(
      `Twelve Data fetch — ${summary.succeeded}/${summary.total} ok, ${summary.failed} failed`
    )
    for (const r of summary.results) {
      if (r.ok) {
        console.log(
          `  ✓ ${r.metricId.padEnd(20)} ${String(r.latestValue).padStart(14)}  ` +
            `@ ${r.latestDate}  ${r.freshness}/${r.confidence}  ` +
            `(${r.observationsStored} obs via ${r.sourceUsed})`
        )
      } else {
        console.log(`  ✗ ${r.metricId.padEnd(20)} ERROR: ${r.error}`)
      }
    }
  } catch (e) {
    failed = 1
    console.error('Twelve Data fetch FAILED:', e)
  } finally {
    await sql.end()
  }
  process.exit(failed === 0 ? 0 : 1)
}

main()
