const COLUMNS: { name: string; desc: string }[] = [
  { name: 'Category', desc: 'The macro category this metric belongs to (Liquidity, Rates, Credit, …).' },
  { name: 'Metric', desc: 'The indicator name. Click the “i” for what it measures and its data source.' },
  { name: 'Value', desc: 'The latest raw observed value of the metric.' },
  { name: 'Unit', desc: 'Unit of the value — $B, %, index, bps, USD, etc.' },
  { name: 'Cat. Wt.', desc: 'The category’s weight in the final Market Regime Score.' },
  { name: 'Metric Wt.', desc: 'The metric’s weight inside its own category.' },
  { name: 'Score', desc: 'Raw score from −5 (severe stress) to +5 (extremely supportive), from the scoring rules.' },
  { name: 'Trend', desc: 'Recent direction (up / down / flat) derived from the change calculation.' },
  { name: 'Contribution', desc: 'Weighted contribution to the final score = raw score × metric weight × category weight.' },
  { name: 'Source', desc: 'The data provider the value came from (e.g. FRED). “pending” = provider not wired yet.' },
  { name: 'Freshness', desc: 'How current the data is vs the metric’s expected update frequency: fresh, delayed, or stale.' },
  { name: 'Confidence', desc: 'Reliability of the reading (high / medium / low), derived from source quality + freshness.' },
  { name: 'Chart', desc: 'Sparkline of the metric’s recent stored history.' },
]

export function ColumnLegend() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Column reference
      </p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {COLUMNS.map((c) => (
          <div key={c.name} className="flex flex-col">
            <dt className="text-sm font-medium text-slate-200">{c.name}</dt>
            <dd className="text-xs text-slate-500 leading-relaxed">{c.desc}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
