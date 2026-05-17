import { useCartStore } from '@/shared/stores/cartStore'
import { useConfigPublica } from '@/shared/hooks/useConfig'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

export function CartSummary() {
  const subtotal = useCartStore((s) => s.subtotal)
  const costoEnvio = useCartStore((s) => s.costoEnvio)
  const total = useCartStore((s) => s.total)
  const { data: configPublica } = useConfigPublica()
  const configCosto = configPublica?.costo_envio_base ?? 50

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted">Subtotal</span>
        <span className="font-medium text-ink">{formatCurrency(subtotal())}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted">Costo de envío</span>
        <span className="font-medium text-ink">
          {costoEnvio(configCosto) === 0 ? '—' : formatCurrency(costoEnvio(configCosto))}
        </span>
      </div>
      <div className="border-t border-line-subtle pt-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-ink">Total</span>
          <span className="text-base font-semibold text-brand">{formatCurrency(total(configCosto))}</span>
        </div>
      </div>
    </div>
  )
}
