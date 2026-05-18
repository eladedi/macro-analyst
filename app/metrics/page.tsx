'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'
import { FreshnessBadge } from '@/components/ui/freshness-badge'
import { MetricInfo } from '@/components/ui/metric-info'
import { Sparkline } from '@/components/charts/sparkline'
import { ColumnLegend } from '@/components/metrics/column-legend'
import { metrics as cfgMetrics, dataSources } from '@/config/seed-data'

interface LatestMetric {
  metric_id: string
  name: string
  unit: string
  category: string
  category_weight: number
  metric_weight: number
  source: string | null
  raw_score: number | null
  trend: string | null
  weighted_contribution: number | null
  value: number | null
  timestamp: string | null
  freshness: 'fresh' | 'delayed' | 'stale' | 'manual' | null
  confidence: 'high' | 'medium' | 'low' | null
}

const srcById = new Map(dataSources.map((s) => [s.id, s]))
const cfgById = new Map(cfgMetrics.map((m) => [m.id, m]))

function scoreColor(s: number | null) {
  if (s === null) return 'text-slate-600'
  if (s >= 2) return 'text-emerald-400'
  if (s >= 0) return 'text-green-400'
  if (s >= -2) return 'text-orange-400'
  return 'text-red-400'
}

function trendColor(t: string | null) {
  if (t === 'up') return 'text-emerald-400'
  if (t === 'down') return 'text-red-400'
  return 'text-slate-400'
}

async function fetchLatest() {
  const res = await fetch('/api/metrics/latest')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ snapshot_id: string | null; metrics: LatestMetric[] }>
}

async function fetchHistory() {
  const res = await fetch('/api/metrics/history')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{
    series: Record<string, { points: { t: string; v: number }[] }>
  }>
}

export default function MetricsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['metrics-latest'],
    queryFn: fetchLatest,
  })
  const history = useQuery({ queryKey: ['metrics-history'], queryFn: fetchHistory })

  const [explain, setExplain] = useState<{ name: string; text: string } | null>(null)
  const explainMutation = useMutation({
    mutationFn: async (v: { id: string; name: string }) => {
      const res = await fetch('/api/ai/explain-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric_id: v.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setExplain({ name: v.name, text: json.output_text })
    },
  })

  const rows = data?.metrics ?? []
  const sparkById = (id: string) =>
    (history.data?.series[id]?.points ?? []).slice(-40).map((p) => p.v)

  return (
    <div className="p-6 max-w-full space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-200">Metrics</h1>
        <p className="text-xs text-slate-500">
          {data?.snapshot_id
            ? `Scores from latest snapshot ${data.snapshot_id.slice(0, 8)}`
            : 'No snapshot yet — values shown, scores pending a refresh'}
        </p>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading metrics…</p>}
      {isError && <p className="text-sm text-red-400">Failed to load metrics.</p>}

      {!isLoading && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                {[
                  'Category', 'Metric', 'Value', 'Unit', 'Cat. Wt.', 'Metric Wt.',
                  'Score', 'Trend', 'Contribution', 'Source', 'Freshness', 'Confidence', 'Chart', 'Explain',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const cfg = cfgById.get(m.metric_id)
                const src = cfg ? srcById.get(cfg.source_primary_id) : undefined
                return (
                  <tr
                    key={m.metric_id}
                    className="border-b border-slate-800/60 bg-slate-950 hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {m.category}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium text-slate-200">{m.name}</span>
                        {cfg && src && (
                          <MetricInfo
                            metricName={m.name}
                            description={cfg.description}
                            source={{
                              name: src.name,
                              type: src.type,
                              symbol: cfg.source_symbol,
                              reliability: src.reliability,
                              baseUrl: src.base_url,
                              enabled: src.enabled,
                            }}
                          />
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-300">
                      {m.value === null ? '—' : m.value.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-slate-500">{m.unit}</td>
                    <td className="px-3 py-3 tabular-nums text-slate-500">
                      {Math.round(m.category_weight * 100)}%
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-500">
                      {Math.round(m.metric_weight * 100)}%
                    </td>
                    <td className={`px-3 py-3 font-bold tabular-nums ${scoreColor(m.raw_score)}`}>
                      {m.raw_score === null ? '—' : m.raw_score > 0 ? `+${m.raw_score}` : m.raw_score}
                    </td>
                    <td className={`px-3 py-3 capitalize ${trendColor(m.trend)}`}>
                      {m.trend ?? '—'}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-400">
                      {m.weighted_contribution === null
                        ? '—'
                        : m.weighted_contribution.toFixed(4)}
                    </td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {m.source?.split(' (')[0] ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      {m.freshness ? <FreshnessBadge freshness={m.freshness} /> : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {m.confidence ? <ConfidenceBadge confidence={m.confidence} /> : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <Sparkline values={sparkById(m.metric_id)} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() =>
                          explainMutation.mutate({ id: m.metric_id, name: m.name })
                        }
                        disabled={explainMutation.isPending}
                        className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {explainMutation.isPending &&
                        explainMutation.variables?.id === m.metric_id
                          ? '…'
                          : 'Explain'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {explainMutation.isError && (
        <p className="text-sm text-red-400">{(explainMutation.error as Error).message}</p>
      )}

      {explain && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setExplain(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-100">{explain.name}</p>
              <button
                onClick={() => setExplain(null)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                Close
              </button>
            </div>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
              {explain.text}
            </pre>
          </div>
        </div>
      )}

      <ColumnLegend />
    </div>
  )
}
