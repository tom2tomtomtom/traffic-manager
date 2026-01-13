'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { X, AlertTriangle, Check, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string, action?: Toast['action']) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...toast, id }])

    // Auto-remove after duration (default 5s, longer for warnings)
    const duration = toast.duration || (toast.type === 'warning' ? 8000 : 5000)
    setTimeout(() => removeToast(id), duration)

    return id
  }, [removeToast])

  const toast = {
    success: (message: string) => addToast({ message, type: 'success' }),
    error: (message: string) => addToast({ message, type: 'error', duration: 8000 }),
    warning: (message: string, action?: Toast['action']) =>
      addToast({ message, type: 'warning', action, duration: 10000 }),
    info: (message: string) => addToast({ message, type: 'info' }),
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <Check className="w-4 h-4" />,
    error: <X className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
  }

  const styles = {
    success: 'border-green-500 bg-green-500/10',
    error: 'border-red-hot bg-red-hot/10',
    warning: 'border-yellow-electric bg-yellow-electric/10',
    info: 'border-orange-accent bg-orange-accent/10',
  }

  const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-hot',
    warning: 'text-yellow-electric',
    info: 'text-orange-accent',
  }

  return (
    <div
      className={cn(
        'bg-black-card border-2 p-4 shadow-lg animate-in slide-in-from-right-full duration-300',
        styles[toast.type]
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5', iconStyles[toast.type])}>
          {icons[toast.type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white-full text-sm">{toast.message}</p>
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick()
                onClose()
              }}
              className="mt-2 text-xs font-bold uppercase text-orange-accent hover:underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white-dim hover:text-white-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
