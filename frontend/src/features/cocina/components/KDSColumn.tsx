import type { PedidoCocinaRead } from '@/entities/cocina/types'
import { KDSCard } from './KDSCard'

interface Props {
  title: string
  pedidos: PedidoCocinaRead[]
  action: 'start' | 'done'
  onAction: (pedidoId: number) => Promise<void>
  flash?: boolean
}

export function KDSColumn({ title, pedidos, action, onAction, flash }: Props) {
  return (
    <section
      className={[
        'flex flex-col gap-4 rounded-2xl p-4 transition-colors duration-300',
        flash ? 'bg-brand/5 ring-2 ring-brand/30' : 'bg-surface-base',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        <span className="rounded-full bg-surface-high px-2 py-0.5 text-xs font-semibold text-ink-muted">
          {pedidos.length}
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-subtle py-12 text-center text-sm text-ink-muted">
          <span className="mb-2 text-3xl">✓</span>
          Sin pedidos
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <KDSCard
              key={p.id}
              pedido={p}
              action={action}
              onAction={() => onAction(p.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
