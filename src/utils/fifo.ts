import type { InventoryBatch } from '../data/types'

export interface BatchDeduction {
  batch: InventoryBatch
  deductedQuantity: number
  costPrice: number
}

export function fifoDeduction(
  batches: InventoryBatch[],
  neededQuantity: number
): { deductions: BatchDeduction[]; ok: boolean; error?: string } {
  const sorted = [...batches].sort((a, b) => a.receivedAt - b.receivedAt)
  let remaining = neededQuantity
  const deductions: BatchDeduction[] = []

  for (const batch of sorted) {
    if (remaining <= 0) break
    if (batch.quantity <= 0) continue
    const take = Math.min(batch.quantity, remaining)
    deductions.push({ batch, deductedQuantity: take, costPrice: batch.costPrice })
    remaining -= take
  }

  if (remaining > 0) {
    return { deductions: [], ok: false, error: '库存不足，还差 ' + remaining + ' 件' }
  }

  return { deductions, ok: true }
}

export function calculateWeightedCost(deductions: BatchDeduction[]): number {
  const totalCost = deductions.reduce((sum, d) => sum + d.costPrice * d.deductedQuantity, 0)
  const totalQty = deductions.reduce((sum, d) => sum + d.deductedQuantity, 0)
  return totalQty > 0 ? Math.round(totalCost / totalQty) : 0
}
