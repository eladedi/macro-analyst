/**
 * Scoring-rule evaluation — Spec §8.10 rule_config shape.
 *
 * Rules are tested in order; the first whose `input <operator> value` holds
 * wins (its score + label). If none match, or the chosen input has no data,
 * fallback_score is used. The result is clamped to score_range.
 */
import type { Changes } from './changes'

export type RuleOperator = '<=' | '<' | '>=' | '>' | '=='

export interface RuleConfig {
  score_range: [number, number]
  input: string
  fallback_score: number
  rules: Array<{ operator: RuleOperator; value: number; score: number; label: string }>
}

export interface ScoreResult {
  score: number
  reason: string
}

export type ScoringInputs = Changes

function pick(inputs: ScoringInputs, key: string): number | null {
  const v = (inputs as unknown as Record<string, number | null | undefined>)[key]
  return typeof v === 'number' ? v : null
}

function compare(op: RuleOperator, x: number, v: number): boolean {
  switch (op) {
    case '<=':
      return x <= v
    case '<':
      return x < v
    case '>=':
      return x >= v
    case '>':
      return x > v
    case '==':
      return x === v
  }
}

function clamp(n: number, [min, max]: [number, number]): number {
  return Math.min(max, Math.max(min, n))
}

export function applyScoringRule(config: RuleConfig, inputs: ScoringInputs): ScoreResult {
  const x = pick(inputs, config.input)

  if (x === null) {
    return { score: clamp(config.fallback_score, config.score_range), reason: 'no input data' }
  }

  for (const rule of config.rules) {
    if (compare(rule.operator, x, rule.value)) {
      return { score: clamp(rule.score, config.score_range), reason: rule.label }
    }
  }

  return { score: clamp(config.fallback_score, config.score_range), reason: 'fallback (no rule matched)' }
}
