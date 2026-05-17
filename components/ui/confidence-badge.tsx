const config = {
  high: { text: 'text-slate-300', label: 'High' },
  medium: { text: 'text-slate-400', label: 'Medium' },
  low: { text: 'text-slate-500', label: 'Low' },
}

interface Props {
  confidence: 'high' | 'medium' | 'low'
}

export function ConfidenceBadge({ confidence }: Props) {
  const c = config[confidence] ?? config.low
  return (
    <span className={`text-xs font-medium ${c.text}`}>
      Confidence: {c.label}
    </span>
  )
}
