import { PlaceholderBanner } from '@/components/ui/placeholder-banner'
import { ConfidenceBadge } from '@/components/ui/confidence-badge'
import { MetricInfo } from '@/components/ui/metric-info'
import { metrics, categories, dataSources } from '@/config/seed-data'

const catById = new Map(categories.map((c) => [c.id, c]))
const srcById = new Map(dataSources.map((s) => [s.id, s]))

const rows = [...metrics]
  .sort((a, b) => a.display_order - b.display_order)
  .map((m) => {
    const cat = catById.get(m.category_id)!
    const src = srcById.get(m.source_primary_id)!
    return { m, cat, src }
  })

const pct = (n: number) => `${Math.round(n * 100)}%`

export default function MetricsPage() {
  return (
    <div className="p-6 max-w-full space-y-4">
      <PlaceholderBanner />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-200">Metrics</h1>
        <p className="text-xs text-slate-500">
          {metrics.length} metrics across {categories.length} categories — values populate after Phase 4
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80">
              {[
                'Category', 'Metric', 'Value', 'Unit', 'Cat. Wt.', 'Metric Wt.',
                'Automation', 'Frequency', 'Source', 'Confidence', 'Explain',
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, cat, src }) => (
              <tr
                key={m.id}
                className="border-b border-slate-800/60 bg-slate-950 hover:bg-slate-900/50 transition-colors"
              >
                <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">{cat.name}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-medium text-slate-200">{m.name}</span>
                    <MetricInfo
                      metricName={m.name}
                      description={m.description}
                      source={{
                        name: src.name,
                        type: src.type,
                        symbol: m.source_symbol,
                        reliability: src.reliability,
                        baseUrl: src.base_url,
                        enabled: src.enabled,
                      }}
                    />
                  </span>
                </td>
                <td className="px-3 py-3 tabular-nums text-slate-600">—</td>
                <td className="px-3 py-3 text-slate-500">{m.unit}</td>
                <td className="px-3 py-3 tabular-nums text-slate-500">{pct(cat.weight)}</td>
                <td className="px-3 py-3 tabular-nums text-slate-500">{pct(m.metric_weight)}</td>
                <td className="px-3 py-3 text-slate-400 capitalize">{m.automation_status}</td>
                <td className="px-3 py-3 text-slate-400 capitalize">{m.expected_frequency}</td>
                <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs">
                  {src.name.split(' (')[0]}
                  <span className="ml-1 font-mono text-slate-600">{m.source_symbol}</span>
                </td>
                <td className="px-3 py-3">
                  <ConfidenceBadge confidence={m.confidence_default} />
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
