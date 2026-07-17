import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { formatPrice, formatDate } from '../utils/format'
import type { SalesOrder } from '../data/types'

export default function SalesList() {
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { await initSeedData(); const o = await getAll<SalesOrder>('salesOrders'); setOrders(o.sort((a,b) => b.createdAt - a.createdAt)); setLoading(false) })() }, [])

  if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><h3>加载中...</h3></div>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">销售出库</h1><p className="page-subtitle">{orders.length} 条销售记录</p></div>
        <Link to="/sales/new" className="btn btn-primary">+ 新建销售单</Link>
      </div>
      {orders.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📭</div><h3>暂无销售记录</h3></div>
      ) : (
        <div className="card"><table className="data-table"><thead><tr><th>单号</th><th>商品数</th><th>销售额</th><th>毛利</th><th>日期</th><th>状态</th></tr></thead>
          <tbody>{orders.map(o => (<tr key={o.id}>
            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.orderNo}</td><td style={{ color: '#888' }}>{o.items.length} 种</td>
            <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatPrice(o.totalAmount)}</td><td style={{ color: 'var(--green)', fontWeight: 600 }}>{formatPrice(o.totalProfit)}</td>
            <td style={{ color: '#888', fontSize: 12 }}>{formatDate(o.createdAt)}</td>
            <td><span className="status-badge" style={{ color: '#4dbd90', background: '#4dbd9020', border: '1px solid #4dbd9040' }}>已完成</span></td>
          </tr>))}</tbody></table></div>
      )}
    </div>
  )
}
