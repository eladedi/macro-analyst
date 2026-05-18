/**
 * Score preview — runs the Phase 5 scoring engine on live DB data and prints
 * the snapshot that WOULD be produced. Read-only: nothing is persisted.
 *
 *   npm run score:preview
 */
import { sql } from '../lib/db'
import { loadEngineInputs } from '../lib/snapshots/load-inputs'
import { computeSnapshot } from '../lib/scoring/compute-snapshot'

async function main() {
  try {
    const { engineParams } = await loadEngineInputs(sql)
    const snap = computeSnapshot(engineParams)
    const r2 = (n: number) => Math.round(n * 100) / 100

    console.log('\n=== Score Preview (read-only — not persisted) ===\n')
    console.log(`  Market Score : ${r2(snap.marketScore)} / 100`)
    console.log(`  Oscillator   : ${r2(snap.oscillatorValue)}`)
    console.log(`  Regime       : ${snap.regimeLabel}  (posture: ${snap.investorPosture})`)
    console.log(`  Trend        : ${snap.trend}`)
    console.log(`  Confidence   : ${snap.confidence}   Data freshness: ${snap.dataFreshness}`)

    console.log('\n  Category scores:')
    for (const c of snap.categoryScores) {
      const s =
        c.rawCategoryScore === null
          ? '   — (no data)'
          : r2(c.rawCategoryScore).toFixed(2).padStart(7)
      console.log(
        `    ${c.name.padEnd(16)} ${s}   wt ${(c.categoryWeight * 100).toFixed(0).padStart(2)}%   ` +
          `contrib ${c.weightedContribution === null ? '—' : r2(c.weightedContribution)}   (${c.metricCount} metrics)`
      )
    }

    console.log('\n  Top positive:', snap.topPositiveSignals.join(' | ') || '(none)')
    console.log('  Top negative:', snap.topNegativeSignals.join(' | ') || '(none)')

    console.log('\n  Scored metrics:')
    for (const m of snap.metrics) {
      console.log(
        `    ${m.metricId.padEnd(20)} raw ${String(m.rawScore).padStart(2)}  ` +
          `${m.trend.padEnd(7)} contrib ${r2(m.weightedContribution).toFixed(4).padStart(8)}  ` +
          `[${m.freshness}/${m.confidence}]  ${m.reason}`
      )
    }
    console.log('')
  } finally {
    await sql.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
