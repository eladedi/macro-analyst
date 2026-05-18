/**
 * "What changed" vs the previous snapshot — Spec §15.3.
 *
 * Pure: compares the current metric raw scores against the previous
 * snapshot's, surfacing the biggest improvements and deteriorations plus the
 * headline Market Score delta.
 */
import type { ComputedMetric } from '../scoring/compute-snapshot'

export interface WhatChanged {
  market_score_change: number | null
  biggest_improvements: string[]
  biggest_deteriorations: string[]
}

export function whatChanged(
  current: ComputedMetric[],
  previousRawScores: Map<string, number>,
  currentMarketScore: number,
  previousMarketScore: number | null
): WhatChanged {
  const deltas = current
    .filter((m) => previousRawScores.has(m.metricId))
    .map((m) => ({ name: m.name, delta: m.rawScore - (previousRawScores.get(m.metricId) as number) }))
    .filter((d) => d.delta !== 0)

  const improvements = [...deltas]
    .filter((d) => d.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3)
    .map((d) => d.name)

  const deteriorations = [...deltas]
    .filter((d) => d.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3)
    .map((d) => d.name)

  return {
    market_score_change:
      previousMarketScore === null
        ? null
        : Math.round((currentMarketScore - previousMarketScore) * 100) / 100,
    biggest_improvements: improvements,
    biggest_deteriorations: deteriorations,
  }
}
