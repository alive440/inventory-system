import { useState, useEffect } from 'react'
import { getAll, put, remove } from '../data/db'
import { initSeedData } from '../data/seed'
import { generateId } from '../data/types'
import { CardSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import type { Supplier, Product } from '../data/types'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [edit, setEdit] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => { (async () => { await initSeedData(); const [s, p] = await Promise.all([getAll<Supplier>('suppliers'), getAll<Product>('products')]); setSuppliers(s); setProducts(p); setLoading(false) })() }, [])

  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); const form = e.target as HTMLFormElement; const data: Supplier = { id: edit?.id || generateId(), name: (form.elements.namedItem('name') as HTMLInputElement).value, contactPerson: (form.elements.namedItem('contact') as HTMLInputElement).value, phone: (form.elements.namedItem('phone') as HTMLInputElement).value, address: (form.elements.namedItem('address') as HTMLInputElement).value, supplyProductIds: edit?.supplyProductIds || [], notes: (form.elements.namedItem('notes') as HTMLInputElement).value, createdAt: edit?.createdAt || Date.now() }; await put('suppliers', data); setSuppliers(prev => edit ? prev.map(s => s.id === edit.id ? data : s) : [...prev, data]); setShowModal(false); setEdit(null); toast.show(edit ? '供应商已更新' : '供应商已添加', 'success') }
  const handleDelete = async (id: string) => { if (!confirm('确定删除？')) return; await remove('suppliers', id); setSuppliers(prev => prev.filter(s => s.id !== id)); toast.show('供应商已删除', 'info') }

  if (loading) return <CardSkeleton count={3} />

  return (<div><div className="page-header"><div><h1 className="page-title">供应商管理</h1><p className="page-subtitle">{suppliers.length} 个供应商</p></div><button className="btn btn-primary" onClick={() => { setEdit(null); setShowModal(true) }}>+ 新增供应商</button></div><div className="cards-grid">{suppliers.map(s => (<div key={s.id} className="card"><div className="card-header"><div><div className="card-title">{s.name}</div><div className="card-subtitle">{s.contactPerson} · {s.phone}</div></div><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-sm btn-secondary" onClick={() => { setEdit(s); setShowModal(true) }}>编辑</button><button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>删除</button></div></div><div className="card-row"><span className="card-label">地址</span><span style={{fontSize:12,color:'#888'}}>{s.address}</span></div><div className="card-row"><span className="card-label">供货商品</span><span style={{fontSize:12,color:'var(--gold)'}}>{s.supplyProductIds.map(id => products.find(p => p.id === id)?.name).filter(Boolean).join('、') || '未指定'}</span></div>{s.notes && <div className="card-row"><span className="card-label">备注</span><span style={{fontSize:12,color:'#666'}}>{s.notes}</span></div>}</div>))}</div>{showModal && (<div className="modal-overlay" onClick={() => { setShowModal(false); setEdit(null) }}><div className="modal" onClick={e => e.stopPropagation()}><h2 className="modal-title">{edit ? '编辑供应商' : '新增供应商'}</h2><form onSubmit={handleSave}><div className="form-group"><label className="form-label">名称</label><input className="form-input" name="name" defaultValue={edit?.name || ''} required /></div><div className="form-group"><label className="form-label">联系人</label><input className="form-input" name="contact" defaultValue={edit?.contactPerson || ''} required /></div><div className="form-group"><label className="form-label">电话</label><input className="form-input" name="phone" defaultValue={edit?.phone || ''} required /></div><div className="form-group"><label className="form-label">地址</label><input className="form-input" name="address" defaultValue={edit?.address || ''} /></div><div className="form-group"><label className="form-label">备注</label><input className="form-input" name="notes" defaultValue={edit?.notes || ''} /></div><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEdit(null) }}>取消</button><button type="submit" className="btn btn-primary">保存</button></div></form></div></div>)}</div>)
}
