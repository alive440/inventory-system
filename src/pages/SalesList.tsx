import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAll, putAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { generateId } from '../data/types'
import { formatPrice, formatDate } from '../utils/format'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeleton'
import type { SalesOrder, InventoryBatch, InventoryLog, Product } from '../data/types'

export default function SalesList() {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => { (async () => { await initSeedData(); const o = await getAll<SalesOrder>('salesOrders'); setOrders(o.sort((a,b) => b.createdAt - a.createdAt)); setLoading(false) })() }, [])

  const handleUndo = async (order: SalesOrder) => {
    if (!confirm('撤销销售单 ' + order.orderNo + '？\n库存将自动恢复，操作不可逆。')) return
    const batches = await getAll<InventoryBatch>('inventoryBatches')
    const products = await getAll<Product>('products')
    const logs: InventoryLog[] = []
    const updatedBatches = batches.map(b => ({ ...b }))
    const updatedProducts = products.map(p => ({ ...p }))
    for (const item of order.items) {
      const productBatches = updatedBatches.filter(b => b.productId === item.productId)
      let remaining = item.quantity
      for (const b of productBatches) { if (remaining <= 0) break; const addBack = Math.min(remaining, item.quantity); b.quantity += addBack; remaining -= addBack }
      if (remaining > 0 || productBatches.length === 0) { updatedBatches.push({ id: generateId(), productId: item.productId, productName: item.productName, batchNo: 'REV-' + order.orderNo, quantity: item.quantity, costPrice: item.costPrice, purchaseOrderId: 'reversal', receivedAt: Date.now() }) }
      const prod = updatedProducts.find(p => p.id === item.productId)
      if (prod) prod.currentStock += item.quantity
      logs.push({ id: generateId(), type: 'in', productId: item.productId, productName: item.productName, quantity: item.quantity, batchNo: '撤销-' + order.orderNo, relatedOrderId: order.id, relatedOrderType: 'sales', createdAt: Date.now() })
    }
    order.status = 'cancelled'
    await putAll('inventoryBatches', updatedBatches.filter(b => b.quantity > 0))
    await putAll('products', updatedProducts)
    await putAll('inventoryLogs', logs)
    await putAll('salesOrders', [order])
    setOrders(prev => prev.map(o => o.id === order.id ? { ...order } : o))
    toast.show('销售单已撤销，库存已恢复', 'success')
  }

  if (loading) return <TableSkeleton rows={5} />

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">销售出库</h1><p className="page-subtitle">{orders.length} 条销售记录</p></div><Link to="/sales/new" className="btn btn-primary">+ 新建销售单</Link></div>
      {orders.length === 0 ? (<div className="empty-state"><div className="empty-icon">📭</div><h3>暂无销售记录</h3></div>) : (
        <div className="card"><table className="data-table"><thead><tr><th>单号</th><th>客户</th><th>商品数</th><th>销售额</th><th>毛利</th><th>日期</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>{orders.map(o => (<tr key={o.id}>
            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.orderNo}</td><td style={{ fontWeight: 500 }}>{o.customerName || '散客'}</td><td style={{ color: '#888' }}>{o.items.length} 种</td>
            <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatPrice(o.totalAmount)}</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>{formatPrice(o.totalProfit)}</td>
            <td style={{ color: '#888', fontSize: 12 }}>{formatDate(o.createdAt)}</td>
            <td><span className="status-badge" style={{ color: o.status === 'cancelled' ? '#f66' : '#4dbd90', background: (o.status === 'cancelled' ? '#f66' : '#4dbd90') + '20', border: '1px solid ' + (o.status === 'cancelled' ? '#f66' : '#4dbd90') + '40' }}>{o.status === 'cancelled' ? '已撤销' : '已完成'}</span></td>
            <td>{o.status === 'completed' && <button className="btn btn-sm btn-danger" onClick={() => handleUndo(o)}>撤销</button>}</td>
          </tr>))}</tbody></table></div>
      )}
    </div>
  )
}
