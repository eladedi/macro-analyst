import { describe, it, expect } from 'vitest'
import {
  metricContribution,
  categoryScore,
  weightedRawScore,
  marketScore,
  oscillator,
} from './engine'
import { computeChanges } from './changes'
import { applyScoringRule, type RuleConfig } from './rules'
import { selectRegime, marketTrend } from './regime'
import { computeSnapshot, type EngineParams } from './compute-snapshot'
import { regimeThresholds } from '../../config/seed-data'

describe('Spec §10.4 Market Score', () => {
  it('maps weighted raw −5..+5 to 0..100', () => {
    expect(marketScore(0)).toBe(50)
    expect(marketScore(5)).toBe(100)
    expect(marketScore(-5)).toBe(0)
    expect(marketScore(1.26)).toBeCloseTo(62.6, 5)
  })
  it('clamps out-of-range input', () => {
    expect(marketScore(7)).toBe(100)
    expect(marketScore(-7)).toBe(0)
  })
})

describe('Spec §10.5 Oscillator', () => {
  it('(marketScore − 50) × 2', () => {
    expect(oscillator(50)).toBe(0)
    expect(oscillator(100)).toBe(100)
    expect(oscillator(0)).toBe(-100)
    expect(oscillator(63)).toBe(26)
  })
})

describe('Spec §10.7 worked example', () => {
  it('VIX raw +2, metric weight 70%, category weight 8% → +0.112', () => {
    expect(metricContribution(2, 0.7, 0.08)).toBeCloseTo(0.112, 6)
  })
})

describe('Spec §10.2 category score', () => {
  it('weighted average of enabled metrics', () => {
    expect(categoryScore([{ score: 2, weight: 0.7 }, { score: -1, weight: 0.3 }])).toBeCloseTo(1.1, 6)
  })
  it('null when no enabled metrics', () => {
    expect(categoryScore([])).toBeNull()
  })
})

describe('Spec §10.3 weighted raw — normalized over active categories', () => {
  it('empty/disabled categories neither dilute nor cap the score', () => {
    // Only categories that actually have a score participate; weights renormalize.
    const wr = weightedRawScore([
      { score: 2, weight: 0.16 },
      { score: 2, weight: 0.08 },
    ])
    expect(wr).toBeCloseTo(2, 6) // not (2*0.16 + 2*0.08) = 0.48
  })
  it('returns 0 when nothing active', () => {
    expect(weightedRawScore([])).toBe(0)
  })
})

describe('Spec §11 regime selection (seeded bands)', () => {
  const cases: [number, string][] = [
    [100, 'Strong Risk-On'],
    [80, 'Strong Risk-On'],
    [79, 'Risk-On'],
    [65, 'Risk-On'],
    [64, 'Early Risk-On'],
    [64.5, 'Early Risk-On'],
    [55, 'Early Risk-On'],
    [54, 'Neutral / Mixed'],
    [45, 'Neutral / Mixed'],
    [44, 'Weakening'],
    [35, 'Weakening'],
    [34, 'Risk-Off'],
    [20, 'Risk-Off'],
    [19, 'Panic / Stress'],
    [0, 'Panic / Stress'],
  ]
  it.each(cases)('score %d → %s', (score, label) => {
    expect(selectRegime(regimeThresholds, score).label).toBe(label)
  })
})

describe('Spec §12 market trend (±5 rule)', () => {
  it('improving / deteriorating / stable / unknown', () => {
    expect(marketTrend(70, 60)).toBe('improving')
    expect(marketTrend(55, 65)).toBe('deteriorating')
    expect(marketTrend(62, 60)).toBe('stable')
    expect(marketTrend(63, null)).toBe('unknown')
  })
})

describe('Spec §12 change calculation', () => {
  const obs = [
    { timestamp: '2026-05-15', value: 100 },
    { timestamp: '2026-05-08', value: 90 },
    { timestamp: '2026-04-15', value: 80 },
    { timestamp: '2026-02-14', value: 50 },
  ]
  it('computes windowed absolute + percent changes', () => {
    const c = computeChanges(obs)!
    expect(c.value).toBe(100)
    expect(c.asOf).toBe('2026-05-15')
    expect(c.change_1m).toBe(20) // vs 2026-04-15 = 80
    expect(c.change_3m).toBe(50) // vs 2026-02-14 = 50
    expect(c.change_1m_percent).toBeCloseTo(25, 6)
  })
  it('null window when history too short', () => {
    const c = computeChanges([{ timestamp: '2026-05-15', value: 100 }])!
    expect(c.change_1d).toBeNull()
    expect(c.change_3m).toBeNull()
  })
  it('empty history → null', () => {
    expect(computeChanges([])).toBeNull()
  })
})

describe('Spec §8.10 rule evaluation', () => {
  const cfg: RuleConfig = {
    score_range: [-5, 5],
    input: 'change_1w_percent',
    fallback_score: 0,
    rules: [
      { operator: '<=', value: -20, score: 4, label: 'collapsing' },
      { operator: '<=', value: -8, score: 2, label: 'falling' },
      { operator: '>=', value: 25, score: -4, label: 'spiking' },
    ],
  }
  const base = computeChanges([{ timestamp: '2026-05-15', value: 1 }])!

  it('first matching rule wins', () => {
    expect(applyScoringRule(cfg, { ...base, change_1w_percent: -25 })).toEqual({
      score: 4,
      reason: 'collapsing',
    })
    expect(applyScoringRule(cfg, { ...base, change_1w_percent: -10 })).toEqual({
      score: 2,
      reason: 'falling',
    })
  })
  it('fallback when no rule matches', () => {
    expect(applyScoringRule(cfg, { ...base, change_1w_percent: 3 }).score).toBe(0)
  })
  it('no input data → fallback with reason', () => {
    expect(applyScoringRule(cfg, { ...base, change_1w_percent: null })).toEqual({
      score: 0,
      reason: 'no input data',
    })
  })
  it('clamps to score_range', () => {
    const clampCfg: RuleConfig = {
      ...cfg,
      rules: [{ operator: '>=', value: 0, score: 99, label: 'too big' }],
    }
    expect(applyScoringRule(clampCfg, { ...base, change_1w_percent: 1 }).score).toBe(5)
  })
})

describe('disabled metrics/categories excluded from weighting', () => {
  const params: EngineParams = {
    regimeBands: regimeThresholds,
    previousMarketScore: null,
    categories: [
      { categoryId: 'a', name: 'A', weight: 0.5, enabled: true },
      { categoryId: 'b', name: 'B', weight: 0.5, enabled: false }, // disabled
    ],
    metrics: [
      {
        metricId: 'a1', name: 'A1', categoryId: 'a', metricWeight: 1, enabled: true,
        ruleConfig: { score_range: [-5, 5], input: 'value', fallback_score: 0, rules: [{ operator: '>=', value: 0, score: 4, label: 'pos' }] },
        changes: computeChanges([{ timestamp: '2026-05-15', value: 10 }]),
        freshness: 'fresh', confidence: 'high',
      },
      {
        metricId: 'b1', name: 'B1', categoryId: 'b', metricWeight: 1, enabled: true,
        ruleConfig: { score_range: [-5, 5], input: 'value', fallback_score: -5, rules: [] },
        changes: computeChanges([{ timestamp: '2026-05-15', value: 1 }]),
        freshness: 'stale', confidence: 'low',
      },
    ],
  }
  it('disabled category B is excluded; only A drives the score', () => {
    const snap = computeSnapshot(params)
    // Only A (score 4) active → weighted raw 4 → market ((4+5)/10)*100 = 90.
    expect(snap.marketScore).toBeCloseTo(90, 6)
    expect(snap.metrics.map((m) => m.metricId)).toEqual(['a1'])
    expect(snap.categoryScores.find((c) => c.categoryId === 'b')?.rawCategoryScore).toBeNull()
  })
})
