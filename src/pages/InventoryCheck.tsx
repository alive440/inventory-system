import { useState, useEffect } from 'react'
import { getAll, putAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { generateId, generateOrderNo } from '../data/types'
import type { Product, InventoryBatch, InventoryLog } from '../data/types'

export default function InventoryCheck() {
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<InventoryBatch[]>([])
  const [actuals, setActuals] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => { await initSeedData(); const [p, b] = await Promise.all([getAll<Product>('products'), getAll<InventoryBatch>('inventoryBatches')]); setProducts(p.filter(p => p.isActive)); setBatches(b); setActuals(Object.fromEntries(p.map(p => [p.id, p.currentStock]))); setLoading(false) })()
  }, [])

  const differences = products.filter(p => { const actual = actuals[p.id] ?? p.currentStock; return actual !== p.currentStock })

  const handleSubmit = async () => {
    if (!confirm('确认提交盘点结果？系统将自动生成盘盈盘亏调整单。')) return
    const logs: InventoryLog[] = []
    const updatedBatches = batches.map(b => ({ ...b }))
    for (const p of products) {
      const actual = actuals[p.id] ?? p.currentStock
      const diff = actual - p.currentStock
      if (diff === 0) continue
      if (diff > 0) { updatedBatches.push({ id: generateId(), productId: p.id, productName: p.name, batchNo: 'CHECK+' + generateOrderNo('ADJ'), quantity: diff, costPrice: 0, purchaseOrderId: 'inventory_check', receivedAt: Date.now() }) }
      logs.push({ id: generateId(), type: diff > 0 ? 'in' : 'out', productId: p.id, productName: p.name, quantity: Math.abs(diff), batchNo: diff > 0 ? '盘盈调整' : '盘亏调整', relatedOrderId: 'INVCHECK' + generateOrderNo('CK'), relatedOrderType: 'purchase', createdAt: Date.now() })
      p.currentStock = actual; p.updatedAt = Date.now()
      if (diff < 0) { let remaining = Math.abs(diff); for (const b of updatedBatches) { if (remaining <= 0) break; if (b.productId !== p.id || b.quantity <= 0) continue; const take = Math.min(b.quantity, remaining); b.quantity -= take; remaining -= take } }
    }
    await putAll('inventoryBatches', updatedBatches.filter(b => b.quantity > 0))
    await putAll('products', products)
    await putAll('inventoryLogs', logs)
    setSubmitted(true)
  }

  if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><h3>加载中...</h3></div>

  if (submitted) return (<div><div className="page-header"><div><h1 className="page-title">盘点完成</h1><p className="page-subtitle">共调整 {differences.length} 个商品</p></div></div><div className="empty-state"><div className="empty-icon">✅</div><h3>盘点结果已保存</h3><p>库存数据已更新，流水明细中可查看调整记录</p></div></div>)

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">库存盘点</h1><p className="page-subtitle">对比系统库存与实际库存，处理盘盈盘亏</p></div>
        <button className="btn btn-primary" onClick={handleSubmit}>确认盘点</button>
      </div>
      {differences.length > 0 && (<div className="alert-item warning" style={{ marginBottom: 16 }}><span>{differences.length} 个商品存在差异（盘盈 {differences.filter(p => (actuals[p.id] ?? p.currentStock) > p.currentStock).length} 个，盘亏 {differences.filter(p => (actuals[p.id] ?? p.currentStock) < p.currentStock).length} 个）</span></div>)}
      <div className="card"><table className="data-table"><thead><tr><th>商品</th><th>系统库存</th><th>实际库存</th><th>差异</th><th>类型</th></tr></thead>
        <tbody>{products.map(p => {
          const actual = actuals[p.id] ?? p.currentStock
          const diff = actual - p.currentStock
          return (<tr key={p.id} style={{ background: diff !== 0 ? 'rgba(255,170,0,0.03)' : 'transparent' }}>
            <td style={{ fontWeight: 600 }}>{p.name}</td><td style={{ color: '#888' }}>{p.currentStock}</td>
            <td><input className="form-input" type="number" min={0} value={actual} style={{ width: 80, padding: '4px 8px', fontSize: 14, textAlign: 'center' }} onChange={e => setActuals(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 0 }))} /></td>
            <td style={{ color: diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : '#888', fontWeight: diff !== 0 ? 700 : 400 }}>{diff > 0 ? '+' + diff : diff < 0 ? String(diff) : '-'}</td>
            <td>{diff > 0 ? <span className="status-badge" style={{ color: '#4dbd90', background: '#4dbd9020', border: '1px solid #4dbd9040' }}>盘盈</span> : diff < 0 ? <span className="status-badge" style={{ color: '#f66', background: '#f6620', border: '1px solid #f6640' }}>盘亏</span> : <span style={{ color: '#888', fontSize: 12 }}>正常</span>}</td>
          </tr>)
        })}</tbody></table></div>
    </div>
  )
}
