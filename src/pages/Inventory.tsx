import { useState, useEffect } from 'react'
import { getAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { formatPrice, formatDate } from '../utils/format'
import { exportCSV } from '../utils/export'
import type { Product, InventoryBatch } from '../data/types'

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<InventoryBatch[]>([])
  const [selected, setSelected] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => { await initSeedData(); const [p, b] = await Promise.all([getAll<Product>('products'), getAll<InventoryBatch>('inventoryBatches')]); setProducts(p.filter(p => p.isActive)); setBatches(b); setLoading(false) })()
  }, [])

  if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><h3>加载中...</h3></div>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">库存看板</h1><p className="page-subtitle">{products.length} 个商品 · 实时库存</p></div>
        <button className="btn btn-secondary btn-sm" onClick={() => { exportCSV('库存清单', ['商品','分类','当前库存','安全线','状态'], products.map(p => [p.name, p.category, p.currentStock, p.safetyStock, p.currentStock < p.safetyStock ? '预警' : '正常'])) }}>📥 导出</button>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <table className="data-table"><thead><tr><th>商品</th><th>分类</th><th>当前库存</th><th>安全线</th><th>状态</th><th>批次详情</th></tr></thead>
          <tbody>{products.map(p => {
            const status = p.currentStock <= 0 ? 'danger' : p.currentStock < p.safetyStock ? 'warning' : 'safe'
            const colors: Record<string, string> = { safe: '#4dbd90', warning: '#fa0', danger: '#f66' }
            const labels: Record<string, string> = { safe: '充足', warning: '偏低', danger: '预警' }
            const productBatches = batches.filter(b => b.productId === p.id && b.quantity > 0)
            return (<tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === p.id ? '' : p.id)}>
              <td style={{ fontWeight: 600 }}>{p.name}</td><td style={{ color: '#888' }}>{p.category}</td><td style={{ color: colors[status], fontWeight: 700, fontSize: 16 }}>{p.currentStock}</td>
              <td style={{ color: '#888' }}>{p.safetyStock}</td>
              <td><span className="status-badge" style={{ color: colors[status], background: colors[status] + '20', border: '1px solid ' + colors[status] + '40' }}>{labels[status]}</span></td>
              <td style={{ color: '#888', fontSize: 12 }}>{productBatches.length} 个批次</td>
            </tr>)
          })}</tbody></table>
      </div>
      {selected && (() => {
        const p = products.find(p => p.id === selected)
        const productBatches = batches.filter(b => b.productId === selected && b.quantity > 0)
        return (<div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📦 {p?.name} — 批次明细</h3>
          {productBatches.length === 0 ? <p className="text-muted">无库存批次</p> : (
            <table className="data-table"><thead><tr><th>批次号</th><th>数量</th><th>成本价</th><th>入库日期</th></tr></thead>
              <tbody>{productBatches.sort((a,b) => a.receivedAt - b.receivedAt).map(b => (<tr key={b.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--gold)' }}>{b.batchNo}</td><td style={{ fontWeight: 600 }}>{b.quantity}</td><td>{formatPrice(b.costPrice)}</td>
                <td style={{ color: '#888', fontSize: 12 }}>{formatDate(b.receivedAt)}</td>
              </tr>))}</tbody></table>
          )}
        </div>)
      })()}
    </div>
  )
}
