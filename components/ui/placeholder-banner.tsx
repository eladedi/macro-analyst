export function PlaceholderBanner() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2">
      <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
      <p className="text-xs font-medium text-amber-400">
        Placeholder data — no live data connected yet. Refresh will be functional after Phase 6.
      </p>
    </div>
  )
}
