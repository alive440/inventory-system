export function formatPrice(fen: number): string {
  return '¥' + (fen / 100).toFixed(fen % 100 === 0 ? 0 : 2)
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function nowTs() { return Date.now() }
