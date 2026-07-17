/**
 * 纯 SVG 折线图 — 零依赖
 */

interface Point { label: string; value: number }

export default function LineChart({ data, title, height = 160, color = '#6495ed' }: { data: Point[]; title: string; height?: number; color?: string }) {
  if (data.length === 0) return <p className="text-muted" style={{ padding: 16 }}>暂无数据</p>

  const max = Math.max(...data.map(d => d.value), 1)
  const w = Math.max(600, data.length * 50)
  const padL = 36; const padR = 10; const padT = 8; const padB = 24
  const chartW = w - padL - padR; const chartH = height - padT - padB

  const points = data.map((d, i) => {
    const x = padL + (i / Math.max(data.length - 1, 1)) * chartW
    const y = padT + chartH - (d.value / max) * chartH
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
  const areaPath = linePath + ' L' + points[points.length-1].x.toFixed(1) + ',' + (padT + chartH) + ' L' + points[0].x.toFixed(1) + ',' + (padT + chartH) + ' Z'

  return (
    <div style={{ overflowX: 'auto' }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12 }}>{title}</h4>
      <svg width={w} height={height} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padT + chartH - chartH * pct
          return (<g key={pct}><line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" /><text x={padL-4} y={y+4} fill="#444" fontSize={10} textAnchor="end">{Math.round(max * (1-pct))}</text></g>)
        })}
        <path d={areaPath} fill={color} opacity={0.08} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} opacity={0.9} />
        {points.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r={3} fill={color}><animate attributeName="r" from="0" to="3" dur="0.3s" fill="freeze" /></circle>))}
        {points.filter((_, i) => i % Math.max(1, Math.floor(data.length/8)) === 0 || i === data.length-1).map((p, i) => (<text key={i} x={p.x} y={height-6} fill="#666" fontSize={10} textAnchor="middle">{p.label}</text>))}
      </svg>
    </div>
  )
}
