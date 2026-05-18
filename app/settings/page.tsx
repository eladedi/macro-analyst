import { PlaceholderBanner } from '@/components/ui/placeholder-banner'
import { PromptEditor } from '@/components/settings/prompt-editor'

const CATEGORY_WEIGHTS = [
  { name: 'Liquidity', weight: 16 },
  { name: 'Credit', weight: 14 },
  { name: 'Rates', weight: 12 },
  { name: 'Dollar', weight: 10 },
  { name: 'Bonds / Yields', weight: 10 },
  { name: 'Equities', weight: 8 },
  { name: 'Market Breadth', weight: 8 },
  { name: 'Volatility', weight: 8 },
  { name: 'Yield Curve', weight: 8 },
  { name: 'Commodities', weight: 3 },
  { name: 'Crypto', weight: 2 },
  { name: 'Sentiment', weight: 1 },
]

const REGIME_THRESHOLDS = [
  { min: 80, max: 100, label: 'Strong Risk-On', posture: 'Risk-On, monitor overheating' },
  { min: 65, max: 79, label: 'Risk-On', posture: 'Risk-On' },
  { min: 55, max: 64, label: 'Early Risk-On', posture: 'Cautious Risk-On' },
  { min: 45, max: 54, label: 'Neutral / Mixed', posture: 'Neutral' },
  { min: 35, max: 44, label: 'Weakening', posture: 'Defensive / Neutral' },
  { min: 20, max: 34, label: 'Risk-Off', posture: 'Defensive' },
  { min: 0, max: 19, label: 'Panic / Stress', posture: 'Panic Watch' },
]

function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
      {badge && (
        <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded">{badge}</span>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const total = CATEGORY_WEIGHTS.reduce((s, c) => s + c.weight, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PlaceholderBanner />

      <div>
        <h1 className="text-lg font-semibold text-slate-200">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          All weights, scoring rules, thresholds, and prompts are visible and editable here. Editing activates in Phase 10.
        </p>
      </div>

      {/* Category weights */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <SectionHeader title="Category Weights" badge={`Sum: ${total}%`} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORY_WEIGHTS.map((c) => (
            <div key={c.name} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <span className="text-sm text-slate-300">{c.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-semibold text-slate-200">{c.weight}%</span>
                <input
                  type="number"
                  defaultValue={c.weight}
                  disabled
                  className="w-14 rounded bg-slate-700 px-2 py-1 text-xs text-slate-400 tabular-nums cursor-not-allowed opacity-50"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regime thresholds */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <SectionHeader title="Regime Thresholds" badge="Editable in Phase 10" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Score Range', 'Regime Label', 'Investor Posture'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REGIME_THRESHOLDS.map((t) => (
                <tr key={t.label} className="border-b border-slate-800/50">
                  <td className="px-3 py-2 tabular-nums text-slate-400">{t.min}–{t.max}</td>
                  <td className="px-3 py-2 font-medium text-slate-200">{t.label}</td>
                  <td className="px-3 py-2 text-slate-400">{t.posture}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scoring rules */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <SectionHeader title="Scoring Rules" badge="Stored as JSON — editable in Phase 10" />
        <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
          <pre className="text-xs text-slate-500 overflow-x-auto">{JSON.stringify({
            category: 'volatility',
            category_weight: 0.08,
            metrics: [
              { metric_id: 'vix', metric_weight: 0.70, score_range: [-5, 5], enabled: true },
              { metric_id: 'vix_1w_change', metric_weight: 0.30, score_range: [-5, 5], enabled: true },
            ],
          }, null, 2)}</pre>
        </div>
        <p className="text-xs text-slate-600 mt-2">Example — full rule set seeds in Phase 3</p>
      </div>

      {/* Prompt templates */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <SectionHeader title="AI Prompt Templates" badge="Editable" />
        <PromptEditor />
      </div>

      {/* Manual overrides placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <SectionHeader title="Manual Overrides" badge="Phase 10" />
        <div className="flex items-center justify-center h-16 rounded-lg bg-slate-800/30 border border-slate-800 border-dashed">
          <p className="text-sm text-slate-600">Override any metric value, score, or weight — connects in Phase 10</p>
        </div>
      </div>
    </div>
  )
}
