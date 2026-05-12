import { Link } from 'react-router-dom'
import { useCartStore } from '@/shared/stores/cartStore'
import { useIngredientes } from '@/features/productos/hooks/useProductos'
import { CartItemCard } from './CartItemCard'
import { CartSummary } from './CartSummary'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCartStore((s) => s.items)
  const itemCount = items.reduce((acc, item) => acc + item.cantidad, 0)
  const { data: ingredientes } = useIngredientes()
  const ingredientNameMap = new Map(ingredientes?.map((i) => [i.id, i.nombre]) ?? [])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md transform shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full w-full flex-col bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Carrito {itemCount > 0 && `(${itemCount})`}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar carrito"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <p className="mt-4 text-sm font-medium text-gray-500">Tu carrito está vacío</p>
                <Link
                  to="/productos"
                  onClick={onClose}
                  className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  Ver catálogo
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li
                    key={`${item.productoId}-${item.personalizacion.ingredientesExcluidos.slice().sort().join('-')}`}
                  >
                    <CartItemCard item={item} ingredientNameMap={ingredientNameMap} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-4">
              <CartSummary />
              <Link
                to="/checkout"
                onClick={onClose}
                className="mt-4 flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Ir al checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
