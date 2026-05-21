import { useEffect, useState } from 'react'
import type { PedidoCocinaRead } from '@/entities/cocina/types'

interface Props {
  pedido: PedidoCocinaRead
  action: 'start' | 'done'
  onAction: () => Promise<void>
}

function calcMinutes(timestamp: string | null | undefined): number {
  if (!timestamp) return 0
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000)
}

function timerClass(minutes: number): string {
  if (minutes >= 20) return 'text-danger font-bold'
  if (minutes >= 10) return 'text-warning font-semibold'
  return 'text-ink-muted'
}

export function KDSCard({ pedido, action, onAction }: Props) {
  const [minutes, setMinutes] = useState(() => calcMinutes(pedido.timestampEntradaCocina))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutes(calcMinutes(pedido.timestampEntradaCocina))
    }, 15_000)
    return () => clearInterval(interval)
  }, [pedido.timestampEntradaCocina])

  async function handleAction() {
    setLoading(true)
    try {
      await onAction()
    } finally {
      setLoading(false)
    }
  }

  const exclusiones = pedido.items.flatMap((item) =>
    (item.personalizacion ?? []).map((id) => `#${id}`),
  )

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line-subtle bg-surface-high p-4 shadow-card-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-muted">Pedido</span>
        <span className="text-lg font-extrabold text-ink">#{pedido.id}</span>
      </div>

      {/* Ítems */}
      <ul className="space-y-1">
        {pedido.items.map((item, i) => (
          <li key={i} className="flex items-baseline justify-between gap-2 text-sm text-ink">
            <span className="truncate">{item.nombreSnapshot}</span>
            <span className="shrink-0 font-semibold text-brand">×{item.cantidad}</span>
          </li>
        ))}
      </ul>

      {/* Exclusiones */}
      {exclusiones.length > 0 && (
        <div className="rounded-md bg-warning/10 px-2 py-1 text-xs text-warning">
          Sin: {exclusiones.join(', ')}
        </div>
      )}

      {/* Notas */}
      {pedido.notas && (
        <p className="rounded-md bg-surface-higher px-2 py-1 text-xs text-ink-muted italic">
          "{pedido.notas}"
        </p>
      )}

      {/* Timer */}
      <div className={['text-xs tabular-nums', timerClass(minutes)].join(' ')}>
        {minutes} min en cocina
        {minutes >= 20 && ' ⚠️'}
        {minutes >= 10 && minutes < 20 && ' ⏳'}
      </div>

      {/* Acción */}
      <button
        type="button"
        onClick={handleAction}
        disabled={loading}
        className={[
          'mt-1 w-full rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-50',
          action === 'start'
            ? 'bg-brand text-white hover:bg-brand/90'
            : 'bg-success text-white hover:bg-success/90',
        ].join(' ')}
      >
        {loading ? 'Procesando…' : action === 'start' ? 'Iniciar preparación' : 'Listo'}
      </button>
    </article>
  )
}
