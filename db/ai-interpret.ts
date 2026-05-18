/**
 * CLI for AI interpretation — same lib the API routes use.
 *
 *   npm run ai:interpret            # full regime, latest snapshot
 *   npm run ai:interpret -- weekly  # weekly review
 *   npm run ai:interpret -- crisis  # crisis mode
 *
 * Needs ANTHROPIC_API_KEY + DATABASE_URL in .env.local.
 */
import { runInterpretation, type InterpretationType } from '../lib/ai/interpret'
import { sql } from '../lib/db'

async function main() {
  const arg = (process.argv[2] as InterpretationType) || 'daily'
  let ok = true
  try {
    const r = await runInterpretation({ type: arg })
    console.log(`\n[${r.interpretation_type}] ${r.model}  (${r.token_usage.input_tokens} in / ${r.token_usage.output_tokens} out)`)
    console.log(`saved ai_interpretation ${r.id} @ ${r.created_at}\n`)
    console.log(r.output_text)
    console.log('')
  } catch (e) {
    ok = false
    console.error('AI interpretation FAILED:', e instanceof Error ? e.message : e)
  } finally {
    await sql.end()
  }
  process.exit(ok ? 0 : 1)
}

main()
