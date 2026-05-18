/**
 * AI interpretation core — Spec §12–§14 (guardrails), §15.6/§15.7, §17, §20.
 *
 * On-demand only. Loads the editable prompt template from the DB, builds the
 * minimal payload needed (Spec §20 — don't over-send), calls Claude, and
 * persists the result append-only to ai_interpretations (decision D9).
 *
 * Relative imports only — runs under Next routes and tsx.
 */
import { sql } from '../db'
import { getAnthropic, Anthropic } from './client'

export type InterpretationType = 'daily' | 'weekly' | 'metric' | 'crisis'

const SLUG_BY_TYPE: Record<InterpretationType, string> = {
  daily: 'full_regime_interpretation',
  weekly: 'weekly_review',
  metric: 'metric_explanation',
  crisis: 'crisis_mode',
}

export interface InterpretParams {
  type: InterpretationType
  snapshotId?: string // defaults to latest; ignored for weekly
  metricId?: string // required for type 'metric'
}

export interface InterpretationResult {
  id: string
  interpretation_type: InterpretationType
  snapshot_id: string | null
  prompt_template_id: string | null
  output_text: string
  model: string
  token_usage: { input_tokens: number; output_tokens: number }
  created_at: string
}

interface AiUsage {
  model?: string
  max_tokens?: number
}

async function loadAiSettings(): Promise<{ model: string; maxTokens: number }> {
  const rows = await sql<{ value: AiUsage }[]>`
    SELECT value FROM app_settings WHERE id = 'ai_usage'`
  const v = rows[0]?.value ?? {}
  return { model: v.model ?? 'claude-sonnet-4-6', maxTokens: v.max_tokens ?? 2000 }
}

async function latestSnapshotId(): Promise<string | null> {
  const r = await sql<{ id: string }[]>`SELECT id FROM snapshots ORDER BY created_at DESC LIMIT 1`
  return r[0]?.id ?? null
}

async function snapshotPayload(snapshotId: string) {
  const [snap] = await sql`
    SELECT id, created_at::text AS created_at, market_score::float8 AS market_score,
           oscillator_value::float8 AS oscillator_value, regime_label,
           investor_posture, trend, confidence, data_freshness,
           top_positive_signals, top_negative_signals
    FROM snapshots WHERE id = ${snapshotId}`
  if (!snap) throw new Error(`Snapshot ${snapshotId} not found`)

  const category_scores = await sql`
    SELECT c.name AS category, cs.raw_category_score::float8 AS raw_category_score,
           cs.weighted_contribution::float8 AS weighted_contribution
    FROM category_scores cs JOIN categories c ON c.id = cs.category_id
    WHERE cs.snapshot_id = ${snapshotId} ORDER BY c.display_order`

  const metrics = await sql`
    SELECT m.name, ms.raw_score::float8 AS raw_score, ms.trend, ms.score_reason
    FROM metric_scores ms JOIN metrics m ON m.id = ms.metric_id
    WHERE ms.snapshot_id = ${snapshotId} ORDER BY m.display_order`

  const [prev] = await sql<{ market_score: number }[]>`
    SELECT market_score::float8 AS market_score FROM snapshots
    WHERE created_at < ${snap.created_at} ORDER BY created_at DESC LIMIT 1`

  return { snapshot: snap, category_scores, metrics, previous: prev ?? null }
}

function fillPlaceholders(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
}

export async function runInterpretation(params: InterpretParams): Promise<InterpretationResult> {
  const slug = SLUG_BY_TYPE[params.type]

  const [tpl] = await sql<
    { id: string; prompt_text: string }[]
  >`SELECT id, prompt_text FROM prompt_templates WHERE slug = ${slug} AND enabled = true`
  if (!tpl) throw new Error(`Prompt template '${slug}' not found or disabled`)

  const { model, maxTokens } = await loadAiSettings()

  let systemPrompt = tpl.prompt_text
  let snapshotIdForRow: string | null = null
  let inputPayload: Record<string, unknown> = {}

  if (params.type === 'metric') {
    const snapId = params.snapshotId ?? (await latestSnapshotId())
    if (!params.metricId) throw new Error('metricId is required for a metric explanation')
    const [row] = await sql`
      SELECT m.name AS metric_name, c.name AS category, m.unit,
             ds.name AS source,
             mv.value::float8 AS value,
             ms.raw_score::float8 AS score, ms.trend, ms.score_reason
      FROM metrics m
      JOIN categories c ON c.id = m.category_id
      LEFT JOIN data_sources ds ON ds.id = m.source_primary_id
      LEFT JOIN LATERAL (
        SELECT value FROM metric_values WHERE metric_id = m.id
        ORDER BY "timestamp" DESC LIMIT 1
      ) mv ON true
      LEFT JOIN LATERAL (
        SELECT raw_score, trend, score_reason FROM metric_scores
        WHERE metric_id = m.id AND snapshot_id = ${snapId}
        LIMIT 1
      ) ms ON true
      WHERE m.id = ${params.metricId}`
    if (!row) throw new Error(`Metric ${params.metricId} not found`)

    systemPrompt = fillPlaceholders(tpl.prompt_text, {
      metric_name: String(row.metric_name),
      category: String(row.category),
      value: row.value === null ? 'no data' : String(row.value),
      trend: row.trend ?? 'unknown',
      score: row.score === null ? 'n/a' : String(row.score),
      source: row.source ?? 'unknown',
    })
    snapshotIdForRow = snapId
    inputPayload = { metric: row }
  } else if (params.type === 'weekly') {
    const snaps = await sql`
      SELECT created_at::text AS created_at, market_score::float8 AS market_score,
             oscillator_value::float8 AS oscillator_value, regime_label, trend
      FROM snapshots ORDER BY created_at DESC LIMIT 7`
    inputPayload = { snapshots: snaps }
    snapshotIdForRow = null // weekly spans multiple snapshots (Spec §8.13)
  } else {
    // daily | crisis — interpret one snapshot
    const snapId = params.snapshotId ?? (await latestSnapshotId())
    if (!snapId) throw new Error('No snapshot exists yet — run a refresh first')
    inputPayload = await snapshotPayload(snapId)
    snapshotIdForRow = snapId
  }

  const anthropic = getAnthropic()
  let message: Anthropic.Message
  try {
    message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content:
            'Use ONLY the JSON data below. Do not invent missing data; note if data is stale or missing.\n\n' +
            JSON.stringify(inputPayload, null, 2),
        },
      ],
    })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      throw new Error('Anthropic auth failed — check ANTHROPIC_API_KEY')
    }
    if (e instanceof Anthropic.RateLimitError) {
      throw new Error('Anthropic rate limited — try again shortly')
    }
    if (e instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error ${e.status}: ${e.message}`)
    }
    throw e
  }

  const outputText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()

  const tokenUsage = {
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  }

  const [saved] = await sql<{ id: string; created_at: string }[]>`
    INSERT INTO ai_interpretations
      (snapshot_id, prompt_template_id, interpretation_type, input_payload,
       output_text, model, token_usage)
    VALUES
      (${snapshotIdForRow}, ${tpl.id}, ${params.type},
       ${sql.json(inputPayload as Parameters<typeof sql.json>[0])},
       ${outputText}, ${model}, ${sql.json(tokenUsage)})
    RETURNING id, created_at::text AS created_at`

  return {
    id: saved.id,
    interpretation_type: params.type,
    snapshot_id: snapshotIdForRow,
    prompt_template_id: tpl.id,
    output_text: outputText,
    model,
    token_usage: tokenUsage,
    created_at: saved.created_at,
  }
}
