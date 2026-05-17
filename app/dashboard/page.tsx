import { PlaceholderBanner } from '@/components/ui/placeholder-banner'
import { RegimeLabel } from '@/components/ui/regime-label'
import { FreshnessBadge } from '@/components/ui/freshness-badge'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'
import { CategoryCard } from '@/components/dashboard/category-card'
import { categories, metrics as allMetrics, dataSources } from '@/config/seed-data'

const SNAPSHOT = {
  marketScore: 63,
  oscillatorValue: 26,
  regimeLabel: 'Early Risk-On' as const,
  trend: 'Improving',
  confidence: 'medium' as const,
  dataFreshness: 'delayed' as const,
  lastUpdated: '—',
}

// Placeholder category scores (real scores arrive in Phase 5).
const PLACEHOLDER_SCORES: Record<string, number> = {
  liquidity: 1.8, credit: 0.9, rates: 1.2, dollar: 2.4, bonds: 0.4,
  equities: 1.7, breadth: -0.6, volatility: 2.2, yield_curve: -0.2,
  commodities: 0.7, crypto: 1.1, sentiment: -0.8,
}

const srcShort = new Map(dataSources.map((s) => [s.id, s.name.split(' (')[0]]))

const metricsByCategory = (categoryId: string) =>
  allMetrics
    .filter((m) => m.category_id === categoryId)
    .sort((a, b) => a.display_order - b.display_order)
    .map((m) => ({
      name: m.name,
      source: srcShort.get(m.source_primary_id) ?? m.source_primary_id,
      symbol: m.source_symbol,
    }))

const cards = [...categories]
  .sort((a, b) => a.display_order - b.display_order)
  .map((c) => ({
    name: c.name,
    description: c.description,
    weight: Math.round(c.weight * 100),
    score: PLACEHOLDER_SCORES[c.id] ?? null,
    isCore: c.is_core,
    metrics: metricsByCategory(c.id),
  }))

const CORE_CATEGORIES = cards.filter((c) => c.isCore)
const SUPPORTING_CATEGORIES = cards.filter((c) => !c.isCore)

const BIGGEST_IMPROVEMENTS = ['VIX falling (fear easing)', 'DXY weakening', 'S&P 500 trend improving']
const BIGGEST_DETERIORATIONS = ['Market breadth remains weak', 'Sentiment moving toward greed']

export default function DashboardPage() {
  const osc = SNAPSHOT.oscillatorValue
  const oscStr = osc > 0 ? `+${osc}` : String(osc)
  const scoreBarPct = SNAPSHOT.marketScore

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PlaceholderBanner />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-200">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Last updated: {SNAPSHOT.lastUpdated}</p>
        </div>
        <div className="flex items-center gap-2">
          <FreshnessBadge freshness={SNAPSHOT.dataFreshness} />
          <ConfidenceBadge confidence={SNAPSHOT.confidence} />
        </div>
      </div>

      {/* Score hero */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* Market Score */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Market Score</p>
            <p className="text-5xl font-bold tabular-nums text-white">
              {SNAPSHOT.marketScore}
              <span className="text-2xl text-slate-500 font-normal"> / 100</span>
            </p>
            <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 opacity-80"
                style={{ width: `${scoreBarPct}%` }}
              />
            </div>
          </div>

          {/* Oscillator */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Oscillator</p>
            <p className="text-4xl font-bold tabular-nums text-emerald-400">{oscStr}</p>
            <p className="text-xs text-slate-500 mt-1">range −100 to +100</p>
          </div>

          {/* Regime */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Regime</p>
            <RegimeLabel label={SNAPSHOT.regimeLabel} size="md" />
            <p className="text-xs text-slate-400 mt-2">
              Trend:{' '}
              <span className="text-emerald-400 font-medium">{SNAPSHOT.trend}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 justify-center">
            <button
              disabled
              className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 opacity-50 cursor-not-allowed"
              title="Available after Phase 6"
            >
              Refresh Market Snapshot
            </button>
            <button
              disabled
              className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 opacity-50 cursor-not-allowed"
              title="Available after Phase 8"
            >
              Generate AI Interpretation
            </button>
          </div>
        </div>
      </div>

      {/* Oscillator chart placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Macro Regime Oscillator — History
        </p>
        <div className="h-40 flex items-center justify-center rounded-lg bg-slate-800/50 border border-slate-800 border-dashed">
          <p className="text-sm text-slate-600">Chart — Phase 7</p>
        </div>
      </div>

      {/* Core categories */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Core Metrics</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {CORE_CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              description={cat.description}
              score={cat.score}
              weight={cat.weight}
              metrics={cat.metrics}
              isCore
            />
          ))}
        </div>
      </div>

      {/* Supporting categories */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Supporting Metrics</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SUPPORTING_CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              description={cat.description}
              score={cat.score}
              weight={cat.weight}
              metrics={cat.metrics}
            />
          ))}
        </div>
      </div>

      {/* What Changed */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">What Changed?</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-emerald-500 mb-2">Biggest Improvements</p>
            <ul className="space-y-1.5">
              {BIGGEST_IMPROVEMENTS.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-red-400 mb-2">Biggest Deteriorations</p>
            <ul className="space-y-1.5">
              {BIGGEST_DETERIORATIONS.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* AI Interpretation */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">AI Interpretation</p>
        <div className="flex items-center justify-center h-16 rounded-lg bg-slate-800/30 border border-slate-800 border-dashed">
          <p className="text-sm text-slate-600">Generated on demand — click &ldquo;Generate AI Interpretation&rdquo;</p>
        </div>
      </div>
    </div>
  )
}
