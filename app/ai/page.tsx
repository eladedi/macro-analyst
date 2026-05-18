'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Interpretation {
  id: string
  snapshot_id: string | null
  interpretation_type: string
  output_text: string
  model: string
  token_usage: { input_tokens: number; output_tokens: number }
  created_at: string
}

async function postJSON(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data as Interpretation
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function AIPage() {
  const qc = useQueryClient()
  const [metricId, setMetricId] = useState('')
  const [latest, setLatest] = useState<Interpretation | null>(null)

  const metrics = useQuery({
    queryKey: ['metrics-defs'],
    queryFn: () => getJSON<{ metrics: { id: string; name: string }[] }>('/api/metrics'),
  })
  const history = useQuery({
    queryKey: ['ai-interpretations'],
    queryFn: () => getJSON<{ interpretations: Interpretation[] }>('/api/ai/interpretations'),
  })

  const run = useMutation({
    mutationFn: (args: { url: string; body?: unknown }) => postJSON(args.url, args.body),
    onSuccess: (data) => {
      setLatest(data)
      qc.invalidateQueries({ queryKey: ['ai-interpretations'] })
    },
  })

  const busy = run.isPending
  const fire = (url: string, body?: unknown) => run.mutate({ url, body })

  const actions = [
    { label: 'Daily Brief', desc: 'Full regime interpretation of the latest snapshot.', url: '/api/ai/interpret-snapshot' },
    { label: 'Weekly Review', desc: 'What improved / deteriorated across recent snapshots.', url: '/api/ai/weekly-review' },
    { label: 'Crisis Mode', desc: 'Stress analysis — volatility, credit, liquidity, stabilization.', url: '/api/ai/crisis-mode' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-200">AI Interpretation</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI runs only when you request it. Every run is saved (append-only).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {actions.map((a) => (
          <div key={a.label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm font-semibold text-slate-200">{a.label}</p>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">{a.desc}</p>
            <button
              onClick={() => fire(a.url)}
              disabled={busy}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              {busy ? 'Generating…' : 'Generate'}
            </button>
          </div>
        ))}
      </div>

      {/* Explain a metric */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-slate-200">Explain a Metric</p>
        <p className="text-xs text-slate-500 mt-1 mb-3">
          What it measures, why it scored that way, what would invalidate the reading.
        </p>
        <div className="flex gap-2">
          <select
            value={metricId}
            onChange={(e) => setMetricId(e.target.value)}
            className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300"
          >
            <option value="">Select a metric…</option>
            {(metrics.data?.metrics ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => fire('/api/ai/explain-metric', { metric_id: metricId })}
            disabled={busy || !metricId}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Explain
          </button>
        </div>
      </div>

      {run.isError && (
        <p className="text-sm text-red-400">{(run.error as Error).message}</p>
      )}

      {/* Latest result */}
      {latest && (
        <div className="rounded-xl border border-emerald-700/40 bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {latest.interpretation_type} — latest
            </p>
            <p className="text-xs text-slate-500">
              {latest.model} · {latest.token_usage.input_tokens}→{latest.token_usage.output_tokens} tok
            </p>
          </div>
          <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
            {latest.output_text}
          </pre>
        </div>
      )}

      {/* History */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Saved Interpretations
        </p>
        {history.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {history.data && history.data.interpretations.length === 0 && (
          <p className="text-sm text-slate-600">None yet — generate one above.</p>
        )}
        <div className="space-y-2">
          {(history.data?.interpretations ?? []).map((it) => (
            <details key={it.id} className="rounded-lg bg-slate-800/50 px-3 py-2">
              <summary className="cursor-pointer text-sm text-slate-300 flex items-center justify-between">
                <span className="capitalize font-medium">{it.interpretation_type}</span>
                <span className="text-xs text-slate-500">
                  {new Date(it.created_at).toLocaleString()}
                </span>
              </summary>
              <pre className="mt-2 text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-sans">
                {it.output_text}
              </pre>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
