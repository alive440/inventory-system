import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { formatPrice, formatDate } from '../utils/format'
import type { PurchaseOrder } from '../data/types'

export default function PurchaseList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { await initSeedData(); const o = await getAll<PurchaseOrder>('purchaseOrders'); setOrders(o.sort((a,b) => b.createdAt - a.createdAt)); setLoading(false) })() }, [])

  const filtered = filter ? orders.filter(o => o.status === filter) : orders

  if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><h3>加载中...</h3></div>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">采购入库</h1><p className="page-subtitle">{orders.length} 条采购记录</p></div>
        <Link to="/purchase/new" className="btn btn-primary">+ 新建采购单</Link>
      </div>
      <div className="filter-bar">
        <button className={'filter-chip' + (filter === '' ? ' active' : '')} onClick={() => setFilter('')}>全部</button>
        <button className={'filter-chip' + (filter === 'received' ? ' active' : '')} onClick={() => setFilter('received')}>已入库</button>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📭</div><h3>暂无采购记录</h3></div>
      ) : (
        <div className="card"><table className="data-table"><thead><tr><th>单号</th><th>供应商</th><th>商品数</th><th>金额</th><th>日期</th><th>状态</th></tr></thead>
          <tbody>{filtered.map(o => (<tr key={o.id}>
            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.orderNo}</td><td>{o.supplierName}</td><td style={{ color: '#888' }}>{o.items.length} 种</td>
            <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatPrice(o.totalAmount)}</td><td style={{ color: '#888', fontSize: 12 }}>{formatDate(o.createdAt)}</td>
            <td><span className="status-badge" style={{ color: '#4dbd90', background: '#4dbd9020', border: '1px solid #4dbd9040' }}>已入库</span></td>
          </tr>))}</tbody></table></div>
      )}
    </div>
  )
}
