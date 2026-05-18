'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Override {
  id: string
  metric_id: string
  metric_name: string
  override_type: string
  override_value: unknown
  reason: string | null
  enabled: boolean
  created_at: string
}

export function OverridesEditor() {
  const qc = useQueryClient()
  const [metricId, setMetricId] = useState('')
  const [type, setType] = useState<'score' | 'weight' | 'note'>('score')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')

  const metrics = useQuery({
    queryKey: ['metrics-defs'],
    queryFn: async () => {
      const r = await fetch('/api/metrics')
      return r.json() as Promise<{ metrics: { id: string; name: string }[] }>
    },
  })
  const list = useQuery({
    queryKey: ['overrides'],
    queryFn: async () => {
      const r = await fetch('/api/settings/overrides')
      return r.json() as Promise<{ overrides: Override[] }>
    },
  })

  const add = useMutation({
    mutationFn: async () => {
      const override_value = type === 'note' ? value : Number(value)
      const r = await fetch('/api/settings/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric_id: metricId, override_type: type, override_value, reason }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['overrides'] })
      setValue(''); setReason('')
    },
  })

  const disable = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/settings/overrides?id=${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['overrides'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <select value={metricId} onChange={(e) => setMetricId(e.target.value)}
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300">
          <option value="">Metric…</option>
          {(metrics.data?.metrics ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value as 'score' | 'weight' | 'note')}
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300">
          <option value="score">score (−5..5)</option>
          <option value="weight">weight</option>
          <option value="note">note</option>
        </select>
        <input value={value} onChange={(e) => setValue(e.target.value)}
          placeholder={type === 'note' ? 'note text' : 'number'}
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 w-32" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="reason"
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 min-w-[8rem]" />
        <button
          onClick={() => add.mutate()}
          disabled={add.isPending || !metricId || (type !== 'note' && value === '')}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white">
          Add override
        </button>
      </div>
      {add.isError && <p className="text-sm text-red-400">{(add.error as Error).message}</p>}

      <div className="space-y-1">
        {(list.data?.overrides ?? []).length === 0 && (
          <p className="text-sm text-slate-600">No overrides.</p>
        )}
        {(list.data?.overrides ?? []).map((o) => (
          <div key={o.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${o.enabled ? 'bg-slate-800/50' : 'bg-slate-900 opacity-50'}`}>
            <span className="text-slate-300">
              <span className="font-medium">{o.metric_name}</span>{' '}
              <span className="text-slate-500">{o.override_type} = {String(o.override_value)}</span>
              {o.reason && <span className="text-slate-600"> — {o.reason}</span>}
              {!o.enabled && <span className="ml-2 text-xs text-slate-600">(disabled)</span>}
            </span>
            {o.enabled && (
              <button onClick={() => disable.mutate(o.id)}
                className="text-xs text-slate-500 hover:text-red-400">Disable</button>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-600">
        Overrides apply on the next refresh: score forces the raw score (±5), weight replaces the
        metric weight, note is annotation-only. Disabling preserves the audit trail.
      </p>
    </div>
  )
}
