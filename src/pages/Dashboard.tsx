import { useState, useEffect } from 'react'
import { getAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { formatPrice } from '../utils/format'
import { exportCSV } from '../utils/export'
import TrendChart from '../components/TrendChart'
import BackupRestore from '../components/BackupRestore'
import type { Product, SalesOrder, Supplier } from '../data/types'

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    safe: { color: '#4dbd90', label: '充足' },
    warning: { color: '#fa0', label: '偏低' },
    danger: { color: '#f66', label: '预警' },
  }
  const m = map[status] || { color: '#888', label: status }
  return <span className="status-badge" style={{ color: m.color, background: m.color + '20', border: '1px solid ' + m.color + '40' }}>{m.label}</span>
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      await initSeedData()
      const [p, s, sup] = await Promise.all([
        getAll<Product>('products'), getAll<SalesOrder>('salesOrders'), getAll<Supplier>('suppliers')
      ])
      setProducts(p)
      setSalesOrders(s)
      setSuppliers(sup)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><h3>加载中...</h3></div>

  const alertProducts = products.filter(p => p.currentStock < p.safetyStock)
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const monthSales = salesOrders.filter(s => {
    const d = new Date(s.createdAt)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && s.status === 'completed'
  })
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.totalAmount, 0)
  const monthProfit = monthSales.reduce((sum, s) => sum + s.totalProfit, 0)
  const margin = monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0

  const profitMap: Record<string, { name: string; profit: number }> = {}
  monthSales.forEach(s => s.items.forEach(i => {
    if (!profitMap[i.productId]) profitMap[i.productId] = { name: i.productName, profit: 0 }
    profitMap[i.productId].profit += i.profit
  }))
  const top5 = Object.values(profitMap).sort((a, b) => b.profit - a.profit).slice(0, 5)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">驾驶舱</h1>
          <p className="page-subtitle">实时经营数据概览</p>
        </div>
        <BackupRestore />
      </div>
      <div className="stats-grid">
        <StatCard label="库存预警商品" value={String(alertProducts.length)} color="var(--red)" />
        <StatCard label="本月销售额" value={formatPrice(monthRevenue)} color="var(--gold)" />
        <StatCard label="本月毛利" value={formatPrice(monthProfit)} color="var(--green)" />
        <StatCard label="毛利率" value={margin + '%'} color="var(--blue)" />
      </div>
      {(() => {
        const days: Record<string, number> = {}
        for (let i = 13; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = (d.getMonth() + 1) + '/' + d.getDate()
          days[key] = 0
        }
        salesOrders.filter(s => s.status === 'completed').forEach(s => {
          const d = new Date(s.createdAt)
          const key = (d.getMonth() + 1) + '/' + d.getDate()
          if (days[key] !== undefined) days[key] += s.totalAmount / 100
        })
        const chartData = Object.entries(days).map(([label, value]) => ({ label, value }))
        return (
          <div className="card" style={{ marginBottom: 16 }}>
            <TrendChart data={chartData} title="近14天销售趋势（元）" height={140} />
          </div>
        )
      })()}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="dash-section">
          <h3 className="section-title">⚠️ 库存预警</h3>
          {alertProducts.length === 0 ? (
            <p className="text-muted">所有商品库存正常</p>
          ) : (
            alertProducts.map(p => (
              <div key={p.id} className={'alert-item' + (p.currentStock > 0 ? ' warning' : '')}>
                <div>
                  <strong>{p.name}</strong>
                  <span className="text-muted" style={{ marginLeft: 8 }}>当前 {p.currentStock} / 安全线 {p.safetyStock}</span>
                </div>
                <StatusBadge status={p.currentStock === 0 ? 'danger' : 'warning'} />
              </div>
            ))
          )}
        </div>
        <div className="dash-section">
          <h3 className="section-title">🔥 本月毛利排行 Top 5</h3>
          {top5.length === 0 ? (
            <p className="text-muted">本月暂无销售数据</p>
          ) : (
            top5.map((item, idx) => (
              <div key={idx} className="rank-item">
                <span className="rank-num">{idx + 1}</span>
                <span className="rank-name">{item.name}</span>
                <span className="rank-profit">{formatPrice(item.profit)}</span>
              </div>
            ))
          )}
        </div>
      </div>
      {alertProducts.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>🛒 采购建议清单</h3>
            <button className="btn btn-sm btn-primary" onClick={() => {
              exportCSV('采购建议清单',
                ['商品','当前库存','安全线','建议采购量','推荐供应商'],
                alertProducts.map(p => {
                  const supplier = suppliers.find(s => s.supplyProductIds.includes(p.id))
                  return [p.name, p.currentStock, p.safetyStock, p.safetyStock * 2 - p.currentStock, supplier?.name || '未指定']
                }))
            }}>📥 导出采购单</button>
          </div>
          <table className="data-table">
            <thead><tr><th>商品</th><th>当前库存</th><th>安全线</th><th>建议采购</th><th>推荐供应商</th></tr></thead>
            <tbody>
              {alertProducts.map(p => {
                const supplier = suppliers.find(s => s.supplyProductIds.includes(p.id))
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 600 }}>{p.currentStock}</td>
                    <td style={{ color: '#888' }}>{p.safetyStock}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{p.safetyStock * 2 - p.currentStock}</td>
                    <td style={{ color: supplier ? '#ccc' : '#888' }}>{supplier?.name || '未指定供应商'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
