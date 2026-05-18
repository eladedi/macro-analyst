interface Props {
  values: number[]
  width?: number
  height?: number
}

// Lightweight inline SVG sparkline — far cheaper than a chart lib per table row.
export function Sparkline({ values, width = 84, height = 24 }: Props) {
  if (values.length < 2) {
    return <span className="text-xs text-slate-600">—</span>
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = width / (values.length - 1)

  const pts = values
    .map((v, i) => {
      const x = i * stepX
      const y = height - ((v - min) / span) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const rising = values[values.length - 1] >= values[0]

  return (
    <svg width={width} height={height} className="block">
      <polyline
        points={pts}
        fill="none"
        stroke={rising ? '#34d399' : '#f87171'}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
