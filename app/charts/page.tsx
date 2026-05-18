'use client'

import { useQuery } from '@tanstack/react-query'
import { LineChart, type ChartSeries } from '@/components/charts/line-chart'

interface HistoryResp {
  series: Record<string, { name: string; unit: string; points: { t: string; v: number }[] }>
}
interface SnapshotsResp {
  snapshots: { created_at: string; market_score: number; oscillator_value: number }[]
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const METRIC_CHARTS: { title: string; subtitle: string; ids: string[]; rebase?: boolean; wide?: boolean }[] = [
  { title: 'Liquidity', subtitle: 'M2 / Weekly M2 / Fed Balance Sheet (rebased to 100)', ids: ['m2', 'weekly_m2', 'fed_balance_sheet'], rebase: true, wide: true },
  { title: 'Credit Stress', subtitle: 'High Yield OAS', ids: ['hy_oas'] },
  { title: 'Volatility', subtitle: 'VIX', ids: ['vix'] },
  { title: 'Treasury Yields', subtitle: '10Y and 2Y (%)', ids: ['us10y', 'us2y'] },
  { title: 'Yield Curve', subtitle: '10Y−2Y spread (%)', ids: ['yield_curve_10y2y'] },
  { title: 'Dollar', subtitle: 'DXY', ids: ['dxy'] },
  { title: 'Equities', subtitle: 'S&P 500 / Nasdaq 100 / Russell 2000 (rebased)', ids: ['sp500', 'ndx', 'rut'], rebase: true, wide: true },
  { title: 'Commodities', subtitle: 'Gold / Silver (rebased)', ids: ['gold', 'silver'], rebase: true },
  { title: 'Crypto', subtitle: 'BTC / ETH (rebased)', ids: ['btc', 'eth'], rebase: true },
]

function Card({ title, subtitle, wide, children }: { title: string; subtitle: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${wide ? 'col-span-2' : 'col-span-1'}`}>
      <p className="text-sm font-medium text-slate-200">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">{subtitle}</p>
      {children}
    </div>
  )
}

export default function ChartsPage() {
  const hist = useQuery({ queryKey: ['metrics-history'], queryFn: () => getJSON<HistoryResp>('/api/metrics/history') })
  const snaps = useQuery({ queryKey: ['snapshots-chart'], queryFn: () => getJSON<SnapshotsResp>('/api/snapshots?limit=100') })

  const series = hist.data?.series ?? {}
  const toSeries = (ids: string[]): ChartSeries[] =>
    ids
      .filter((id) => series[id])
      .map((id) => ({ id, name: series[id].name, points: series[id].points }))

  // snapshots come newest-first; charts want oldest-first
  const snapAsc = [...(snaps.data?.snapshots ?? [])].reverse()
  const marketSeries: ChartSeries[] = [
    { id: 'market', name: 'Market Score', points: snapAsc.map((s) => ({ t: s.created_at, v: s.market_score })) },
  ]
  const oscSeries: ChartSeries[] = [
    { id: 'osc', name: 'Oscillator', points: snapAsc.map((s) => ({ t: s.created_at, v: s.oscillator_value })) },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-200">Charts</h1>
        <p className="text-xs text-slate-500">
          {snaps.data ? `${snaps.data.snapshots.length} snapshots` : '…'} ·{' '}
          {hist.data ? `${Object.keys(series).length} metric series` : '…'}
        </p>
      </div>

      {(hist.isError || snaps.isError) && (
        <p className="text-sm text-red-400">Failed to load chart data.</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card title="Macro Regime Oscillator" subtitle="Snapshot history (−100..+100)" wide>
          <LineChart series={oscSeries} height={200} />
        </Card>
        <Card title="Market Regime Score" subtitle="Snapshot history (0–100)" wide>
          <LineChart series={marketSeries} height={200} />
        </Card>

        {METRIC_CHARTS.map((c) => (
          <Card key={c.title} title={c.title} subtitle={c.subtitle} wide={c.wide}>
            <LineChart series={toSeries(c.ids)} rebase={c.rebase} height={c.wide ? 200 : 180} />
          </Card>
        ))}
      </div>
    </div>
  )
}
