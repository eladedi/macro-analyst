'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface PromptTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  prompt_text: string
  enabled: boolean
}

export function PromptEditor() {
  const qc = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['prompt-templates'],
    queryFn: async () => {
      const res = await fetch('/api/settings/prompts')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<{ prompts: PromptTemplate[] }>
    },
  })

  const save = useMutation({
    mutationFn: async (p: { id: string; prompt_text: string }) => {
      const res = await fetch('/api/settings/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      return json
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['prompt-templates'] })
      setDrafts((s) => {
        const next = { ...s }
        delete next[vars.id]
        return next
      })
    },
  })

  if (isLoading) return <p className="text-sm text-slate-500">Loading prompts…</p>

  return (
    <div className="space-y-4">
      {(data?.prompts ?? []).map((p) => {
        const value = drafts[p.id] ?? p.prompt_text
        const dirty = value !== p.prompt_text
        return (
          <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-slate-200">{p.name}</p>
              <span className="text-xs font-mono text-slate-600">{p.slug}</span>
            </div>
            {p.description && (
              <p className="text-xs text-slate-500 mb-2">{p.description}</p>
            )}
            <textarea
              value={value}
              onChange={(e) => setDrafts((s) => ({ ...s, [p.id]: e.target.value }))}
              rows={8}
              className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300 leading-relaxed"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              {dirty && (
                <button
                  onClick={() => setDrafts((s) => { const n = { ...s }; delete n[p.id]; return n })}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => save.mutate({ id: p.id, prompt_text: value })}
                disabled={!dirty || save.isPending}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-medium text-white transition-colors"
              >
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )
      })}
      {save.isError && (
        <p className="text-sm text-red-400">{(save.error as Error).message}</p>
      )}
      <p className="text-xs text-slate-600">
        Edits take effect on the next AI interpretation. Saved to the database (append on next run is unaffected — history is preserved).
      </p>
    </div>
  )
}
