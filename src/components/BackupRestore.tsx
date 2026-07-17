import { getAll, putAll, clearStore } from '../data/db'

const STORES = ['products', 'suppliers', 'purchaseOrders', 'salesOrders', 'inventoryBatches', 'inventoryLogs']

export default function BackupRestore() {
  const handleBackup = async () => {
    const data: Record<string, unknown[]> = {}
    for (const store of STORES) {
      data[store] = await getAll(store)
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-' + new Date().toISOString().slice(0, 10) + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRestore = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (!confirm('导入将覆盖所有现有数据，确定继续？')) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        for (const store of STORES) {
          await clearStore(store)
          if (data[store]?.length) await putAll(store, data[store])
        }
        alert('数据恢复成功！页面将刷新。')
        window.location.reload()
      } catch (err: unknown) {
        alert('文件格式错误：' + (err as Error).message)
      }
    }
    input.click()
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn btn-sm btn-secondary" onClick={handleBackup}>📤 备份数据</button>
      <button className="btn btn-sm btn-secondary" onClick={handleRestore}>📥 恢复数据</button>
    </div>
  )
}
