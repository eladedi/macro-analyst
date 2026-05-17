'use client'

import { useEffect, useRef, useState } from 'react'

interface SourceInfo {
  name: string
  type: string
  symbol: string
  reliability: string
  baseUrl: string | null
  enabled: boolean
}

interface ConstituentMetric {
  name: string
  source: string
  symbol: string
}

interface Props {
  metricName: string
  description: string
  source?: SourceInfo
  metrics?: ConstituentMetric[]
}

export function MetricInfo({ metricName, description, source, metrics }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`About ${metricName}`}
        aria-expanded={open}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] font-bold text-slate-400 hover:border-slate-400 hover:text-slate-200 transition-colors"
      >
        i
      </button>

      {open && (
        <div className="absolute left-0 top-6 z-20 w-80 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-xl">
          <p className="text-sm font-semibold text-slate-100">{metricName}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{description}</p>

          {metrics && (
            <div className="mt-3 border-t border-slate-800 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Metrics in this category
              </p>
              {metrics.length === 0 ? (
                <p className="mt-1 text-xs italic text-slate-600">No MVP metrics yet</p>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {metrics.map((m) => (
                    <li key={m.symbol} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-300">{m.name}</span>
                      <span className="font-mono text-slate-500 whitespace-nowrap">
                        {m.source}:{m.symbol}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {source && (
            <div className="mt-3 border-t border-slate-800 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Data source
              </p>
              <p className="mt-1 text-xs font-medium text-slate-200">
                {source.name}
                {!source.enabled && (
                  <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                    pending
                  </span>
                )}
              </p>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                <dt className="text-slate-500">Symbol</dt>
                <dd className="font-mono text-slate-300">{source.symbol}</dd>
                <dt className="text-slate-500">Type</dt>
                <dd className="text-slate-300">{source.type}</dd>
                <dt className="text-slate-500">Reliability</dt>
                <dd className="text-slate-300 capitalize">{source.reliability}</dd>
              </dl>
              {source.baseUrl && (
                <p className="mt-2 truncate font-mono text-[10px] text-slate-600">
                  {source.baseUrl}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
