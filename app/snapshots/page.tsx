import { PlaceholderBanner } from '@/components/ui/placeholder-banner'
import { RegimeLabel } from '@/components/ui/regime-label'
import type { RegimeLabel as RegimeLabelType } from '@/lib/store'

const PLACEHOLDER_SNAPSHOTS: Array<{
  id: string
  date: string
  score: number
  oscillator: number
  regime: RegimeLabelType
  trend: string
  confidence: string
}> = [
  { id: 'snap_001', date: '2026-05-17 09:00', score: 63, oscillator: 26, regime: 'Early Risk-On', trend: 'Improving', confidence: 'Medium' },
  { id: 'snap_002', date: '2026-05-16 09:00', score: 58, oscillator: 16, regime: 'Neutral / Mixed', trend: 'Stable', confidence: 'Medium' },
  { id: 'snap_003', date: '2026-05-15 09:00', score: 55, oscillator: 10, regime: 'Neutral / Mixed', trend: 'Improving', confidence: 'Low' },
]

export default function SnapshotsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PlaceholderBanner />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-200">Snapshots</h1>
        <p className="text-xs text-slate-500">Snapshots persist from Phase 6 onward</p>
      </div>

      {/* Snapshot list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">History</p>
          <span className="text-xs text-slate-600">{PLACEHOLDER_SNAPSHOTS.length} entries (placeholder)</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              {['Date / Time', 'Score', 'Oscillator', 'Regime', 'Trend', 'Confidence', 'View'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_SNAPSHOTS.map((snap) => {
              const oscStr = snap.oscillator > 0 ? `+${snap.oscillator}` : String(snap.oscillator)
              return (
                <tr key={snap.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{snap.date}</td>
                  <td className="px-4 py-3 font-bold tabular-nums text-white">{snap.score}</td>
                  <td className="px-4 py-3 font-bold tabular-nums text-emerald-400">{oscStr}</td>
                  <td className="px-4 py-3">
                    <RegimeLabel label={snap.regime} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{snap.trend}</td>
                  <td className="px-4 py-3 text-slate-400">{snap.confidence}</td>
                  <td className="px-4 py-3">
                    <button
                      disabled
                      className="text-xs text-slate-600 cursor-not-allowed"
                      title="Detail view — Phase 6"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Compare snapshots */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Compare Snapshots</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {['Snapshot A', 'Snapshot B'].map((label) => (
            <div key={label}>
              <label className="text-xs text-slate-500 block mb-1">{label}</label>
              <select
                disabled
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-400 cursor-not-allowed opacity-50"
              >
                <option>Select snapshot…</option>
              </select>
            </div>
          ))}
        </div>
        <button
          disabled
          className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed opacity-50"
        >
          Compare — Phase 6
        </button>
      </div>

      {/* Weekly summary placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Weekly Summary</p>
        <div className="flex items-center justify-center h-16 rounded-lg bg-slate-800/30 border border-slate-800 border-dashed">
          <p className="text-sm text-slate-600">Weekly change summary — Phase 6</p>
        </div>
      </div>
    </div>
  )
}
