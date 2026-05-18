'use client'

import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

export interface ChartSeries {
  id: string
  name: string
  points: { t: string; v: number }[]
}

const PALETTE = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#f87171']

interface Props {
  series: ChartSeries[]
  height?: number
  /** Rebase each series to 100 at its first point — for mixed-scale macro series. */
  rebase?: boolean
}

export function LineChart({ series, height = 220, rebase = false }: Props) {
  const nonEmpty = series.filter((s) => s.points.length > 0)

  if (nonEmpty.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-slate-800/40 border border-slate-800 border-dashed"
        style={{ height }}
      >
        <p className="text-sm text-slate-600">No data yet</p>
      </div>
    )
  }

  // Merge all series onto the union of timestamps so multi-series charts align.
  const allTs = Array.from(new Set(nonEmpty.flatMap((s) => s.points.map((p) => p.t)))).sort()
  const base = new Map(nonEmpty.map((s) => [s.id, s.points[0]?.v ?? 1]))
  const data = allTs.map((t) => {
    const row: Record<string, string | number | null> = { t }
    for (const s of nonEmpty) {
      const pt = s.points.find((p) => p.t === t)
      if (pt === undefined) {
        row[s.id] = null
      } else {
        const b = base.get(s.id) || 1
        row[s.id] = rebase ? (pt.v / b) * 100 : pt.v
      }
    }
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickFormatter={(t: string) => t.slice(5, 10)}
          interval="preserveStartEnd"
          minTickGap={32}
          stroke="#334155"
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          stroke="#334155"
          width={48}
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => (rebase ? v.toFixed(0) : String(v))}
        />
        <Tooltip
          contentStyle={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#94a3b8' }}
        />
        {nonEmpty.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {nonEmpty.map((s, i) => (
          <Line
            key={s.id}
            type="monotone"
            dataKey={s.id}
            name={s.name}
            stroke={PALETTE[i % PALETTE.length]}
            dot={false}
            strokeWidth={2}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  )
}
