import { useEffect } from 'react'
import { useUiStore } from '@/shared/stores/uiStore'
import type { Toast } from '@/shared/types/ui'

const DEFAULT_DURATION = 5000

/** Visual style per toast type */
const typeStyles: Record<Toast['type'], string> = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
}

/** ARIA role per toast type (error/warning = alert, others = status) */
function ariaRole(type: Toast['type']): 'alert' | 'status' {
  return type === 'error' || type === 'warning' ? 'alert' : 'status'
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const duration = toast.duration ?? DEFAULT_DURATION

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onRemove])

  return (
    <div
      role={ariaRole(toast.type)}
      aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={[
        'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md',
        'pointer-events-auto w-full max-w-sm',
        typeStyles[toast.type],
      ].join(' ')}
    >
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Cerrar notificación"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/**
 * Toaster: renders all active toasts from uiStore.
 * Subscribes by slice — re-renders only when toasts array changes.
 * Auto-dismisses each toast after its duration (default 5000 ms).
 * Does NOT steal focus from the current element.
 */
export function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  const removeToast = useUiStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notificaciones"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}
