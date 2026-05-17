import { PlaceholderBanner } from '@/components/ui/placeholder-banner'
import { FreshnessBadge } from '@/components/ui/freshness-badge'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'

const PLACEHOLDER_METRICS = [
  { category: 'Liquidity', name: 'M2 Money Supply', value: '—', unit: '$T', trend: 'Up', score: 2, catWeight: 16, metricWeight: 30, contribution: '+0.096', source: 'FRED: M2SL', freshness: 'stale', confidence: 'high' },
  { category: 'Liquidity', name: 'Weekly M2', value: '—', unit: '$T', trend: 'Up', score: 1, catWeight: 16, metricWeight: 20, contribution: '+0.032', source: 'FRED: WM2NS', freshness: 'stale', confidence: 'high' },
  { category: 'Liquidity', name: 'Fed Balance Sheet', value: '—', unit: '$T', trend: 'Down', score: -1, catWeight: 16, metricWeight: 20, contribution: '-0.032', source: 'FRED: WALCL', freshness: 'stale', confidence: 'high' },
  { category: 'Rates', name: 'Fed Funds Rate', value: '—', unit: '%', trend: 'Flat', score: 0, catWeight: 12, metricWeight: 50, contribution: '0.000', source: 'FRED: FEDFUNDS', freshness: 'stale', confidence: 'high' },
  { category: 'Rates', name: '2Y Treasury Yield', value: '—', unit: '%', trend: 'Down', score: 1, catWeight: 12, metricWeight: 50, contribution: '+0.060', source: 'FRED: DGS2', freshness: 'stale', confidence: 'high' },
  { category: 'Bonds / Yields', name: '10Y Treasury Yield', value: '—', unit: '%', trend: 'Flat', score: 0, catWeight: 10, metricWeight: 100, contribution: '0.000', source: 'FRED: DGS10', freshness: 'stale', confidence: 'high' },
  { category: 'Yield Curve', name: '10Y-2Y Spread', value: '—', unit: 'bps', trend: 'Up', score: 1, catWeight: 8, metricWeight: 100, contribution: '+0.080', source: 'FRED: T10Y2Y', freshness: 'stale', confidence: 'high' },
  { category: 'Credit', name: 'High Yield OAS', value: '—', unit: 'bps', trend: 'Down', score: 2, catWeight: 14, metricWeight: 100, contribution: '+0.280', source: 'FRED: BAMLH0A0HYM2', freshness: 'stale', confidence: 'high' },
  { category: 'Volatility', name: 'VIX', value: '—', unit: 'index', trend: 'Down', score: 2, catWeight: 8, metricWeight: 70, contribution: '+0.112', source: 'FRED: VIXCLS', freshness: 'stale', confidence: 'high' },
  { category: 'Dollar', name: 'DXY', value: '—', unit: 'index', trend: 'Down', score: 2, catWeight: 10, metricWeight: 100, contribution: '+0.200', source: 'Market data', freshness: 'stale', confidence: 'medium' },
  { category: 'Equities', name: 'S&P 500', value: '—', unit: 'index', trend: 'Up', score: 2, catWeight: 8, metricWeight: 50, contribution: '+0.080', source: 'Market data', freshness: 'stale', confidence: 'medium' },
  { category: 'Equities', name: 'Nasdaq 100', value: '—', unit: 'index', trend: 'Up', score: 1, catWeight: 8, metricWeight: 30, contribution: '+0.024', source: 'Market data', freshness: 'stale', confidence: 'medium' },
  { category: 'Equities', name: 'Russell 2000', value: '—', unit: 'index', trend: 'Flat', score: 0, catWeight: 8, metricWeight: 20, contribution: '0.000', source: 'Market data', freshness: 'stale', confidence: 'medium' },
  { category: 'Commodities', name: 'Gold', value: '—', unit: 'USD', trend: 'Up', score: 1, catWeight: 3, metricWeight: 50, contribution: '+0.015', source: 'Market data', freshness: 'stale', confidence: 'medium' },
  { category: 'Commodities', name: 'Silver', value: '—', unit: 'USD', trend: 'Up', score: 1, catWeight: 3, metricWeight: 50, contribution: '+0.015', source: 'Market data', freshness: 'stale', confidence: 'medium' },
  { category: 'Crypto', name: 'BTC', value: '—', unit: 'USD', trend: 'Up', score: 2, catWeight: 2, metricWeight: 60, contribution: '+0.024', source: 'CoinGecko', freshness: 'stale', confidence: 'medium' },
  { category: 'Crypto', name: 'ETH', value: '—', unit: 'USD', trend: 'Up', score: 1, catWeight: 2, metricWeight: 40, contribution: '+0.008', source: 'CoinGecko', freshness: 'stale', confidence: 'medium' },
]

function scoreColor(score: number) {
  if (score >= 2) return 'text-emerald-400'
  if (score >= 0) return 'text-green-400'
  if (score >= -2) return 'text-orange-400'
  return 'text-red-400'
}

function trendColor(trend: string) {
  if (trend === 'Up') return 'text-emerald-400'
  if (trend === 'Down') return 'text-red-400'
  return 'text-slate-400'
}

export default function MetricsPage() {
  return (
    <div className="p-6 max-w-full space-y-4">
      <PlaceholderBanner />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-200">Metrics</h1>
        <p className="text-xs text-slate-500">{PLACEHOLDER_METRICS.length} metrics — values populate after Phase 4</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80">
              {[
                'Category', 'Metric', 'Value', 'Unit', 'Trend',
                'Score', 'Cat. Wt.', 'Metric Wt.', 'Contribution',
                'Source', 'Freshness', 'Confidence', 'Explain',
              ].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_METRICS.map((m, i) => (
              <tr
                key={i}
                className="border-b border-slate-800/60 bg-slate-950 hover:bg-slate-900/50 transition-colors"
              >
                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{m.category}</td>
                <td className="px-3 py-3 font-medium text-slate-200 whitespace-nowrap">{m.name}</td>
                <td className="px-3 py-3 tabular-nums text-slate-400">{m.value}</td>
                <td className="px-3 py-3 text-slate-500">{m.unit}</td>
                <td className={`px-3 py-3 font-medium ${trendColor(m.trend)}`}>{m.trend}</td>
                <td className={`px-3 py-3 font-bold tabular-nums ${scoreColor(m.score)}`}>
                  {m.score > 0 ? `+${m.score}` : m.score}
                </td>
                <td className="px-3 py-3 tabular-nums text-slate-500">{m.catWeight}%</td>
                <td className="px-3 py-3 tabular-nums text-slate-500">{m.metricWeight}%</td>
                <td className="px-3 py-3 tabular-nums text-slate-400">{m.contribution}</td>
                <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs">{m.source}</td>
                <td className="px-3 py-3">
                  <FreshnessBadge freshness={m.freshness as 'fresh' | 'delayed' | 'stale' | 'manual'} />
                </td>
                <td className="px-3 py-3">
                  <ConfidenceBadge confidence={m.confidence as 'high' | 'medium' | 'low'} />
                </td>
                <td className="px-3 py-3">
                  <button
                    disabled
                    className="text-xs text-slate-600 cursor-not-allowed"
                    title="Available after Phase 8"
                  >
                    Explain
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
