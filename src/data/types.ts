export interface Product { id: string; name: string; category: string; barcode: string; sellingPrice: number; safetyStock: number; currentStock: number; unit: string; isActive: boolean; createdAt: number; updatedAt: number }
export interface Supplier { id: string; name: string; contactPerson: string; phone: string; address: string; supplyProductIds: string[]; notes: string; createdAt: number }
export interface PurchaseItem { productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }
export interface PurchaseOrder { id: string; orderNo: string; supplierId: string; supplierName: string; items: PurchaseItem[]; totalAmount: number; status: 'draft'|'confirmed'|'received'; createdAt: number }
export interface SalesItem { productId: string; productName: string; quantity: number; sellingPrice: number; costPrice: number; profit: number }
export interface SalesOrder { id: string; orderNo: string; customerName: string; items: SalesItem[]; totalAmount: number; totalProfit: number; status: 'completed'|'cancelled'; createdAt: number }
export interface InventoryBatch { id: string; productId: string; productName: string; batchNo: string; quantity: number; costPrice: number; purchaseOrderId: string; receivedAt: number }
export interface InventoryLog { id: string; type: 'in'|'out'; productId: string; productName: string; quantity: number; batchNo: string; relatedOrderId: string; relatedOrderType: 'purchase'|'sales'; createdAt: number }
export function generateId(): string { return Date.now().toString(36)+Math.random().toString(36).slice(2,8) }
export function generateOrderNo(prefix: string): string { const now=new Date(); const y=now.getFullYear().toString(); const m=String(now.getMonth()+1).padStart(2,'0'); const d=String(now.getDate()).padStart(2,'0'); const rand=Math.random().toString(36).slice(2,5).toUpperCase(); return prefix+y+m+d+rand }
