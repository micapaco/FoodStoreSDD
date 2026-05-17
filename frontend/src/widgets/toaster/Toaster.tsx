import { useEffect } from 'react'
import { useUiStore } from '@/shared/stores/uiStore'
import type { Toast } from '@/shared/types/ui'

const DEFAULT_DURATION = 4000

const typeConfig: Record<Toast['type'], { bar: string; icon: string; iconPath: string }> = {
  success: {
    bar: 'bg-success',
    icon: 'text-success',
    iconPath: 'M5 13l4 4L19 7',
  },
  error: {
    bar: 'bg-danger',
    icon: 'text-danger',
    iconPath: 'M6 18L18 6M6 6l12 12',
  },
  warning: {
    bar: 'bg-warning',
    icon: 'text-warning',
    iconPath: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  },
  info: {
    bar: 'bg-brand',
    icon: 'text-brand',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
}

function ariaRole(type: Toast['type']): 'alert' | 'status' {
  return type === 'error' || type === 'warning' ? 'alert' : 'status'
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const duration = toast.duration ?? DEFAULT_DURATION
  const cfg = typeConfig[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onRemove])

  return (
    <div
      role={ariaRole(toast.type)}
      aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="pointer-events-auto flex w-full max-w-xs items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-surface-base/95 backdrop-blur-sm shadow-dropdown px-4 py-3"
    >
      {/* Colored left bar */}
      <div className={`h-8 w-0.5 shrink-0 rounded-full ${cfg.bar}`} />

      {/* Icon */}
      <svg className={`h-4 w-4 shrink-0 ${cfg.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={cfg.iconPath} />
      </svg>

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-ink">{toast.message}</p>

      {/* Close */}
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded p-0.5 text-ink-muted/50 hover:text-ink-muted transition-colors"
        aria-label="Cerrar"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

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
