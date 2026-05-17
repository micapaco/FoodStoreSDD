import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/shared/stores/cartStore'
import { useConfigPublica } from '@/shared/hooks/useConfig'
import { useIngredientes } from '@/features/productos/hooks/useProductos'
import { CartItemCard } from '@/features/store/components/CartItemCard'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

export function CartPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const itemCount = items.reduce((acc, item) => acc + item.cantidad, 0)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotal = useCartStore((s) => s.subtotal)
  const costoEnvio = useCartStore((s) => s.costoEnvio)
  const total = useCartStore((s) => s.total)
  const { data: ingredientes } = useIngredientes()
  const { data: configPublica } = useConfigPublica()
  const configCosto = configPublica?.costo_envio_base ?? 50
  const pedidosHabilitados = configPublica?.pedidos_habilitados !== false
  const ingredientNameMap = new Map(ingredientes?.map((i) => [i.id, i.nombre]) ?? [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">
          Mi carrito {itemCount > 0 && `(${itemCount} productos)`}
        </h1>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="rounded-lg border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            Vaciar carrito
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <svg className="h-20 w-20 text-ink-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-ink-muted">Tu carrito está vacío</p>
          <p className="mt-1 text-sm text-ink-muted/70">Agregá productos desde nuestro catálogo</p>
          <Link
            to="/productos"
            className="mt-6 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-brand-on hover:bg-brand-dim transition-colors"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ul className="divide-y divide-line-subtle">
              {items.map((item) => (
                <li
                  key={`${item.productoId}-${(item.personalizacion?.ingredientesExcluidos ?? []).slice().sort().join('-')}`}
                >
                  <CartItemCard item={item} ingredientNameMap={ingredientNameMap} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="rounded-lg border border-line-subtle bg-surface-base p-6 shadow-card-sm">
              <h2 className="text-base font-semibold text-ink">Resumen de compra</h2>
              {!pedidosHabilitados && (
                <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  El local no esta aceptando pedidos en este momento. Podes conservar y editar el carrito.
                </div>
              )}
              <div className="mt-4 space-y-3">
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
                    <span className="text-lg font-bold text-brand">{formatCurrency(total(configCosto))}</span>
                  </div>
                </div>
              </div>
              <Link
                to="/checkout"
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-on hover:bg-brand-dim transition-colors"
              >
                Ir al checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
