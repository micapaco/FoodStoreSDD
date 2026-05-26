import type { CartItem } from '@/shared/types/cart'
import { resolveImageUrl } from '@/shared/lib/images/resolveImageUrl'
import { useCartStore } from '@/shared/stores/cartStore'

interface CartItemCardProps {
  item: CartItem
  ingredientNameMap?: Map<number, string>
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

export function CartItemCard({ item, ingredientNameMap }: CartItemCardProps) {
  const removeItem = useCartStore((s) => s.removeItem)
  const updateCantidad = useCartStore((s) => s.updateCantidad)
  const stockDisponible = Math.min(99, item.producto.stockDisponible ?? 99)
  const otherProductQuantity = useCartStore((s) =>
    s.items
      .filter((cartItem) => cartItem.productoId === item.productoId && cartItem !== item)
      .reduce((acc, cartItem) => acc + cartItem.cantidad, 0),
  )
  const maxCantidad = Math.max(1, stockDisponible - otherProductQuantity)

  const excludedIds = item.personalizacion?.ingredientesExcluidos ?? []

  const handleDecrement = () => {
    if (item.cantidad <= 1) {
      removeItem(item.productoId, item.personalizacion)
    } else {
      updateCantidad(item.productoId, item.personalizacion, item.cantidad - 1)
    }
  }

  const handleIncrement = () => {
    if (item.cantidad >= maxCantidad) return
    updateCantidad(item.productoId, item.personalizacion, item.cantidad + 1)
  }

  const handleRemove = () => {
    removeItem(item.productoId, item.personalizacion)
  }

  return (
    <div className="flex gap-3 py-4">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-high">
        {item.producto.imagen ? (
          <img src={resolveImageUrl(item.producto.imagen)} alt={item.producto.nombre} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-8 w-8 text-ink-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="text-sm font-medium text-ink">{item.producto.nombre}</h3>
          <p className="mt-0.5 text-sm text-ink-muted">{formatCurrency(item.producto.precio)}</p>
        </div>

        {excludedIds.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {excludedIds.map((id) => {
              const name = ingredientNameMap?.get(id)
              return (
                <span
                  key={id}
                  className="inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger"
                >
                  Sin {name ?? `#${id}`}
                </span>
              )
            })}
          </div>
        )}

        {item.personalizacion?.notas && (
          <p className="mt-1 text-xs text-ink-muted italic">
            "{item.personalizacion.notas}"
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line-subtle text-ink-muted hover:bg-surface-high transition-colors"
            aria-label="Disminuir cantidad"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="min-w-[1.5rem] text-center text-sm font-medium text-ink">
            {item.cantidad}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={item.cantidad >= maxCantidad}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line-subtle text-ink-muted hover:bg-surface-high disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Aumentar cantidad"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {item.cantidad >= maxCantidad && (
            <span className="text-xs text-ink-muted/50">Stock máximo</span>
          )}
          <span className="ml-auto text-sm font-medium text-ink">
            {formatCurrency(item.producto.precio * item.cantidad)}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-2 rounded-md p-1 text-ink-muted/50 hover:text-danger hover:bg-danger/10 transition-colors"
            aria-label="Eliminar producto"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
