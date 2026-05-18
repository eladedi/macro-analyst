'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RegimeLabel } from '@/components/ui/regime-label'
import { FreshnessBadge } from '@/components/ui/freshness-badge'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'
import { CategoryCard } from '@/components/dashboard/category-card'
import { categories, metrics as allMetrics, dataSources } from '@/config/seed-data'

interface SnapshotDetail {
  snapshot: {
    id: string
    created_at: string
    market_score: number
    oscillator_value: number
    regime_label: string
    investor_posture: string | null
    trend: string
    confidence: 'high' | 'medium' | 'low'
    data_freshness: 'good' | 'mixed' | 'stale'
    top_positive_signals: string[]
    top_negative_signals: string[]
  }
  category_scores: Array<{
    category_id: string
    raw_category_score: number
    category_weight: number
  }>
}

const srcShort = new Map(dataSources.map((s) => [s.id, s.name.split(' (')[0]]))
const metricsByCategory = (categoryId: string) =>
  allMetrics
    .filter((m) => m.category_id === categoryId)
    .sort((a, b) => a.display_order - b.display_order)
    .map((m) => ({
      name: m.name,
      source: srcShort.get(m.source_primary_id) ?? m.source_primary_id,
      symbol: m.source_symbol,
    }))

const freshnessMap = { good: 'fresh', mixed: 'delayed', stale: 'stale' } as const

async function fetchLatest(): Promise<SnapshotDetail | null> {
  const res = await fetch('/api/snapshots/latest')
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function DashboardPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['snapshot-latest'],
    queryFn: fetchLatest,
  })

  const refresh = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/snapshots/refresh', { method: 'POST' })
      if (!res.ok) throw new Error(`Refresh failed (HTTP ${res.status})`)
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['snapshot-latest'] }),
  })

  const [aiText, setAiText] = useState<string | null>(null)
  const generateAi = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/interpret-snapshot', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      return json as { output_text: string }
    },
    onSuccess: (d) => setAiText(d.output_text),
  })

  const snap = data?.snapshot
  const scoreByCat = new Map(
    (data?.category_scores ?? []).map((c) => [c.category_id, c])
  )

  const orderedCats = [...categories].sort((a, b) => a.display_order - b.display_order)
  const core = orderedCats.filter((c) => c.is_core)
  const supporting = orderedCats.filter((c) => !c.is_core)

  const card = (c: (typeof categories)[number]) => {
    const cs = scoreByCat.get(c.id)
    return (
      <CategoryCard
        key={c.id}
        name={c.name}
        description={c.description}
        score={cs ? cs.raw_category_score : null}
        weight={Math.round((cs?.category_weight ?? c.weight) * 100)}
        metrics={metricsByCategory(c.id)}
        isCore={c.is_core}
      />
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-200">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {snap ? `Last updated: ${new Date(snap.created_at).toLocaleString()}` : 'No snapshot yet'}
          </p>
        </div>
        {snap && (
          <div className="flex items-center gap-2">
            <FreshnessBadge freshness={freshnessMap[snap.data_freshness]} />
            <ConfidenceBadge confidence={snap.confidence} />
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading latest snapshot…</p>}
      {isError && <p className="text-sm text-red-400">Failed to load snapshot.</p>}

      {!isLoading && !snap && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-sm text-slate-400">
            No snapshot yet. Click Refresh to fetch data and compute the first one.
          </p>
        </div>
      )}

      {snap && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Market Score
              </p>
              <p className="text-5xl font-bold tabular-nums text-white">
                {snap.market_score.toFixed(1)}
                <span className="text-2xl text-slate-500 font-normal"> / 100</span>
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 opacity-80"
                  style={{ width: `${snap.market_score}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Oscillator
              </p>
              <p className="text-4xl font-bold tabular-nums text-emerald-400">
                {snap.oscillator_value > 0 ? '+' : ''}
                {snap.oscillator_value.toFixed(1)}
              </p>
              <p className="text-xs text-slate-500 mt-1">range −100 to +100</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                Regime
              </p>
              <RegimeLabel label={snap.regime_label} size="md" />
              <p className="text-xs text-slate-400 mt-2 capitalize">
                Trend: <span className="text-slate-200 font-medium">{snap.trend}</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <button
                onClick={() => refresh.mutate()}
                disabled={refresh.isPending}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors"
              >
                {refresh.isPending ? 'Refreshing…' : 'Refresh Market Snapshot'}
              </button>
              <button
                onClick={() => generateAi.mutate()}
                disabled={generateAi.isPending}
                className="w-full rounded-lg border border-slate-700 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors"
              >
                {generateAi.isPending ? 'Generating…' : 'Generate AI Interpretation'}
              </button>
            </div>
          </div>
          {refresh.isError && (
            <p className="mt-3 text-xs text-red-400">{(refresh.error as Error).message}</p>
          )}
        </div>
      )}

      {!snap && (
        <button
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-sm font-medium text-white transition-colors"
        >
          {refresh.isPending ? 'Refreshing…' : 'Refresh Market Snapshot'}
        </button>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Macro Regime Oscillator — History
        </p>
        <div className="h-40 flex items-center justify-center rounded-lg bg-slate-800/50 border border-slate-800 border-dashed">
          <p className="text-sm text-slate-600">Chart — Phase 7</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Core Metrics
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {core.map(card)}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Supporting Metrics
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{supporting.map(card)}</div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          What Changed?
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-emerald-500 mb-2">Top positive signals</p>
            <ul className="space-y-1.5">
              {(snap?.top_positive_signals ?? []).length === 0 && (
                <li className="text-sm text-slate-600">—</li>
              )}
              {(snap?.top_positive_signals ?? []).map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-red-400 mb-2">Top negative signals</p>
            <ul className="space-y-1.5">
              {(snap?.top_negative_signals ?? []).length === 0 && (
                <li className="text-sm text-slate-600">—</li>
              )}
              {(snap?.top_negative_signals ?? []).map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          AI Interpretation
        </p>
        {generateAi.isError && (
          <p className="text-sm text-red-400">{(generateAi.error as Error).message}</p>
        )}
        {aiText ? (
          <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
            {aiText}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-16 rounded-lg bg-slate-800/30 border border-slate-800 border-dashed">
            <p className="text-sm text-slate-600">
              Click &ldquo;Generate AI Interpretation&rdquo; above
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
