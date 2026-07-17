import { useState, useEffect } from 'react'
import { getAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { formatDateTime } from '../utils/format'
import { exportCSV } from '../utils/export'
import type { InventoryLog } from '../data/types'

export default function Logs() {
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { (async () => { await initSeedData(); const l = await getAll<InventoryLog>('inventoryLogs'); setLogs(l.sort((a,b) => b.createdAt - a.createdAt)); setLoading(false) })() }, [])

  const filtered = filter ? logs.filter(l => l.type === filter) : logs

  if (loading) return <div className="empty-state"><div className="empty-icon">⏳</div><h3>加载中...</h3></div>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">流水明细</h1><p className="page-subtitle">{logs.length} 条记录 · 不可删除 · 不可修改</p></div>
        <button className="btn btn-secondary btn-sm" onClick={() => { exportCSV('流水明细', ['时间','类型','商品','数量','批次','关联单号'], logs.map(l => [formatDateTime(l.createdAt), l.type === 'in' ? '入库' : '出库', l.productName, l.quantity, l.batchNo, l.relatedOrderId.slice(0, 12)])) }}>📥 导出</button>
      </div>
      <div className="filter-bar">
        <button className={'filter-chip' + (filter === '' ? ' active' : '')} onClick={() => setFilter('')}>全部</button>
        <button className={'filter-chip' + (filter === 'in' ? ' active' : '')} onClick={() => setFilter('in')}>📥 入库</button>
        <button className={'filter-chip' + (filter === 'out' ? ' active' : '')} onClick={() => setFilter('out')}>📤 出库</button>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📭</div><h3>暂无流水记录</h3></div>
      ) : (
        <div className="card"><table className="data-table"><thead><tr><th>时间</th><th>类型</th><th>商品</th><th>数量</th><th>批次</th><th>关联单号</th></tr></thead>
          <tbody>{filtered.map(l => (<tr key={l.id}>
            <td style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{formatDateTime(l.createdAt)}</td>
            <td><span className="status-badge" style={{ color: l.type === 'in' ? 'var(--green)' : 'var(--orange)', background: (l.type === 'in' ? '#4dbd90' : '#fa0') + '20', border: '1px solid ' + (l.type === 'in' ? '#4dbd90' : '#fa0') + '40' }}>{l.type === 'in' ? '入库' : '出库'}</span></td>
            <td>{l.productName}</td><td style={{ fontWeight: 600 }}>{l.quantity}</td><td style={{ fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{l.batchNo}</td>
            <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#666' }}>{l.relatedOrderId.slice(0, 12)}...</td>
          </tr>))}</tbody></table></div>
      )}
    </div>
  )
}
