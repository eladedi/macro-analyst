import { PromptEditor } from '@/components/settings/prompt-editor'
import { ScoringEditor } from '@/components/settings/scoring-editor'
import { OverridesEditor } from '@/components/settings/overrides-editor'

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
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-200">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          The full scoring model is inspectable and editable here. Changes are saved to the
          database and take effect on the next snapshot refresh — no code change, no black box.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <SectionHeader title="Scoring Model" badge="Live" />
        <ScoringEditor />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <SectionHeader title="AI Prompt Templates" badge="Live" />
        <PromptEditor />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <SectionHeader title="Manual Overrides" badge="Live" />
        <OverridesEditor />
      </div>
    </div>
  )
}
