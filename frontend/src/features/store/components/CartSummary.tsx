import { useCartStore } from '@/shared/stores/cartStore'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

export function CartSummary() {
  const subtotal = useCartStore((s) => s.subtotal)
  const costoEnvio = useCartStore((s) => s.costoEnvio)
  const total = useCartStore((s) => s.total)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium text-gray-900">{formatCurrency(subtotal())}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Costo de envío</span>
        <span className="font-medium text-gray-900">
          {costoEnvio() === 0 ? '—' : formatCurrency(costoEnvio())}
        </span>
      </div>
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-base font-semibold text-orange-600">{formatCurrency(total())}</span>
        </div>
      </div>
    </div>
  )
}
