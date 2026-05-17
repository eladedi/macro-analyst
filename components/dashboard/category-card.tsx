import { MetricInfo } from '@/components/ui/metric-info'

interface Props {
  name: string
  description: string
  score: number | null
  weight: number
  metrics: { name: string; source: string; symbol: string }[]
  isCore?: boolean
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-slate-500'
  if (score >= 2) return 'text-emerald-400'
  if (score >= 0.5) return 'text-green-400'
  if (score >= -0.5) return 'text-yellow-400'
  if (score >= -2) return 'text-orange-400'
  return 'text-red-400'
}

function scoreBar(score: number | null) {
  if (score === null) return 0
  return Math.round(((score + 5) / 10) * 100)
}

export function CategoryCard({ name, description, score, weight, metrics }: Props) {
  const color = scoreColor(score)
  const barPct = scoreBar(score)
  const scoreStr = score === null ? '—' : score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5">
          <p className="text-sm font-medium text-slate-200">{name}</p>
          <MetricInfo metricName={name} description={description} metrics={metrics} />
        </span>
        <span className="text-xs text-slate-500">{weight}%</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-bold tabular-nums ${color}`}>{scoreStr}</span>
        <span className="text-xs text-slate-500">of ±5</span>
      </div>
      {/* score bar */}
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            score !== null && score >= 0 ? 'bg-emerald-500/60' : 'bg-red-500/60'
          }`}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </div>
  )
}
