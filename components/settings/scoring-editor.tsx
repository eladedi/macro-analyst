'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Category { id: string; name: string; weight: number; enabled: boolean }
interface Metric { id: string; name: string; category_id: string; metric_weight: number; enabled: boolean }
interface Threshold {
  id: string; min_score: number; max_score: number; regime_label: string; posture: string | null; enabled: boolean
}
interface Rule { id: string; metric_id: string; rule_name: string; rule_config: unknown; enabled: boolean }
interface ScoringData {
  categories: Category[]; metrics: Metric[]; regime_thresholds: Threshold[]; scoring_rules: Rule[]
}

export function ScoringEditor() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['scoring-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/scoring')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<ScoringData>
    },
  })

  const [cats, setCats] = useState<Category[]>([])
  const [mets, setMets] = useState<Metric[]>([])
  const [thr, setThr] = useState<Threshold[]>([])
  const [ruleDraft, setRuleDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    if (data) {
      setCats(data.categories)
      setMets(data.metrics)
      setThr(data.regime_thresholds)
    }
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      const scoring_rules = Object.entries(ruleDraft).map(([id, txt]) => {
        let parsed: unknown
        try {
          parsed = JSON.parse(txt)
        } catch {
          throw new Error(`Rule ${id}: invalid JSON`)
        }
        return { id, rule_config: parsed }
      })
      const res = await fetch('/api/settings/scoring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: cats.map((c) => ({ id: c.id, weight: c.weight, enabled: c.enabled })),
          metrics: mets.map((m) => ({ id: m.id, metric_weight: m.metric_weight, enabled: m.enabled })),
          regime_thresholds: thr.map((t) => ({
            id: t.id, min_score: t.min_score, max_score: t.max_score,
            regime_label: t.regime_label, posture: t.posture, enabled: t.enabled,
          })),
          scoring_rules,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      return json as { enabled_category_weight_sum: number }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scoring-settings'] })
      setRuleDraft({})
    },
  })

  if (isLoading || !data) return <p className="text-sm text-slate-500">Loading scoring model…</p>

  const catSum = cats.filter((c) => c.enabled).reduce((s, c) => s + Number(c.weight || 0), 0)

  return (
    <div className="space-y-6">
      {/* Category weights */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-300">Category Weights</p>
          <span className={`text-xs ${Math.abs(catSum - 1) < 1e-6 ? 'text-slate-500' : 'text-amber-400'}`}>
            enabled sum: {catSum.toFixed(3)} {Math.abs(catSum - 1) < 1e-6 ? '' : '(engine normalizes over active categories)'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {cats.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <label className="text-sm text-slate-300">{c.name}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.01" min="0" max="1" value={c.weight}
                  onChange={(e) => setCats((s) => s.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))}
                  className="w-16 rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 tabular-nums"
                />
                <input
                  type="checkbox" checked={c.enabled}
                  onChange={(e) => setCats((s) => s.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))}
                  title="enabled"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric weights */}
      <div>
        <p className="text-sm font-medium text-slate-300 mb-2">Metric Weights (within category)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {mets.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <label className="text-sm text-slate-300">{m.name}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.05" min="0" value={m.metric_weight}
                  onChange={(e) => setMets((s) => s.map((x, j) => (j === i ? { ...x, metric_weight: Number(e.target.value) } : x)))}
                  className="w-16 rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 tabular-nums"
                />
                <input
                  type="checkbox" checked={m.enabled}
                  onChange={(e) => setMets((s) => s.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))}
                  title="enabled"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regime thresholds */}
      <div>
        <p className="text-sm font-medium text-slate-300 mb-2">Regime Thresholds</p>
        <div className="space-y-1">
          {thr.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2 text-sm">
              <input type="number" value={t.min_score}
                onChange={(e) => setThr((s) => s.map((x, j) => (j === i ? { ...x, min_score: Number(e.target.value) } : x)))}
                className="w-14 rounded bg-slate-700 px-2 py-1 text-xs tabular-nums" />
              <span className="text-slate-600">–</span>
              <input type="number" value={t.max_score}
                onChange={(e) => setThr((s) => s.map((x, j) => (j === i ? { ...x, max_score: Number(e.target.value) } : x)))}
                className="w-14 rounded bg-slate-700 px-2 py-1 text-xs tabular-nums" />
              <input value={t.regime_label}
                onChange={(e) => setThr((s) => s.map((x, j) => (j === i ? { ...x, regime_label: e.target.value } : x)))}
                className="flex-1 rounded bg-slate-700 px-2 py-1 text-xs" />
              <input value={t.posture ?? ''}
                onChange={(e) => setThr((s) => s.map((x, j) => (j === i ? { ...x, posture: e.target.value } : x)))}
                className="flex-1 rounded bg-slate-700 px-2 py-1 text-xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Scoring rules (JSON per metric) */}
      <div>
        <p className="text-sm font-medium text-slate-300 mb-2">Scoring Rules (JSON)</p>
        <div className="space-y-1">
          {data.scoring_rules.map((r) => (
            <details key={r.id} className="rounded-lg bg-slate-800/50 px-3 py-2">
              <summary className="cursor-pointer text-sm text-slate-300">
                {r.metric_id} <span className="text-xs text-slate-600">— {r.rule_name}</span>
              </summary>
              <textarea
                rows={8}
                defaultValue={JSON.stringify(r.rule_config, null, 2)}
                onChange={(e) => setRuleDraft((s) => ({ ...s, [r.id]: e.target.value }))}
                className="mt-2 w-full rounded bg-slate-900 border border-slate-800 px-2 py-1 text-xs font-mono text-slate-300"
              />
            </details>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {save.isPending ? 'Saving…' : 'Save scoring model'}
        </button>
        {save.isError && <span className="text-sm text-red-400">{(save.error as Error).message}</span>}
        {save.isSuccess && <span className="text-sm text-emerald-400">Saved — applies on next refresh.</span>}
      </div>
    </div>
  )
}
