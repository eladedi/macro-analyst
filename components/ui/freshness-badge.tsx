const config = {
  fresh: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
  delayed: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  stale: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  manual: { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400' },
}

interface Props {
  freshness: 'fresh' | 'delayed' | 'stale' | 'manual'
}

export function FreshnessBadge({ freshness }: Props) {
  const c = config[freshness] ?? config.manual
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full text-xs px-2 py-0.5 font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {freshness.charAt(0).toUpperCase() + freshness.slice(1)}
    </span>
  )
}
