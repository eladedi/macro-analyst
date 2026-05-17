import type { RegimeLabel as RegimeLabelType } from '@/lib/store'

const config: Record<string, { bg: string; text: string; ring: string }> = {
  'Strong Risk-On': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  'Risk-On': { bg: 'bg-green-500/15', text: 'text-green-400', ring: 'ring-green-500/30' },
  'Early Risk-On': { bg: 'bg-lime-500/15', text: 'text-lime-400', ring: 'ring-lime-500/30' },
  'Neutral / Mixed': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', ring: 'ring-yellow-500/30' },
  Weakening: { bg: 'bg-orange-500/15', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  'Risk-Off': { bg: 'bg-red-500/15', text: 'text-red-400', ring: 'ring-red-500/30' },
  'Panic / Stress': { bg: 'bg-red-700/20', text: 'text-red-400', ring: 'ring-red-700/40' },
}

const fallback = { bg: 'bg-slate-500/15', text: 'text-slate-400', ring: 'ring-slate-500/30' }

interface Props {
  label: RegimeLabelType | string
  size?: 'sm' | 'md' | 'lg'
}

export function RegimeLabel({ label, size = 'md' }: Props) {
  const c = config[label] ?? fallback
  const sizeClass = size === 'lg' ? 'text-base px-4 py-1.5' : size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ring-1 ${c.bg} ${c.text} ${c.ring} ${sizeClass}`}>
      {label}
    </span>
  )
}
