import { useState, useEffect } from 'react'
import { getAll, put, remove } from '../data/db'
import { initSeedData } from '../data/seed'
import { generateId } from '../data/types'
import { formatPrice } from '../utils/format'
import { exportCSV, fenToYuan } from '../utils/export'
import { TableSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import type { Product } from '../data/types'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [edit, setEdit] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => { (async () => { await initSeedData(); setProducts(await getAll<Product>('products')); setLoading(false) })() }, [])

  const filtered = products.filter(p => {
    if (search && !p.name.includes(search) && !p.barcode.includes(search)) return false
    if (category && p.category !== category) return false
    return true
  })
  const categories = [...new Set(products.map(p => p.category))]

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data: Product = { id: edit?.id || generateId(), name: (form.elements.namedItem('name') as HTMLInputElement).value, category: (form.elements.namedItem('category') as HTMLInputElement).value, barcode: (form.elements.namedItem('barcode') as HTMLInputElement).value, sellingPrice: Math.round(parseFloat((form.elements.namedItem('price') as HTMLInputElement).value || '0') * 100), safetyStock: parseInt((form.elements.namedItem('safety') as HTMLInputElement).value || '10'), currentStock: edit?.currentStock || 0, unit: (form.elements.namedItem('unit') as HTMLInputElement).value, isActive: true, createdAt: edit?.createdAt || Date.now(), updatedAt: Date.now() }
    await put('products', data)
    setProducts(prev => edit ? prev.map(p => p.id === edit.id ? data : p) : [...prev, data])
    setShowModal(false); setEdit(null)
    toast.show(edit ? '商品已更新' : '商品已添加', 'success')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return
    await remove('products', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.show('商品已删除', 'info')
  }

  if (loading) return <TableSkeleton rows={10} />

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">商品管理</h1><p className="page-subtitle">{products.length} 个商品</p></div><div style={{ display: 'flex', gap: 8 }}><button className="btn btn-secondary btn-sm" onClick={() => { exportCSV('商品列表', ['名称','分类','条码','售价','库存','安全线','状态'], products.map(p => [p.name, p.category, p.barcode, fenToYuan(p.sellingPrice), p.currentStock, p.safetyStock, p.currentStock < p.safetyStock ? '预警' : '正常'])) }}>导出</button><button className="btn btn-primary" onClick={() => { setEdit(null); setShowModal(true) }}>+ 新增商品</button></div></div>
      <div className="action-bar"><div className="search-bar" style={{ flex: 1, marginBottom: 0 }}><span className="search-icon">🔍</span><input className="search-input" placeholder="搜索商品名称或条码..." value={search} onChange={e => setSearch(e.target.value)} /></div><div className="filter-bar" style={{ marginBottom: 0 }}><button className={'filter-chip' + (category === '' ? ' active' : '')} onClick={() => setCategory('')}>全部</button>{categories.map(c => <button key={c} className={'filter-chip' + (category === c ? ' active' : '')} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
      <div className="card"><table className="data-table"><thead><tr><th>商品名称</th><th>分类</th><th>条码</th><th>售价</th><th>库存</th><th>安全线</th><th>状态</th><th>操作</th></tr></thead><tbody>{filtered.map(p => { const ss = p.currentStock <= 0 ? 'danger' : p.currentStock < p.safetyStock ? 'warning' : 'safe'; const cs: Record<string, string> = { safe: '#4dbd90', warning: '#fa0', danger: '#f66' }; return (<tr key={p.id}><td style={{ fontWeight: 600 }}>{p.name}</td><td style={{ color: '#888' }}>{p.category}</td><td style={{ color: '#888', fontFamily: 'monospace', fontSize: 11 }}>{p.barcode}</td><td style={{ color: 'var(--gold)', fontWeight: 600 }}>{formatPrice(p.sellingPrice)}</td><td style={{ color: cs[ss], fontWeight: 600 }}>{p.currentStock}</td><td style={{ color: '#888' }}>{p.safetyStock}</td><td><span className="status-badge" style={{ color: cs[ss], background: cs[ss] + '20', border: '1px solid ' + cs[ss] + '40' }}>{ss === 'safe' ? '充足' : ss === 'warning' ? '偏低' : '预警'}</span></td><td><button className="btn btn-sm btn-secondary" style={{ marginRight: 4 }} onClick={() => { setEdit(p); setShowModal(true) }}>编辑</button><button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>删除</button></td></tr>)})}</tbody></table></div>
      {showModal && (<div className="modal-overlay" onClick={() => { setShowModal(false); setEdit(null) }}><div className="modal" onClick={e => e.stopPropagation()}><h2 className="modal-title">{edit ? '编辑商品' : '新增商品'}</h2><form onSubmit={handleSave}><div className="form-group"><label className="form-label">商品名称</label><input className="form-input" name="name" defaultValue={edit?.name || ''} required /></div><div className="form-group"><label className="form-label">分类</label><input className="form-input" name="category" defaultValue={edit?.category || ''} required /></div><div className="form-group"><label className="form-label">条码</label><input className="form-input" name="barcode" defaultValue={edit?.barcode || ''} /></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}><div className="form-group"><label className="form-label">售价（元）</label><input className="form-input" name="price" type="number" step="0.01" min="0" defaultValue={edit ? edit.sellingPrice / 100 : ''} required /></div><div className="form-group"><label className="form-label">安全库存</label><input className="form-input" name="safety" type="number" min="1" defaultValue={edit?.safetyStock || 10} required /></div><div className="form-group"><label className="form-label">单位</label><input className="form-input" name="unit" defaultValue={edit?.unit || '个'} required /></div></div><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}><button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEdit(null) }}>取消</button><button type="submit" className="btn btn-primary">保存</button></div></form></div></div>)}
    </div>
  )
}
