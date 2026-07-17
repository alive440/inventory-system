export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  let csv = '﻿'
  csv += headers.map(h => '"' + h + '"').join(',') + '\n'
  rows.forEach(row => {
    csv += row.map(cell => '"' + String(cell ?? '') + '"').join(',') + '\n'
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename + '.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function formatDateOnly(ts: number): string {
  const d = new Date(ts)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2)
}
