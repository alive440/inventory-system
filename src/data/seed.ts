import { getAll, putAll, clearStore } from './db'
import { generateId, generateOrderNo } from './types'
import type { Product, Supplier, PurchaseOrder, SalesOrder, InventoryBatch, InventoryLog } from './types'

const SEED_VERSION = 2 // Bump this to force re-seed after schema/data changes

export async function initSeedData() {
  const existing = await getAll<Product>('products')
  // Check version — re-seed if data is from old version
  const versionFlag = localStorage.getItem('seed_version')
  if (existing.length > 0 && versionFlag === String(SEED_VERSION)) return

  // Clear old data if version mismatch
  if (existing.length > 0) {
    const stores = ['products','suppliers','purchaseOrders','salesOrders','inventoryBatches','inventoryLogs']
    for (const store of stores) { await clearStore(store) }
  }

  const now = Date.now()
  const day = 86400000

  const products: Product[] = [
    { id: generateId(), name: '专业洗发水（去屑型）', category: '洗发护发', barcode: '6901234560001', sellingPrice: 6800, safetyStock: 10, currentStock: 15, unit: '瓶', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '专业洗发水（滋养型）', category: '洗发护发', barcode: '6901234560002', sellingPrice: 7800, safetyStock: 10, currentStock: 3, unit: '瓶', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '护发素（修护型）', category: '洗发护发', barcode: '6901234560003', sellingPrice: 5800, safetyStock: 8, currentStock: 2, unit: '瓶', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '染发膏（黑色）', category: '染发产品', barcode: '6901234560004', sellingPrice: 12800, safetyStock: 5, currentStock: 8, unit: '盒', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '染发膏（棕色）', category: '染发产品', barcode: '6901234560005', sellingPrice: 12800, safetyStock: 5, currentStock: 6, unit: '盒', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '烫发水（冷烫）', category: '烫发产品', barcode: '6901234560006', sellingPrice: 9800, safetyStock: 5, currentStock: 12, unit: '瓶', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '定型喷雾', category: '造型产品', barcode: '6901234560007', sellingPrice: 4800, safetyStock: 10, currentStock: 1, unit: '瓶', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '发蜡（哑光）', category: '造型产品', barcode: '6901234560008', sellingPrice: 3800, safetyStock: 10, currentStock: 20, unit: '盒', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '发胶（强力定型）', category: '造型产品', barcode: '6901234560009', sellingPrice: 3500, safetyStock: 8, currentStock: 15, unit: '瓶', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '精油护发素', category: '洗发护发', barcode: '6901234560010', sellingPrice: 19800, safetyStock: 3, currentStock: 4, unit: '瓶', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '洗发水（控油型）', category: '洗发护发', barcode: '6901234560011', sellingPrice: 6800, safetyStock: 10, currentStock: 7, unit: '瓶', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '一次性毛巾', category: '耗材', barcode: '6901234560012', sellingPrice: 100, safetyStock: 50, currentStock: 120, unit: '条', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '染发碗+刷套装', category: '工具', barcode: '6901234560013', sellingPrice: 2500, safetyStock: 5, currentStock: 4, unit: '套', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '烫发杠（中号）', category: '工具', barcode: '6901234560014', sellingPrice: 1500, safetyStock: 5, currentStock: 9, unit: '包', isActive: true, createdAt: now - 30*day, updatedAt: now },
    { id: generateId(), name: '头皮清洁液', category: '洗发护发', barcode: '6901234560015', sellingPrice: 8800, safetyStock: 4, currentStock: 2, unit: '瓶', isActive: true, createdAt: now - 30*day, updatedAt: now },
  ]
  await putAll('products', products)

  const suppliers: Supplier[] = [
    { id: generateId(), name: '广州美发用品批发', contactPerson: '张经理', phone: '13800001111', address: '广州市白云区美发市场A区18号', supplyProductIds: products.slice(0,6).map(p => p.id), notes: '主要供货商', createdAt: now - 60*day },
    { id: generateId(), name: '深圳日化总代理', contactPerson: '李小姐', phone: '13800002222', address: '深圳市龙华区日化城3楼', supplyProductIds: products.slice(6,12).map(p => p.id), notes: '配送快，当天到货', createdAt: now - 60*day },
    { id: generateId(), name: '佛山工具耗材厂', contactPerson: '王总', phone: '13800003333', address: '佛山市南海区工业园', supplyProductIds: products.slice(12).map(p => p.id), notes: '工具专供', createdAt: now - 60*day },
  ]
  await putAll('suppliers', suppliers)

  const batches: InventoryBatch[] = []
  const logs: InventoryLog[] = []

  // Create initial batches for all products so stock data is consistent
  for (const product of products) {
    if (product.currentStock > 0) {
      batches.push({
        id: generateId(), productId: product.id, productName: product.name,
        batchNo: 'INIT-' + product.id.slice(0,6).toUpperCase(),
        quantity: product.currentStock, costPrice: Math.round(product.sellingPrice * 0.5),
        purchaseOrderId: 'initial_stock', receivedAt: now - 30*day,
      })
    }
  }

  const po1: PurchaseOrder = { id: generateId(), orderNo: generateOrderNo('PO'), supplierId: suppliers[0].id, supplierName: suppliers[0].name, items: [
    { productId: products[0].id, productName: products[0].name, quantity: 20, unitPrice: 4500, subtotal: 90000 },
    { productId: products[1].id, productName: products[1].name, quantity: 15, unitPrice: 5000, subtotal: 75000 },
    { productId: products[2].id, productName: products[2].name, quantity: 10, unitPrice: 3800, subtotal: 38000 },
    { productId: products[4].id, productName: products[4].name, quantity: 10, unitPrice: 8500, subtotal: 85000 },
  ], totalAmount: 288000, status: 'received', createdAt: now - 20*day }
  await putAll('purchaseOrders', [po1])

  po1.items.forEach(item => {
    const batch: InventoryBatch = { id: generateId(), productId: item.productId, productName: item.productName, batchNo: 'B' + po1.orderNo + '-' + item.productId.slice(0,4), quantity: item.quantity, costPrice: item.unitPrice, purchaseOrderId: po1.id, receivedAt: now - 20*day }
    batches.push(batch)
    logs.push({ id: generateId(), type: 'in', productId: item.productId, productName: item.productName, quantity: item.quantity, batchNo: batch.batchNo, relatedOrderId: po1.id, relatedOrderType: 'purchase', createdAt: now - 20*day })
  })

  const po2: PurchaseOrder = { id: generateId(), orderNo: generateOrderNo('PO'), supplierId: suppliers[1].id, supplierName: suppliers[1].name, items: [
    { productId: products[6].id, productName: products[6].name, quantity: 12, unitPrice: 3000, subtotal: 36000 },
    { productId: products[7].id, productName: products[7].name, quantity: 30, unitPrice: 2200, subtotal: 66000 },
  ], totalAmount: 102000, status: 'received', createdAt: now - 10*day }
  await putAll('purchaseOrders', [po2])

  po2.items.forEach(item => {
    const batch: InventoryBatch = { id: generateId(), productId: item.productId, productName: item.productName, batchNo: 'B' + po2.orderNo + '-' + item.productId.slice(0,4), quantity: item.quantity, costPrice: item.unitPrice, purchaseOrderId: po2.id, receivedAt: now - 10*day }
    batches.push(batch)
    logs.push({ id: generateId(), type: 'in', productId: item.productId, productName: item.productName, quantity: item.quantity, batchNo: batch.batchNo, relatedOrderId: po2.id, relatedOrderType: 'purchase', createdAt: now - 10*day })
  })

  await putAll('inventoryBatches', batches)

  const so1: SalesOrder = { id: generateId(), orderNo: generateOrderNo('SO'), items: [
    { productId: products[0].id, productName: products[0].name, quantity: 5, sellingPrice: 6800, costPrice: 4500, profit: 11500 },
    { productId: products[1].id, productName: products[1].name, quantity: 10, sellingPrice: 7800, costPrice: 5000, profit: 28000 },
    { productId: products[7].id, productName: products[7].name, quantity: 10, sellingPrice: 3800, costPrice: 2200, profit: 16000 },
  ], totalAmount: 150000, totalProfit: 55500, status: 'completed', createdAt: now - 7*day }
  await putAll('salesOrders', [so1])

  so1.items.forEach(item => {
    const batch = batches.find(b => b.productId === item.productId && b.quantity >= item.quantity)
    if (batch) { batch.quantity -= item.quantity }
    logs.push({ id: generateId(), type: 'out', productId: item.productId, productName: item.productName, quantity: item.quantity, batchNo: batch?.batchNo || '-', relatedOrderId: so1.id, relatedOrderType: 'sales', createdAt: now - 7*day })
  })
  await putAll('inventoryBatches', batches)

  const so2: SalesOrder = { id: generateId(), orderNo: generateOrderNo('SO'), items: [
    { productId: products[4].id, productName: products[4].name, quantity: 2, sellingPrice: 12800, costPrice: 8500, profit: 8600 },
    { productId: products[6].id, productName: products[6].name, quantity: 5, sellingPrice: 4800, costPrice: 3000, profit: 9000 },
  ], totalAmount: 49600, totalProfit: 17600, status: 'completed', createdAt: now - 3*day }
  await putAll('salesOrders', [so2])

  so2.items.forEach(item => {
    const batch = batches.find(b => b.productId === item.productId && b.quantity >= item.quantity)
    if (batch) { batch.quantity -= item.quantity }
    logs.push({ id: generateId(), type: 'out', productId: item.productId, productName: item.productName, quantity: item.quantity, batchNo: batch?.batchNo || '-', relatedOrderId: so2.id, relatedOrderType: 'sales', createdAt: now - 3*day })
  })
  await putAll('inventoryBatches', batches)
  await putAll('inventoryLogs', logs)

  // Reconcile currentStock from actual batch quantities
  for (const product of products) {
    const productBatches = batches.filter(b => b.productId === product.id)
    product.currentStock = productBatches.reduce((sum, b) => sum + b.quantity, 0)
  }
  await putAll('products', products)

  localStorage.setItem('seed_version', String(SEED_VERSION))
}
