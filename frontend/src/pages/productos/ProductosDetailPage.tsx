import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProducto, useDeleteProducto } from '@/features/productos/hooks/useProductos'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(dateStr))
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-gray-200" />
      <div className="h-4 w-96 rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-6 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="h-24 rounded-lg bg-gray-100" />
    </div>
  )
}

export function ProductosDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles.includes('ADMIN') ?? false

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: producto, isLoading, isError, refetch } = useProducto(productId)
  const { mutate: deleteProducto, isPending: isDeleting } = useDeleteProducto()

  const handleDelete = () => {
    deleteProducto(productId, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Producto eliminado correctamente' })
        navigate('/admin/productos')
      },
      onError: () => {
        addToast({ type: 'error', message: 'Error al eliminar el producto' })
        setShowDeleteModal(false)
      },
    })
  }

  // ── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <DetailSkeleton />
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (isError || !producto) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-red-700">Producto no encontrado</p>
          <p className="mt-1 text-sm text-red-500">El producto que buscás no existe o fue eliminado.</p>
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
              onClick={() => navigate('/admin/productos')}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Volver al listado
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{producto.nombre}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Creado {formatDate(producto.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/productos')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/admin/productos/${producto.id}/editar`)}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Detail cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Info card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Información general
          </h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs text-gray-400">Descripción</dt>
              <dd className="mt-0.5 text-sm text-gray-700">
                {producto.descripcion || <span className="italic text-gray-400">Sin descripción</span>}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-gray-400">Precio base</dt>
                <dd className="mt-0.5 text-lg font-semibold text-gray-900">
                  {formatCurrency(producto.precio_base)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Stock</dt>
                <dd className="mt-0.5 text-lg font-semibold text-gray-900">
                  {producto.stock_cantidad} uds.
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Disponible</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    producto.disponible
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {producto.disponible ? 'Disponible' : 'No disponible'}
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-gray-400">Actualizado</dt>
                <dd className="mt-0.5 text-sm text-gray-600">
                  {formatDate(producto.updated_at)}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Categorías card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Categorías
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {producto.categorias.length > 0 ? (
              producto.categorias.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                >
                  {cat.nombre}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">Sin categorías asignadas</p>
            )}
          </div>
        </div>
      </div>

      {/* Ingredientes section */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Ingredientes
        </h2>
        {producto.ingredientes.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {producto.ingredientes.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
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
                  <span className="text-xs text-gray-400 italic">Removible</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400 italic">Sin ingredientes asignados</p>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
            <p className="mt-2 text-sm text-gray-600">
              ¿Estás seguro de eliminar <strong>{producto.nombre}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
