import { useState, createContext, useContext, useCallback } from 'react'

interface ToastItem { id: number; message: string; type: 'success' | 'error' | 'info' }

const ToastContext = createContext<{ show: (msg: string, type?: 'success' | 'error' | 'info') => void }>({ show: () => {} })

export function useToast() { return useContext(ToastContext) }

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++nextId
    setToasts(prev => [...prev.slice(-4), { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const colors: Record<string, string> = { success: '#4dbd90', error: '#f66', info: '#6495ed' }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#1a1a1a', border: '1px solid ' + colors[t.type], borderRadius: 10,
            padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 500,
            animation: 'slideIn 0.2s ease', maxWidth: 320,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <span style={{ color: colors[t.type], marginRight: 6 }}>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
