interface BarData { label: string; value: number; color?: string }

export default function TrendChart({ data, title, height = 160 }: { data: BarData[]; title: string; height?: number }) {
  if (data.length === 0) return <p className="text-muted" style={{ padding: 16 }}>暂无数据</p>

  const max = Math.max(...data.map(d => d.value), 1)
  const barWidth = Math.max(20, Math.min(40, (600 - data.length * 12) / data.length))
  const chartWidth = data.length * (barWidth + 12) + 40

  return (
    <div style={{ overflowX: 'auto' }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12 }}>{title}</h4>
      <svg width={Math.max(chartWidth, 300)} height={height + 40} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = height - (height * pct)
          return (
            <g key={pct}>
              <line x1={30} y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <text x={24} y={y + 4} fill="#444" fontSize={10} textAnchor="end">
                {Math.round(max * (1 - pct))}
              </text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const barH = Math.max(2, (d.value / max) * height)
          const x = 40 + i * (barWidth + 12)
          const y = height - barH
          const color = d.color || '#d4a574'
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill={color} opacity={0.85}>
                <animate attributeName="height" from="0" to={barH} dur="0.5s" fill="freeze" />
              </rect>
              <text x={x + barWidth / 2} y={height + 16} fill="#666" fontSize={10} textAnchor="middle">{d.label}</text>
              <text x={x + barWidth / 2} y={y - 6} fill="#aaa" fontSize={10} textAnchor="middle">{d.value}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
