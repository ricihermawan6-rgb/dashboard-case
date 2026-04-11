'use client'
import { useEffect, useState, createContext, useContext, useCallback } from 'react'

interface ToastMsg { id: number; msg: string; type: 'success' | 'error' | 'info' }

const ToastCtx = createContext<{ show: (msg: string, type?: ToastMsg['type']) => void } | null>(null)

let _show: ((msg: string, type?: ToastMsg['type']) => void) | null = null

export function toast(msg: string, type: ToastMsg['type'] = 'success') {
  _show?.(msg, type)
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const show = useCallback((msg: string, type: ToastMsg['type'] = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  useEffect(() => { _show = show; return () => { _show = null } }, [show])

  if (!toasts.length) return null

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} className="toast-in"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 10,
            background: 'var(--surface2)', border: `1px solid ${t.type === 'success' ? 'rgba(78,207,138,.3)' : t.type === 'error' ? 'rgba(241,101,78,.3)' : 'var(--border)'}`,
            color: t.type === 'success' ? 'var(--success)' : t.type === 'error' ? 'var(--danger)' : 'var(--text)',
            fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,.3)',
            minWidth: 220, maxWidth: 360,
          }}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

export default Toast
