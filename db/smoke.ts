/**
 * Smoke test — inserts then selects one row in every table, exercising the
 * foreign-key graph and the metric_values unique constraint, then ABORTS the
 * transaction so the database is left untouched.
 *
 *   npm run db:smoke
 *
 * Verifies Phase 2 acceptance: a smoke insert/select works for each table.
 */
import postgres from 'postgres'

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL not set. Set it in .env.local before running the smoke test.')
    process.exit(1)
  }
  return postgres(url, { prepare: false, max: 1, onnotice: () => {} })
}

async function main() {
  const sql = getSql()
  let ok = true
  try {
    await sql
      .begin(async (tx) => {
        const seen: string[] = []
        const check = async (table: string, count: number) => {
          if (count < 1) throw new Error(`${table}: expected >=1 row, got ${count}`)
          seen.push(table)
        }

        const [ds] = await tx`
          INSERT INTO data_sources (id, name, type) VALUES ('smoke_src', 'Smoke', 'api')
          RETURNING id`
        await check('data_sources', (await tx`SELECT 1 FROM data_sources WHERE id=${ds.id}`).count)

        const [cat] = await tx`
          INSERT INTO categories (id, name, slug, weight, is_core, display_order)
          VALUES ('smoke_cat', 'Smoke', 'smoke', 0.1, true, 1) RETURNING id`
        await check('categories', (await tx`SELECT 1 FROM categories WHERE id=${cat.id}`).count)

        const [m] = await tx`
          INSERT INTO metrics (id, category_id, name, slug, source_primary_id, metric_weight)
          VALUES ('smoke_metric', ${cat.id}, 'Smoke Metric', 'smoke_metric', ${ds.id}, 1.0)
          RETURNING id`
        await check('metrics', (await tx`SELECT 1 FROM metrics WHERE id=${m.id}`).count)

        const [snap] = await tx`
          INSERT INTO snapshots (market_score, oscillator_value, regime_label)
          VALUES (63, 26, 'Early Risk-On') RETURNING id`
        await check('snapshots', (await tx`SELECT 1 FROM snapshots WHERE id=${snap.id}`).count)

        const [mv] = await tx`
          INSERT INTO metric_values (metric_id, value, "timestamp", source_id)
          VALUES (${m.id}, 18.4, '2026-05-17', ${ds.id}) RETURNING id`
        await check(
          'metric_values',
          (await tx`SELECT 1 FROM metric_values WHERE id=${mv.id}`).count
        )

        // unique(metric_id, timestamp, source_id) must reject a duplicate.
        // Wrapped in a savepoint so the expected error only rolls back this
        // sub-step, leaving the outer transaction usable.
        let dupRejected = false
        try {
          await tx.savepoint(
            (sp) =>
              sp`
                INSERT INTO metric_values (metric_id, value, "timestamp", source_id)
                VALUES (${m.id}, 99, '2026-05-17', ${ds.id})`
          )
        } catch {
          dupRejected = true
        }
        if (!dupRejected) throw new Error('metric_values unique constraint did not fire')

        const [msc] = await tx`
          INSERT INTO metric_scores (metric_id, snapshot_id, raw_score, weighted_contribution)
          VALUES (${m.id}, ${snap.id}, 2, 0.112) RETURNING id`
        await check(
          'metric_scores',
          (await tx`SELECT 1 FROM metric_scores WHERE id=${msc.id}`).count
        )

        const [csc] = await tx`
          INSERT INTO category_scores
            (snapshot_id, category_id, raw_category_score, category_weight, weighted_contribution)
          VALUES (${snap.id}, ${cat.id}, 2.2, 0.08, 0.176) RETURNING id`
        await check(
          'category_scores',
          (await tx`SELECT 1 FROM category_scores WHERE id=${csc.id}`).count
        )

        const [sm] = await tx`
          INSERT INTO snapshot_metrics
            (snapshot_id, metric_id, metric_value_id, metric_score_id, category_id)
          VALUES (${snap.id}, ${m.id}, ${mv.id}, ${msc.id}, ${cat.id}) RETURNING id`
        await check(
          'snapshot_metrics',
          (await tx`SELECT 1 FROM snapshot_metrics WHERE id=${sm.id}`).count
        )

        const [sr] = await tx`
          INSERT INTO scoring_rules (metric_id, rule_name, rule_config)
          VALUES (${m.id}, 'smoke', ${tx.json({ rules: [] })}) RETURNING id`
        await check('scoring_rules', (await tx`SELECT 1 FROM scoring_rules WHERE id=${sr.id}`).count)

        const [rt] = await tx`
          INSERT INTO regime_thresholds (min_score, max_score, regime_label)
          VALUES (55, 64, 'Early Risk-On') RETURNING id`
        await check(
          'regime_thresholds',
          (await tx`SELECT 1 FROM regime_thresholds WHERE id=${rt.id}`).count
        )

        const [pt] = await tx`
          INSERT INTO prompt_templates (id, name, slug, prompt_text)
          VALUES ('smoke_prompt', 'Smoke', 'smoke', 'hello') RETURNING id`
        await check(
          'prompt_templates',
          (await tx`SELECT 1 FROM prompt_templates WHERE id=${pt.id}`).count
        )

        const [ai] = await tx`
          INSERT INTO ai_interpretations
            (snapshot_id, prompt_template_id, interpretation_type, output_text)
          VALUES (${snap.id}, ${pt.id}, 'daily', 'smoke output') RETURNING id`
        await check(
          'ai_interpretations',
          (await tx`SELECT 1 FROM ai_interpretations WHERE id=${ai.id}`).count
        )

        const [mo] = await tx`
          INSERT INTO manual_overrides (metric_id, override_type, override_value, reason)
          VALUES (${m.id}, 'score', ${tx.json(3)}, 'smoke') RETURNING id`
        await check(
          'manual_overrides',
          (await tx`SELECT 1 FROM manual_overrides WHERE id=${mo.id}`).count
        )

        const [as_] = await tx`
          INSERT INTO app_settings (id, value) VALUES ('smoke_setting', ${tx.json({ a: 1 })})
          RETURNING id`
        await check('app_settings', (await tx`SELECT 1 FROM app_settings WHERE id=${as_.id}`).count)

        console.log(`Smoke OK — insert/select verified for ${seen.length} tables:`)
        console.log('  ' + seen.join(', '))
        console.log('  unique(metric_id, timestamp, source_id) constraint: enforced')

        // Abort so nothing is persisted.
        throw new Error('__SMOKE_ROLLBACK__')
      })
      .catch((e: Error) => {
        if (e.message !== '__SMOKE_ROLLBACK__') throw e
      })
    console.log('Transaction rolled back — database unchanged.')
  } catch (err) {
    ok = false
    console.error('Smoke FAILED:', err)
  } finally {
    await sql.end()
  }
  process.exit(ok ? 0 : 1)
}

main()
