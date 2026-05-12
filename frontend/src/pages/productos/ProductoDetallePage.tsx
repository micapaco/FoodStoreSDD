import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProductoPublic } from '@/features/productos/hooks/useProductos'
import { useCartStore } from '@/shared/stores/cartStore'
import { useUiStore } from '@/shared/stores/uiStore'
import { PersonalizarProductoModal } from '@/features/store/components/PersonalizarProductoModal'
import type { Personalizacion } from '@/shared/types/cart'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="aspect-[4/3] rounded-lg bg-gray-200" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          <div className="h-6 w-1/4 rounded bg-gray-200" />
          <div className="h-20 w-full rounded bg-gray-100" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="h-6 w-24 rounded-full bg-gray-200" />
          </div>
          <div className="h-12 w-48 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

export function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()
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
      },
      quantityToAdd,
      personalizacion,
    )
    setSelectedQuantity(1)
    setModalOpen(false)
    addToast({
      type: 'success',
      message: quantityToAdd > 1 ? `${quantityToAdd} productos agregados al carrito.` : 'Producto agregado al carrito.',
      actionLabel: 'Ir a mi carrito',
      actionTo: '/carrito',
      duration: 7000,
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-red-700">Producto no encontrado</p>
          <p className="mt-1 text-sm text-red-500">
            El producto que buscás no está disponible o fue eliminado.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => navigate('/productos')}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
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

      <nav className="mb-6 text-sm text-gray-500">
        <button
          type="button"
          onClick={() => navigate('/productos')}
          className="hover:text-orange-600 transition-colors"
        >
          Catálogo
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <svg className="h-24 w-24 text-orange-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900">{producto.nombre}</h1>

          <p className="mt-3 text-3xl font-bold text-orange-600">
            {formatCurrency(producto.precio_base)}
          </p>

          <div className="mt-4">
            {producto.disponible ? (
              stockRestante > 0 ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Disponible ({stockRestante} en stock)
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                  Sin stock
                </span>
              )
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                No disponible
              </span>
            )}
          </div>

          {producto.descripcion && (
            <p className="mt-6 text-gray-600 leading-relaxed">{producto.descripcion}</p>
          )}

          {producto.categorias.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Categorías
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {producto.categorias.map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600"
                  >
                    {cat.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasAlergenos && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
              <span>⚠️</span>
              <span>Este producto contiene ingredientes que pueden ser alérgenos.</span>
            </div>
          )}

          <div className="mt-8">
            {isAvailable && (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Cantidad</span>
                <div className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white">
                  <button
                    type="button"
                    onClick={handleDecrementQuantity}
                    disabled={selectedQuantity <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-l-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Reducir cantidad"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="flex h-10 min-w-12 items-center justify-center border-x border-gray-300 px-4 text-sm font-semibold text-gray-900">
                    {selectedQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrementQuantity}
                    disabled={selectedQuantity >= stockRestante}
                    className="flex h-10 w-10 items-center justify-center rounded-r-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="w-full rounded-lg bg-orange-500 px-8 py-3 text-base font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:w-auto"
            >
              {selectedQuantity > 1 ? `Agregar ${selectedQuantity} al carrito` : 'Agregar al carrito'}
            </button>
            {!isAvailable && (
              <p className="mt-2 text-xs text-gray-400">
                Producto no disponible en este momento
              </p>
            )}
          </div>
        </div>
      </div>

      {producto.ingredientes.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">Ingredientes</h2>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {producto.ingredientes.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{ing.nombre}</span>
                  {ing.es_alergeno && (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      ⚠ Alérgeno
                    </span>
                  )}
                </div>
                {ing.es_removible && (
                  <span className="text-xs text-gray-400">Removible</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
