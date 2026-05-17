import { PlaceholderBanner } from '@/components/ui/placeholder-banner'

const CHARTS = [
  { title: 'Macro Regime Oscillator', subtitle: 'Snapshot history — range −100 to +100', span: 2 },
  { title: 'Market Regime Score', subtitle: 'Snapshot history — range 0–100', span: 2 },
  { title: 'Liquidity', subtitle: 'M2 / Weekly M2 / Fed Balance Sheet', span: 1 },
  { title: 'Credit Stress', subtitle: 'High Yield OAS', span: 1 },
  { title: 'Volatility', subtitle: 'VIX', span: 1 },
  { title: 'Dollar', subtitle: 'DXY', span: 1 },
  { title: 'Treasury Yields', subtitle: '10Y and 2Y', span: 1 },
  { title: 'Yield Curve', subtitle: '10Y−2Y spread', span: 1 },
  { title: 'Equities', subtitle: 'S&P 500 / Nasdaq 100 / Russell 2000', span: 2 },
  { title: 'Commodities', subtitle: 'Gold / Silver', span: 1 },
  { title: 'Crypto', subtitle: 'BTC / ETH', span: 1 },
]

export default function ChartsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PlaceholderBanner />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-200">Charts</h1>
        <p className="text-xs text-slate-500">Chart data connects in Phase 7</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CHARTS.map((chart) => (
          <div
            key={chart.title}
            className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${chart.span === 2 ? 'col-span-2' : 'col-span-1'}`}
          >
            <p className="text-sm font-medium text-slate-200">{chart.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">{chart.subtitle}</p>
            <div
              className="flex items-center justify-center rounded-lg bg-slate-800/40 border border-slate-800 border-dashed"
              style={{ height: chart.span === 2 ? '180px' : '140px' }}
            >
              <p className="text-sm text-slate-600">Chart — Phase 7</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
