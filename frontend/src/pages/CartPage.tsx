import { Link } from 'react-router-dom'
import { useCartStore } from '@/shared/stores/cartStore'
import { useIngredientes } from '@/features/productos/hooks/useProductos'
import { CartItemCard } from '@/features/store/components/CartItemCard'
import { CartSummary } from '@/features/store/components/CartSummary'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

export function CartPage() {
  const items = useCartStore((s) => s.items)
  const itemCount = useCartStore((s) => s.itemCount)
  const clearCart = useCartStore((s) => s.clearCart)
  const subtotal = useCartStore((s) => s.subtotal)
  const costoEnvio = useCartStore((s) => s.costoEnvio)
  const total = useCartStore((s) => s.total)
  const { data: ingredientes } = useIngredientes()
  const ingredientNameMap = new Map(ingredientes?.map((i) => [i.id, i.nombre]) ?? [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Mi carrito {itemCount() > 0 && `(${itemCount()} productos)`}
        </h1>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Vaciar carrito
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <svg className="h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-500">Tu carrito está vacío</p>
          <p className="mt-1 text-sm text-gray-400">Agregá productos desde nuestro catálogo</p>
          <Link
            to="/productos"
            className="mt-6 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li
                  key={`${item.productoId}-${item.personalizacion.ingredientesExcluidos.slice().sort().join('-')}`}
                >
                  <CartItemCard item={item} ingredientNameMap={ingredientNameMap} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Resumen de compra</h2>
              <div className="mt-4 space-y-3">
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
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(total())}</span>
                  </div>
                </div>
              </div>
              <Link
                to="/checkout"
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
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
