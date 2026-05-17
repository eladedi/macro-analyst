import { PlaceholderBanner } from '@/components/ui/placeholder-banner'

const ACTIONS = [
  {
    id: 'daily-brief',
    title: 'Generate Daily Brief',
    description: 'Interpret the latest snapshot — current regime, top signals, posture.',
    phase: 8,
  },
  {
    id: 'weekly-review',
    title: 'Generate Weekly Review',
    description: 'Summarize what improved, what deteriorated, and regime direction over the last 7 days.',
    phase: 8,
  },
  {
    id: 'full-regime',
    title: 'Explain Full Regime',
    description: 'Deep explanation of the current score, oscillator, and all category drivers.',
    phase: 8,
  },
  {
    id: 'explain-metric',
    title: 'Explain a Metric',
    description: 'Select any metric to understand what it measures, its score, and what would invalidate the reading.',
    phase: 8,
  },
  {
    id: 'compare-snapshots',
    title: 'Compare Snapshots',
    description: 'Select two snapshots and explain what changed between them.',
    phase: 8,
  },
  {
    id: 'crisis-mode',
    title: 'Crisis Mode Interpretation',
    description: 'Analyze whether the environment is in crisis — volatility shock, credit stress, liquidity deterioration, stabilization signs.',
    phase: 8,
  },
]

export default function AIPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PlaceholderBanner />

      <div>
        <h1 className="text-lg font-semibold text-slate-200">AI Interpretation</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI runs only when you request it — no background processing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIONS.map((action) => (
          <div key={action.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm font-semibold text-slate-200">{action.title}</p>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">{action.description}</p>
            <button
              disabled
              className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500 cursor-not-allowed opacity-60"
              title={`Available after Phase ${action.phase}`}
            >
              Run — Phase {action.phase}
            </button>
          </div>
        ))}
      </div>

      {/* Saved interpretations placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Saved Interpretations</p>
        <div className="flex items-center justify-center h-20 rounded-lg bg-slate-800/30 border border-slate-800 border-dashed">
          <p className="text-sm text-slate-600">Interpretations will appear here after you run them</p>
        </div>
      </div>
    </div>
  )
}
