'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RegimeLabel } from '@/components/ui/regime-label'

interface SnapshotRow {
  id: string
  created_at: string
  market_score: number
  oscillator_value: number
  regime_label: string
  trend: string
  confidence: string
  top_positive_signals: string[]
  top_negative_signals: string[]
}

interface SnapshotDetail {
  snapshot: SnapshotRow & { data_freshness: string; investor_posture: string | null }
  category_scores: Array<{
    category: string
    raw_category_score: number
    category_weight: number
    weighted_contribution: number
  }>
  metrics: Array<{ metric_id: string; name: string; raw_score: number; trend: string; score_reason: string }>
}

async function fetchList() {
  const res = await fetch('/api/snapshots?limit=30')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ snapshots: SnapshotRow[] }>
}

async function fetchDetail(id: string) {
  const res = await fetch(`/api/snapshots/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<SnapshotDetail>
}

export default function SnapshotsPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const list = useQuery({ queryKey: ['snapshots'], queryFn: fetchList })
  const detail = useQuery({
    queryKey: ['snapshot', selected],
    queryFn: () => fetchDetail(selected as string),
    enabled: !!selected,
  })

  const rows = list.data?.snapshots ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-200">Snapshots</h1>
        <p className="text-xs text-slate-500">{rows.length} saved</p>
      </div>

      {list.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {list.isError && <p className="text-sm text-red-400">Failed to load snapshots.</p>}
      {!list.isLoading && rows.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-sm text-slate-400">No snapshots yet — run a refresh from the dashboard.</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                {['Date / Time', 'Score', 'Oscillator', 'Regime', 'Trend', 'Confidence', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const open = selected === s.id
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(open ? null : s.id)}
                    className={`border-b border-slate-800/50 cursor-pointer transition-colors ${
                      open ? 'bg-slate-800/60' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums text-white">
                      {s.market_score.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums text-emerald-400">
                      {s.oscillator_value > 0 ? '+' : ''}
                      {s.oscillator_value.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <RegimeLabel label={s.regime_label} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{s.trend}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{s.confidence}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{open ? 'Hide' : 'View'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Snapshot Detail
          </p>
          {detail.isLoading && <p className="text-sm text-slate-500">Loading detail…</p>}
          {detail.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Market Score</p>
                  <p className="font-bold text-white">{detail.data.snapshot.market_score.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Oscillator</p>
                  <p className="font-bold text-emerald-400">
                    {detail.data.snapshot.oscillator_value.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Regime</p>
                  <RegimeLabel label={detail.data.snapshot.regime_label} size="sm" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Posture</p>
                  <p className="text-slate-300">{detail.data.snapshot.investor_posture ?? '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Category scores ({detail.data.category_scores.length})
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {detail.data.category_scores.map((c) => (
                    <div
                      key={c.category}
                      className="flex items-center justify-between rounded bg-slate-800/50 px-3 py-1.5 text-sm"
                    >
                      <span className="text-slate-300">{c.category}</span>
                      <span className="tabular-nums font-medium text-slate-200">
                        {c.raw_category_score.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-emerald-500 mb-1">Top positive</p>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {(detail.data.snapshot.top_positive_signals ?? []).map((x) => (
                      <li key={x}>• {x}</li>
                    ))}
                    {(detail.data.snapshot.top_positive_signals ?? []).length === 0 && (
                      <li className="text-slate-600">—</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-400 mb-1">Top negative</p>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {(detail.data.snapshot.top_negative_signals ?? []).map((x) => (
                      <li key={x}>• {x}</li>
                    ))}
                    {(detail.data.snapshot.top_negative_signals ?? []).length === 0 && (
                      <li className="text-slate-600">—</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
