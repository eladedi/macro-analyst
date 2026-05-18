/**
 * CLI for the refresh loop — same orchestrator the API route uses.
 *
 *   npm run snapshot:refresh
 */
import { refreshSnapshot } from '../lib/snapshots/refresh'
import { sql } from '../lib/db'

async function main() {
  let ok = true
  try {
    const p = await refreshSnapshot()
    const s = p.snapshot
    console.log(`\nSnapshot ${s.id} @ ${s.created_at}`)
    console.log(`  Market ${Math.round(s.market_score * 100) / 100} / Osc ${Math.round(s.oscillator_value * 100) / 100}`)
    console.log(`  ${s.regime_label} (${s.investor_posture}) — trend ${s.trend}`)
    console.log(`  confidence ${s.confidence}, data ${s.data_freshness}`)
    const wc = p.what_changed
    console.log(
      `  what changed: Δscore ${wc.market_score_change ?? 'n/a'}  ` +
        `+[${wc.biggest_improvements.join(', ') || '—'}]  ` +
        `-[${wc.biggest_deteriorations.join(', ') || '—'}]`
    )
    console.log(`  ${p.category_scores.length} category scores, ${p.metrics.length} metrics persisted\n`)
  } catch (e) {
    ok = false
    console.error('snapshot refresh FAILED:', e)
  } finally {
    await sql.end()
  }
  process.exit(ok ? 0 : 1)
}

main()
