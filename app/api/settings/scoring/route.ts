import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Spec §15.8 — the full editable scoring model.
export async function GET() {
  const [categories, metrics, regime_thresholds, scoring_rules] = await Promise.all([
    sql`
      SELECT id, name, weight::float8 AS weight, is_core, enabled, display_order
      FROM categories ORDER BY display_order`,
    sql`
      SELECT id, name, category_id, metric_weight::float8 AS metric_weight, enabled, display_order
      FROM metrics ORDER BY display_order`,
    sql`
      SELECT id, min_score::float8 AS min_score, max_score::float8 AS max_score,
             regime_label, posture, display_order, enabled
      FROM regime_thresholds ORDER BY display_order`,
    sql`
      SELECT id, metric_id, rule_name, rule_config, enabled
      FROM scoring_rules ORDER BY metric_id`,
  ])
  return Response.json({ categories, metrics, regime_thresholds, scoring_rules })
}

interface ScoringPatch {
  categories?: { id: string; weight?: number; enabled?: boolean }[]
  metrics?: { id: string; metric_weight?: number; enabled?: boolean }[]
  regime_thresholds?: {
    id: string
    min_score?: number
    max_score?: number
    regime_label?: string
    posture?: string
    enabled?: boolean
  }[]
  scoring_rules?: { id: string; rule_config?: unknown; enabled?: boolean }[]
}

// Spec §15.9 — persist edits. Scoring reads these from the DB on every
// refresh, so changes take effect on the next snapshot (no code change).
export async function PUT(req: Request) {
  const secret = process.env.AUTH_SECRET
  if (secret && req.headers.get('x-auth-secret') !== secret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as ScoringPatch

  try {
    await sql.begin(async (tx) => {
      for (const c of body.categories ?? []) {
        if (c.weight !== undefined && (c.weight < 0 || c.weight > 1))
          throw new Error(`category ${c.id}: weight must be 0..1`)
        await tx`
          UPDATE categories SET
            weight = COALESCE(${c.weight ?? null}, weight),
            enabled = COALESCE(${c.enabled ?? null}, enabled),
            updated_at = now()
          WHERE id = ${c.id}`
      }
      for (const m of body.metrics ?? []) {
        if (m.metric_weight !== undefined && m.metric_weight < 0)
          throw new Error(`metric ${m.id}: weight must be >= 0`)
        await tx`
          UPDATE metrics SET
            metric_weight = COALESCE(${m.metric_weight ?? null}, metric_weight),
            enabled = COALESCE(${m.enabled ?? null}, enabled),
            updated_at = now()
          WHERE id = ${m.id}`
      }
      for (const t of body.regime_thresholds ?? []) {
        await tx`
          UPDATE regime_thresholds SET
            min_score = COALESCE(${t.min_score ?? null}, min_score),
            max_score = COALESCE(${t.max_score ?? null}, max_score),
            regime_label = COALESCE(${t.regime_label ?? null}, regime_label),
            posture = COALESCE(${t.posture ?? null}, posture),
            enabled = COALESCE(${t.enabled ?? null}, enabled),
            updated_at = now()
          WHERE id = ${t.id}`
      }
      for (const r of body.scoring_rules ?? []) {
        await tx`
          UPDATE scoring_rules SET
            rule_config = COALESCE(${r.rule_config ? sql.json(r.rule_config as never) : null}, rule_config),
            enabled = COALESCE(${r.enabled ?? null}, enabled),
            updated_at = now()
          WHERE id = ${r.id}`
      }
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }

  // Echo current category-weight sum so the UI can warn if it drifts from 1.0
  // (the engine normalizes over active categories, so this is advisory).
  const [{ total }] = await sql<{ total: number }[]>`
    SELECT COALESCE(SUM(weight),0)::float8 AS total FROM categories WHERE enabled = true`
  return Response.json({ ok: true, enabled_category_weight_sum: total })
}
