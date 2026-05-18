/**
 * Idempotent seed — writes the canonical config (config/seed-data.ts) into the
 * database. Safe to run repeatedly: text-PK tables upsert by id; the keyless
 * config tables (regime_thresholds, scoring_rules) are replaced wholesale
 * inside the transaction.
 *
 *   npm run db:seed
 *
 * Verifies Phase 3 acceptance at the end and exits non-zero if any check fails.
 */
import postgres from 'postgres'
import {
  dataSources,
  categories,
  metrics,
  scoringRules,
  regimeThresholds,
  promptTemplates,
  appSettings,
} from '../config/seed-data'

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL not set. Set it in .env.local before seeding.')
    process.exit(1)
  }
  return postgres(url, { prepare: false, max: 1, onnotice: () => {} })
}

async function main() {
  const sql = getSql()
  let ok = true
  try {
    await sql.begin(async (tx) => {
      for (const d of dataSources) {
        await tx`
          INSERT INTO data_sources (id, name, type, base_url, requires_api_key, reliability, notes, enabled)
          VALUES (${d.id}, ${d.name}, ${d.type}, ${d.base_url}, ${d.requires_api_key}, ${d.reliability}, ${d.notes}, ${d.enabled})
          ON CONFLICT (id) DO UPDATE SET
            name=EXCLUDED.name, type=EXCLUDED.type, base_url=EXCLUDED.base_url,
            requires_api_key=EXCLUDED.requires_api_key, reliability=EXCLUDED.reliability,
            notes=EXCLUDED.notes, enabled=EXCLUDED.enabled, updated_at=now()`
      }

      for (const c of categories) {
        await tx`
          INSERT INTO categories (id, name, slug, description, weight, is_core, display_order)
          VALUES (${c.id}, ${c.name}, ${c.slug}, ${c.description}, ${c.weight}, ${c.is_core}, ${c.display_order})
          ON CONFLICT (id) DO UPDATE SET
            name=EXCLUDED.name, slug=EXCLUDED.slug, description=EXCLUDED.description,
            weight=EXCLUDED.weight, is_core=EXCLUDED.is_core,
            display_order=EXCLUDED.display_order, updated_at=now()`
      }

      for (const m of metrics) {
        await tx`
          INSERT INTO metrics (
            id, category_id, name, slug, description, unit, source_primary_id,
            source_fallback_id, source_symbol, metric_weight, automation_status,
            expected_frequency, freshness_window_hours, confidence_default,
            chart_type, display_order)
          VALUES (
            ${m.id}, ${m.category_id}, ${m.name}, ${m.slug}, ${m.description}, ${m.unit},
            ${m.source_primary_id}, ${m.source_fallback_id}, ${m.source_symbol},
            ${m.metric_weight}, ${m.automation_status}, ${m.expected_frequency},
            ${m.freshness_window_hours}, ${m.confidence_default}, ${m.chart_type},
            ${m.display_order})
          ON CONFLICT (id) DO UPDATE SET
            category_id=EXCLUDED.category_id, name=EXCLUDED.name, slug=EXCLUDED.slug,
            description=EXCLUDED.description, unit=EXCLUDED.unit,
            source_primary_id=EXCLUDED.source_primary_id,
            source_fallback_id=EXCLUDED.source_fallback_id,
            source_symbol=EXCLUDED.source_symbol, metric_weight=EXCLUDED.metric_weight,
            automation_status=EXCLUDED.automation_status,
            expected_frequency=EXCLUDED.expected_frequency,
            freshness_window_hours=EXCLUDED.freshness_window_hours,
            confidence_default=EXCLUDED.confidence_default,
            chart_type=EXCLUDED.chart_type, display_order=EXCLUDED.display_order,
            updated_at=now()`
      }

      // Remove data sources no longer in the seed set (e.g. coingecko /
      // market_data after the D4 consolidation). Safe after metrics are
      // repointed and only if nothing in metric_values still references them.
      const keepSourceIds = dataSources.map((d) => d.id)
      await tx`
        DELETE FROM data_sources
        WHERE id <> ALL(${tx.array(keepSourceIds)}::text[])
          AND id NOT IN (SELECT DISTINCT source_id FROM metric_values)`

      // Keyless config — replace wholesale for a clean idempotent state.
      await tx`DELETE FROM scoring_rules`
      for (const r of scoringRules) {
        await tx`
          INSERT INTO scoring_rules (metric_id, rule_name, rule_config)
          VALUES (${r.metric_id}, ${r.rule_name}, ${tx.json(r.rule_config)})`
      }

      await tx`DELETE FROM regime_thresholds`
      for (const t of regimeThresholds) {
        await tx`
          INSERT INTO regime_thresholds
            (min_score, max_score, regime_label, posture, description, display_order)
          VALUES (${t.min_score}, ${t.max_score}, ${t.regime_label}, ${t.posture}, ${t.description}, ${t.display_order})`
      }

      for (const p of promptTemplates) {
        await tx`
          INSERT INTO prompt_templates
            (id, name, slug, description, prompt_text, variables, output_format)
          VALUES (${p.id}, ${p.name}, ${p.slug}, ${p.description}, ${p.prompt_text},
                  ${tx.json(p.variables)}, ${p.output_format})
          ON CONFLICT (id) DO UPDATE SET
            name=EXCLUDED.name, slug=EXCLUDED.slug, description=EXCLUDED.description,
            prompt_text=EXCLUDED.prompt_text, variables=EXCLUDED.variables,
            output_format=EXCLUDED.output_format, updated_at=now()`
      }

      for (const s of appSettings) {
        await tx`
          INSERT INTO app_settings (id, value, description)
          VALUES (${s.id}, ${tx.json(s.value)}, ${s.description})
          ON CONFLICT (id) DO UPDATE SET
            value=EXCLUDED.value, description=EXCLUDED.description, updated_at=now()`
      }
    })

    console.log('Seed applied. Verifying Phase 3 acceptance...')

    // 1. Category weights sum to 1.0
    const [{ total }] = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(weight), 0)::float8 AS total FROM categories`
    const weightsOk = Math.abs(total - 1) < 1e-9
    console.log(`  ${weightsOk ? '✓' : '✗'} category weights sum = ${total} (expect 1.0)`)
    if (!weightsOk) ok = false

    // 2. Every metric resolves to a valid category, primary source, scoring rule
    const orphans = await sql<{ id: string; reason: string }[]>`
      SELECT m.id,
        CASE
          WHEN c.id IS NULL THEN 'no category'
          WHEN ds.id IS NULL THEN 'no primary source'
          WHEN sr.metric_id IS NULL THEN 'no scoring rule'
        END AS reason
      FROM metrics m
      LEFT JOIN categories c ON c.id = m.category_id
      LEFT JOIN data_sources ds ON ds.id = m.source_primary_id
      LEFT JOIN (SELECT DISTINCT metric_id FROM scoring_rules) sr ON sr.metric_id = m.id
      WHERE c.id IS NULL OR ds.id IS NULL OR sr.metric_id IS NULL`
    console.log(
      `  ${orphans.length === 0 ? '✓' : '✗'} all metrics resolve to category + source + rule` +
        (orphans.length ? ` — issues: ${JSON.stringify(orphans)}` : '')
    )
    if (orphans.length) ok = false

    // 3. Regime thresholds cover 0–100 with no gaps/overlaps
    const bands = await sql<{ min_score: number; max_score: number }[]>`
      SELECT min_score::float8, max_score::float8 FROM regime_thresholds ORDER BY min_score`
    let coverageOk = bands.length > 0 && bands[0].min_score === 0
    for (let i = 0; i < bands.length; i++) {
      if (bands[i].max_score < bands[i].min_score) coverageOk = false
      if (i > 0 && bands[i].min_score !== bands[i - 1].max_score + 1) coverageOk = false
    }
    if (bands.length && bands[bands.length - 1].max_score !== 100) coverageOk = false
    console.log(`  ${coverageOk ? '✓' : '✗'} regime thresholds cover 0–100 with no gaps/overlaps`)
    if (!coverageOk) ok = false

    // 4. All 4 prompt templates present
    const [{ pc }] = await sql<{ pc: number }[]>`
      SELECT count(*)::int AS pc FROM prompt_templates`
    const promptsOk = pc === 4
    console.log(`  ${promptsOk ? '✓' : '✗'} prompt templates present = ${pc} (expect 4)`)
    if (!promptsOk) ok = false

    const counts = await sql<{ t: string; n: number }[]>`
      SELECT 'data_sources' t, count(*)::int n FROM data_sources
      UNION ALL SELECT 'categories', count(*)::int FROM categories
      UNION ALL SELECT 'metrics', count(*)::int FROM metrics
      UNION ALL SELECT 'scoring_rules', count(*)::int FROM scoring_rules
      UNION ALL SELECT 'regime_thresholds', count(*)::int FROM regime_thresholds
      UNION ALL SELECT 'prompt_templates', count(*)::int FROM prompt_templates
      UNION ALL SELECT 'app_settings', count(*)::int FROM app_settings`
    console.log('  rows: ' + counts.map((c) => `${c.t}=${c.n}`).join(', '))
  } catch (err) {
    ok = false
    console.error('Seed FAILED:', err)
  } finally {
    await sql.end()
  }
  console.log(ok ? 'Phase 3 acceptance: PASS' : 'Phase 3 acceptance: FAIL')
  process.exit(ok ? 0 : 1)
}

main()
