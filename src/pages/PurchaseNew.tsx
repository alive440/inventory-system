import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, putAll } from '../data/db'
import { initSeedData } from '../data/seed'
import { generateId, generateOrderNo } from '../data/types'
import { formatPrice } from '../utils/format'
import ScanInput from '../components/ScanInput'
import { FormSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import type { Product, Supplier, PurchaseOrder, InventoryBatch, InventoryLog, PurchaseItem } from '../data/types'

export default function PurchaseNew() {
  const navigate = useNavigate(); const toast = useToast()
  const [products, setProducts] = useState<Product[]>([]); const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState(''); const [items, setItems] = useState<(PurchaseItem & { key: string })[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => { await initSeedData(); const [p, s] = await Promise.all([getAll<Product>('products'), getAll<Supplier>('suppliers')]); setProducts(p); setSuppliers(s); setLoading(false) })() }, [])

  const addItem = () => setItems(prev => [...prev, { key: generateId(), productId: '', productName: '', quantity: 1, unitPrice: 0, subtotal: 0 }])
  const updateItem = (key: string, field: string, value: string | number) => { setItems(prev => prev.map(item => { if (item.key !== key) return item; const u = { ...item, [field]: value }; if (field === 'productId') { const p = products.find(p => p.id === value); u.productName = p?.name || ''; u.unitPrice = 0 } u.subtotal = u.quantity * u.unitPrice; return u })) }
  const removeItem = (key: string) => setItems(prev => prev.filter(i => i.key !== key))
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0)

  const handleSubmit = async () => {
    if (!supplierId || items.length === 0) return
    const supplier = suppliers.find(s => s.id === supplierId); if (!supplier) return
    const order: PurchaseOrder = { id: generateId(), orderNo: generateOrderNo('PO'), supplierId: supplier.id, supplierName: supplier.name, items: items.map(({ key, ...i }) => i), totalAmount, status: 'received', createdAt: Date.now() }
    const batches: InventoryBatch[] = []; const logs: InventoryLog[] = []; const updatedProducts = products.map(p => ({ ...p }))
    for (const item of order.items) { const batch: InventoryBatch = { id: generateId(), productId: item.productId, productName: item.productName, batchNo: 'B' + order.orderNo + '-' + item.productId.slice(0,4), quantity: item.quantity, costPrice: item.unitPrice, purchaseOrderId: order.id, receivedAt: Date.now() }; batches.push(batch); logs.push({ id: generateId(), type: 'in', productId: item.productId, productName: item.productName, quantity: item.quantity, batchNo: batch.batchNo, relatedOrderId: order.id, relatedOrderType: 'purchase', createdAt: Date.now() }); const prod = updatedProducts.find(p => p.id === item.productId); if (prod) { prod.currentStock += item.quantity; prod.updatedAt = Date.now() } }
    await putAll('purchaseOrders', [order]); await putAll('inventoryBatches', batches); await putAll('inventoryLogs', logs); await putAll('products', updatedProducts)
    toast.show('采购入库成功，已生成批次', 'success')
    navigate('/purchase')
  }

  if (loading) return <FormSkeleton />
  const supplierProducts = supplierId ? products.filter(p => suppliers.find(s => s.id === supplierId)?.supplyProductIds.includes(p.id)) : products

  return (<div><div className="page-header"><div><h1 className="page-title">新建采购单</h1><p className="page-subtitle">选择供应商和商品，确认后自动入库并生成批次</p></div><div style={{ display: 'flex', gap: 8 }}><button className="btn btn-secondary" onClick={() => navigate('/purchase')}>取消</button><button className="btn btn-primary" onClick={handleSubmit} disabled={!supplierId || items.length === 0}>确认入库</button></div></div><div className="card" style={{ marginBottom: 16 }}><div className="form-group"><label className="form-label">供应商</label><select className="form-select" value={supplierId} onChange={e => { setSupplierId(e.target.value); setItems([]) }}><option value="">请选择供应商</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name} — {s.contactPerson} {s.phone}</option>)}</select></div></div>{supplierId && (<div className="card"><ScanInput placeholder="扫描条码快速添加商品..." onScan={(barcode) => { const prod = products.find(p => p.barcode === barcode); if (prod) { setItems(prev => { const exists = prev.find(i => i.productId === prod.id); if (exists) return prev.map(i => i.key === exists.key ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } : i); return [...prev, { key: generateId(), productId: prod.id, productName: prod.name, quantity: 1, unitPrice: 0, subtotal: 0 }] }); toast.show('已扫码: ' + prod.name, 'info') } else { toast.show('未找到条码: ' + barcode, 'error') } }} /><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h3 style={{ fontSize: 14, fontWeight: 600 }}>商品明细</h3><button className="btn btn-sm btn-secondary" onClick={addItem}>+ 添加商品</button></div>{items.length > 0 && <div className="form-row-header"><span>商品</span><span>数量</span><span>进价（元）</span><span></span></div>}{items.map(item => (<div key={item.key} className="form-row"><select className="form-select" value={item.productId} onChange={e => updateItem(item.key, 'productId', e.target.value)}><option value="">选择商品</option>{supplierProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input className="form-input" type="number" min={1} value={item.quantity} onChange={e => updateItem(item.key, 'quantity', parseInt(e.target.value) || 0)} /><input className="form-input" type="number" min={0} step={0.01} value={item.unitPrice / 100} onChange={e => updateItem(item.key, 'unitPrice', Math.round(parseFloat(e.target.value || '0') * 100))} /><button className="btn btn-sm btn-danger" onClick={() => removeItem(item.key)}>✕</button></div>))}{items.length > 0 && <div className="total-summary"><div className="total-item"><div className="label">采购总额</div><div className="value">{formatPrice(totalAmount)}</div></div></div>}</div>)}</div>)
}
