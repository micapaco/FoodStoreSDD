import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useProductoPublic } from '@/features/productos/hooks/useProductos'
import { useCartStore } from '@/shared/stores/cartStore'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'
import { PersonalizarProductoModal } from '@/features/store/components/PersonalizarProductoModal'
import type { Personalizacion } from '@/shared/types/cart'
import { resolveImageUrl } from '@/shared/lib/images/resolveImageUrl'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="aspect-[4/3] rounded-lg bg-surface-higher" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-surface-higher" />
          <div className="h-6 w-1/4 rounded bg-surface-higher" />
          <div className="h-20 w-full rounded bg-surface-high" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-surface-higher" />
            <div className="h-6 w-24 rounded-full bg-surface-higher" />
          </div>
          <div className="h-12 w-48 rounded-lg bg-surface-higher" />
        </div>
      </div>
    </div>
  )
}

export function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const cartQuantity = useCartStore((s) =>
    s.items
      .filter((item) => item.productoId === productId)
      .reduce((acc, item) => acc + item.cantidad, 0),
  )
  const addToast = useUiStore((s) => s.addToast)

  const { data: producto, isLoading, isError, refetch } = useProductoPublic(productId)
  const maxAgregable = producto ? Math.min(99, producto.stock_cantidad) : 1
  const stockRestante = producto ? Math.max(0, maxAgregable - cartQuantity) : 0
  const selectedQuantityMax = Math.max(1, stockRestante)

  useEffect(() => {
    setSelectedQuantity((current) => Math.min(Math.max(1, current), selectedQuantityMax))
  }, [selectedQuantityMax])

  const handleAddToCart = (personalizacion: Personalizacion) => {
    if (!isAuthenticated) {
      navigate(`/login?from=${encodeURIComponent(location.pathname)}`)
      return
    }
    if (!producto) return
    if (stockRestante <= 0) {
      addToast({ type: 'warning', message: 'Ya agregaste todo el stock disponible de este producto.' })
      setModalOpen(false)
      return
    }
    const quantityToAdd = Math.min(selectedQuantity, stockRestante)
    addItem(
      {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio_base,
        stockDisponible: producto.stock_cantidad,
        imagen: resolveImageUrl(producto.imagen_url),
      },
      quantityToAdd,
      personalizacion,
    )
    setSelectedQuantity(1)
    setModalOpen(false)
    addToast({
      type: 'success',
      message: quantityToAdd > 1 ? `${quantityToAdd}× ${producto.nombre} agregados` : `${producto.nombre} agregado al carrito`,
      duration: 3000,
    })
  }

  const handleDecrementQuantity = () => {
    setSelectedQuantity((current) => Math.max(1, current - 1))
  }

  const handleIncrementQuantity = () => {
    setSelectedQuantity((current) => Math.min(selectedQuantityMax, current + 1))
  }

  const removibles = producto?.ingredientes.filter((ing) => ing.es_removible) ?? []

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <DetailSkeleton />
      </div>
    )
  }

  if (isError || !producto) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-danger/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-danger">Producto no encontrado</p>
          <p className="mt-1 text-sm text-danger/70">
            El producto que buscás no está disponible o fue eliminado.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => navigate('/productos')}
              className="rounded-lg bg-danger-container px-4 py-2 text-sm font-medium text-danger hover:opacity-90 transition-colors"
            >
              Volver al catálogo
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasAlergenos = producto.ingredientes.some((ing) => ing.es_alergeno)
  const isAvailable = producto.disponible && stockRestante > 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PersonalizarProductoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleAddToCart}
        productoNombre={producto.nombre}
        ingredientesRemovibles={removibles}
        cantidad={selectedQuantity}
      />

      <nav className="mb-6 text-sm text-ink-muted">
        <button
          type="button"
          onClick={() => navigate('/productos')}
          className="hover:text-brand transition-colors"
        >
          Catálogo
        </button>
        <span className="mx-2">/</span>
        <span className="text-ink font-medium">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-high">
          {producto.imagen_url ? (
            <>
              <img
                src={resolveImageUrl(producto.imagen_url)}
                alt={producto.nombre}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement | null
                  if (placeholder) placeholder.style.display = 'flex'
                }}
              />
              <div className="hidden h-full w-full items-center justify-center">
                <svg className="h-24 w-24 text-brand/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="h-24 w-24 text-brand/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-ink">{producto.nombre}</h1>

          <p className="mt-3 text-3xl font-bold text-brand">
            {formatCurrency(producto.precio_base)}
          </p>

          <div className="mt-4">
            {producto.disponible ? (
              stockRestante > 0 ? (
                <span className="inline-flex items-center rounded-full bg-success/20 px-3 py-1 text-xs font-semibold text-success">
                  Disponible ({stockRestante} en stock)
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning">
                  Sin stock
                </span>
              )
            ) : (
              <span className="inline-flex items-center rounded-full bg-danger/20 px-3 py-1 text-xs font-semibold text-danger">
                No disponible
              </span>
            )}
          </div>

          {producto.descripcion && (
            <p className="mt-6 text-ink-muted leading-relaxed">{producto.descripcion}</p>
          )}

          {producto.categorias.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                Categorías
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {producto.categorias.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand"
                  >
                    {cat.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasAlergenos && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning/10 px-4 py-2 text-sm text-warning">
              <span>⚠️</span>
              <span>Este producto contiene ingredientes que pueden ser alérgenos.</span>
            </div>
          )}

          <div className="mt-8">
            {isAvailable && (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-ink-muted">Cantidad</span>
                <div className="inline-flex h-10 items-center rounded-lg border border-line-subtle bg-surface-low">
                  <button
                    type="button"
                    onClick={handleDecrementQuantity}
                    disabled={selectedQuantity <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-l-lg text-ink-muted hover:bg-surface-high disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Reducir cantidad"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="flex h-10 min-w-12 items-center justify-center border-x border-line-subtle px-4 text-sm font-semibold text-ink">
                    {selectedQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrementQuantity}
                    disabled={selectedQuantity >= stockRestante}
                    className="flex h-10 w-10 items-center justify-center rounded-r-lg text-ink-muted hover:bg-surface-high disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Aumentar cantidad"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => {
                if (removibles.length > 0) {
                  setModalOpen(true)
                } else {
                  handleAddToCart({ ingredientesExcluidos: [] })
                }
              }}
              className="w-full rounded-lg bg-brand px-8 py-3 text-base font-semibold text-brand-on hover:bg-brand-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:w-auto"
            >
              {selectedQuantity > 1 ? `Agregar ${selectedQuantity} al carrito` : 'Agregar al carrito'}
            </button>
            {!isAvailable && (
              <p className="mt-2 text-xs text-ink-muted">
                Producto no disponible en este momento
              </p>
            )}
          </div>
        </div>
      </div>

      {producto.ingredientes.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-ink">Ingredientes</h2>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {producto.ingredientes.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-base px-4 py-3 shadow-card-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink">{ing.nombre}</span>
                  {ing.es_alergeno && (
                    <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                      ⚠ Alérgeno
                    </span>
                  )}
                </div>
                {ing.es_removible && (
                  <span className="text-xs text-ink-muted">Removible</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
