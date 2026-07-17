import { useState, useEffect } from 'react'
import { getAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { formatPrice } from '../utils/format'
import { exportCSV } from '../utils/export'
import TrendChart from '../components/TrendChart'
import BackupRestore from '../components/BackupRestore'
import { DashboardSkeleton } from '../components/Skeleton'
import type { Product, SalesOrder, Supplier } from '../data/types'

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (<div className="stat-card"><div className="stat-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div><div className="stat-label">{label}</div></div>)
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = { safe: { color: '#4dbd90', label: '充足' }, warning: { color: '#fa0', label: '偏低' }, danger: { color: '#f66', label: '预警' } }
  const m = map[status] || { color: '#888', label: status }
  return <span className="status-badge" style={{ color: m.color, background: m.color + '20', border: '1px solid ' + m.color + '40' }}>{m.label}</span>
}

// SVG Donut Chart
function DonutChart({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  const size = 140; const cx = size/2; const cy = size/2; const r = 55; const stroke = 18
  let offset = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {data.map(d => {
          const pct = total > 0 ? d.value / total : 0
          const dash = pct * Math.PI * 2 * r
          const gap = Math.PI * 2 * r - dash
          const o = offset; offset += dash
          return <circle key={d.name} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-o}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.6s ease' }} />
        })}
        <text x={cx} y={cy-8} textAnchor="middle" fill="#fff" fontSize={18} fontWeight={800}>{total > 0 ? Math.round(total) : 0}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fill="#888" fontSize={10}>总毛利</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
        {data.slice(0,5).map(d => (<div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} /><span style={{ color: '#ccc' }}>{d.name}</span><span style={{ color: '#888', marginLeft: 'auto' }}>{total>0?Math.round(d.value/total*100):0}%</span></div>))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { await initSeedData(); const [p, s, sup] = await Promise.all([getAll<Product>('products'), getAll<SalesOrder>('salesOrders'), getAll<Supplier>('suppliers')]); setProducts(p); setSalesOrders(s); setSuppliers(sup); setLoading(false) })() }, [])

  if (loading) return <DashboardSkeleton />

  const alertProducts = products.filter(p => p.currentStock < p.safetyStock)
  const now = new Date(); const thisMonth = now.getMonth(); const thisYear = now.getFullYear()
  const monthSales = salesOrders.filter(s => { const d = new Date(s.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear && s.status === 'completed' })
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.totalAmount, 0)
  const monthProfit = monthSales.reduce((sum, s) => sum + s.totalProfit, 0)
  const margin = monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0

  // Category profit breakdown
  const catProfit: Record<string, { name: string; profit: number }> = {}
  monthSales.forEach(s => s.items.forEach(i => { const p = products.find(p => p.id === i.productId); const cat = p?.category || '其他'; if (!catProfit[cat]) catProfit[cat] = { name: cat, profit: 0 }; catProfit[cat].profit += i.profit }))
  const catColors = ['#d4a574','#4dbd90','#6495ed','#fa0','#f66','#a78bfa']
  const catData = Object.values(catProfit).sort((a,b) => b.profit - a.profit).map((c,i) => ({ ...c, color: catColors[i % catColors.length] }))

  const profitMap: Record<string, { name: string; profit: number }> = {}
  monthSales.forEach(s => s.items.forEach(i => { if (!profitMap[i.productId]) profitMap[i.productId] = { name: i.productName, profit: 0 }; profitMap[i.productId].profit += i.profit }))
  const top5 = Object.values(profitMap).sort((a, b) => b.profit - a.profit).slice(0, 5)

  // Sales trend
  const days: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days[(d.getMonth()+1)+'/'+d.getDate()] = 0 }
  salesOrders.filter(s => s.status === 'completed').forEach(s => { const d = new Date(s.createdAt); const key = (d.getMonth()+1)+'/'+d.getDate(); if (days[key] !== undefined) days[key] += s.totalAmount/100 })
  const chartData = Object.entries(days).map(([label, value]) => ({ label, value }))

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">驾驶舱</h1><p className="page-subtitle">实时经营数据概览</p></div><BackupRestore /></div>
      <div className="stats-grid">
        <StatCard label="库存预警商品" value={String(alertProducts.length)} color="var(--red)" />
        <StatCard label="本月销售额" value={formatPrice(monthRevenue)} color="var(--gold)" />
        <StatCard label="本月毛利" value={formatPrice(monthProfit)} color="var(--green)" />
        <StatCard label="毛利率" value={margin + '%'} color="var(--blue)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card"><TrendChart data={chartData} title="近14天销售趋势（元）" height={140} /></div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12 }}>品类毛利分布</h4>
          <DonutChart data={catData} total={catData.reduce((s,c)=>s+c.profit/100,0)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="dash-section"><h3 className="section-title">库存预警</h3>
          {alertProducts.length === 0 ? <p className="text-muted">所有商品库存正常</p> : alertProducts.map(p => (<div key={p.id} className={'alert-item' + (p.currentStock > 0 ? ' warning' : '')}><div><strong>{p.name}</strong><span className="text-muted" style={{ marginLeft: 8 }}>当前 {p.currentStock} / 安全线 {p.safetyStock}</span></div><StatusBadge status={p.currentStock === 0 ? 'danger' : 'warning'} /></div>))}
        </div>
        <div className="dash-section"><h3 className="section-title">本月毛利排行 Top 5</h3>
          {top5.length === 0 ? <p className="text-muted">本月暂无销售数据</p> : top5.map((item, idx) => (<div key={idx} className="rank-item"><span className="rank-num">{idx + 1}</span><span className="rank-name">{item.name}</span><span className="rank-profit">{formatPrice(item.profit)}</span></div>))}
        </div>
      </div>
      {alertProducts.length > 0 && (<div className="card" style={{ marginTop: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h3 className="section-title" style={{ marginBottom: 0 }}>采购建议清单</h3><button className="btn btn-sm btn-primary" onClick={() => { exportCSV('采购建议清单', ['商品','当前库存','安全线','建议采购量','推荐供应商'], alertProducts.map(p => { const supplier = suppliers.find(s => s.supplyProductIds.includes(p.id)); return [p.name, p.currentStock, p.safetyStock, p.safetyStock * 2 - p.currentStock, supplier?.name || '未指定'] })) }}>导出采购单</button></div><table className="data-table"><thead><tr><th>商品</th><th>当前库存</th><th>安全线</th><th>建议采购</th><th>推荐供应商</th></tr></thead><tbody>{alertProducts.map(p => { const supplier = suppliers.find(s => s.supplyProductIds.includes(p.id)); return (<tr key={p.id}><td style={{ fontWeight: 600 }}>{p.name}</td><td style={{ color: 'var(--red)', fontWeight: 600 }}>{p.currentStock}</td><td style={{ color: '#888' }}>{p.safetyStock}</td><td style={{ color: 'var(--gold)', fontWeight: 700 }}>{p.safetyStock * 2 - p.currentStock}</td><td style={{ color: supplier ? '#ccc' : '#888' }}>{supplier?.name || '未指定供应商'}</td></tr>) })}
          </tbody></table></div>)}
    </div>
  )
}
