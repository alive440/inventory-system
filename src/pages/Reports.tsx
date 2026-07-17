import { useState, useEffect } from 'react'
import { getAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { formatPrice } from '../utils/format'
import LineChart from '../components/LineChart'
import { TableSkeleton } from '../components/Skeleton'
import type { SalesOrder, Product } from '../data/types'

export default function Reports() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [view, setView] = useState<'product' | 'category'>('product')
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { await initSeedData(); const [s, p] = await Promise.all([getAll<SalesOrder>('salesOrders'), getAll<Product>('products')]); setSalesOrders(s.filter(s => s.status === 'completed')); setProducts(p); setLoading(false) })() }, [])

  if (loading) return <TableSkeleton rows={6} />

  const totalRevenue = salesOrders.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalProfit = salesOrders.reduce((sum, s) => sum + s.totalProfit, 0)
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

  // By product
  const productProfit: Record<string, { name: string; revenue: number; profit: number; category: string }> = {}
  salesOrders.forEach(s => s.items.forEach(i => {
    if (!productProfit[i.productId]) { const p = products.find(p => p.id === i.productId); productProfit[i.productId] = { name: i.productName, revenue: 0, profit: 0, category: p?.category || '' } }
    productProfit[i.productId].revenue += i.sellingPrice * i.quantity; productProfit[i.productId].profit += i.profit
  }))
  const productList = Object.entries(productProfit).sort((a, b) => b[1].profit - a[1].profit)

  // By category
  const categoryProfit: Record<string, { revenue: number; profit: number }> = {}
  Object.values(productProfit).forEach(p => { if (!categoryProfit[p.category]) categoryProfit[p.category] = { revenue: 0, profit: 0 }; categoryProfit[p.category].revenue += p.revenue; categoryProfit[p.category].profit += p.profit })
  const categoryList = Object.entries(categoryProfit).sort((a, b) => b[1].profit - a[1].profit)

  // Monthly trend
  const months: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); months[(d.getFullYear()) + '-' + (d.getMonth()+1)] = 0 }
  salesOrders.forEach(s => { const d = new Date(s.createdAt); const key = d.getFullYear() + '-' + (d.getMonth()+1); if (months[key] !== undefined) months[key] += s.totalProfit / 100 })
  const trendData = Object.entries(months).map(([label, value]) => ({ label: label.replace(/^\d+-/,''), value }))

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">利润报表</h1><p className="page-subtitle">{salesOrders.length} 笔销售 · 毛利率 {margin}%</p></div><button className="btn btn-sm btn-secondary" onClick={() => window.print()}>打印</button></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--gold)' }}>{formatPrice(totalRevenue)}</div><div className="stat-label">总销售额</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--green)' }}>{formatPrice(totalProfit)}</div><div className="stat-label">总毛利</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: 'var(--blue)' }}>{margin}%</div><div className="stat-label">毛利率</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#888' }}>{salesOrders.length}</div><div className="stat-label">订单数</div></div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <LineChart data={trendData} title="近6月毛利趋势（元）" height={160} color="#4dbd90" />
      </div>
      <div className="filter-bar">
        <button className={'filter-chip' + (view === 'product' ? ' active' : '')} onClick={() => setView('product')}>按商品</button>
        <button className={'filter-chip' + (view === 'category' ? ' active' : '')} onClick={() => setView('category')}>按分类</button>
      </div>
      <div className="card">
        {view === 'product' ? (
          <table className="data-table"><thead><tr><th>#</th><th>商品</th><th>分类</th><th>销售额</th><th>毛利</th><th>利润率</th></tr></thead>
            <tbody>{productList.map(([id, data], idx) => (<tr key={id}><td style={{ color: 'var(--gold)', fontWeight: 700 }}>{idx + 1}</td><td>{data.name}</td><td style={{ color: '#888' }}>{data.category}</td><td style={{ color: 'var(--gold)' }}>{formatPrice(data.revenue)}</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>{formatPrice(data.profit)}</td><td style={{ color: data.revenue > 0 ? (data.profit / data.revenue > 0.3 ? 'var(--green)' : 'var(--orange)') : '#888' }}>{data.revenue > 0 ? Math.round(data.profit / data.revenue * 100) + '%' : '-'}</td></tr>))}</tbody></table>
        ) : (
          <table className="data-table"><thead><tr><th>#</th><th>分类</th><th>销售额</th><th>毛利</th><th>利润率</th></tr></thead>
            <tbody>{categoryList.map(([cat, data], idx) => (<tr key={cat}><td style={{ color: 'var(--gold)', fontWeight: 700 }}>{idx + 1}</td><td style={{ fontWeight: 600 }}>{cat}</td><td style={{ color: 'var(--gold)' }}>{formatPrice(data.revenue)}</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>{formatPrice(data.profit)}</td><td style={{ color: data.revenue > 0 ? '#fff' : '#888' }}>{data.revenue > 0 ? Math.round(data.profit / data.revenue * 100) + '%' : '-'}</td></tr>))}</tbody></table>
        )}
      </div>
    </div>
  )
}
