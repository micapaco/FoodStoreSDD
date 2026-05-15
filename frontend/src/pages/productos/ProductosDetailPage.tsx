import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProducto, useDeleteProducto } from '@/features/productos/hooks/useProductos'
import { getSafeUserRoles, useAuthStore } from '@/shared/stores/authStore'
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
      <div className="h-8 w-64 rounded bg-surface-higher" />
      <div className="h-4 w-96 rounded bg-surface-higher" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 rounded bg-surface-higher" />
            <div className="h-6 w-32 rounded bg-surface-higher" />
          </div>
        ))}
      </div>
      <div className="h-24 rounded-lg bg-surface-high" />
    </div>
  )
}

export function ProductosDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const isAdmin = getSafeUserRoles(user).includes('ADMIN')

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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <DetailSkeleton />
      </div>
    )
  }

  if (isError || !producto) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-danger/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-danger">Producto no encontrado</p>
          <p className="mt-1 text-sm text-danger/70">El producto que buscás no existe o fue eliminado.</p>
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
              onClick={() => navigate('/admin/productos')}
              className="rounded-lg bg-danger-container px-4 py-2 text-sm font-medium text-danger hover:opacity-90 transition-colors"
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
          <h1 className="text-2xl font-bold text-ink">{producto.nombre}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Creado {formatDate(producto.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/productos')}
            className="rounded-lg border border-line-subtle px-3 py-2 text-sm font-medium text-ink hover:bg-surface-high transition-colors"
          >
            Volver
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/admin/productos/${producto.id}/editar`)}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-dim transition-colors"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Imagen */}
      <div className="mt-6 rounded-lg border border-line-subtle bg-surface-base p-4 shadow-card-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Imagen del producto
        </h2>
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="max-h-48 w-auto rounded-lg border border-line-subtle object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const msg = e.currentTarget.nextElementSibling as HTMLElement | null
              if (msg) msg.style.display = 'block'
            }}
          />
        ) : null}
        {!producto.imagen_url && (
          <p className="text-sm italic text-ink-muted/60">Sin imagen configurada</p>
        )}
        {producto.imagen_url && (
          <p className="mt-1 hidden text-sm italic text-ink-muted/60">
            La imagen no pudo cargarse
          </p>
        )}
      </div>

      {/* Detail cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Info card */}
        <div className="rounded-lg border border-line-subtle bg-surface-base p-6 shadow-card-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Información general
          </h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs text-ink-muted/60">Descripción</dt>
              <dd className="mt-0.5 text-sm text-ink">
                {producto.descripcion || <span className="italic text-ink-muted/60">Sin descripción</span>}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-ink-muted/60">Precio base</dt>
                <dd className="mt-0.5 text-lg font-semibold text-ink">
                  {formatCurrency(producto.precio_base)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted/60">Stock</dt>
                <dd className="mt-0.5 text-lg font-semibold text-ink">
                  {producto.stock_cantidad} uds.
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-ink-muted/60">Disponible</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    producto.disponible
                      ? 'bg-success/20 text-success'
                      : 'bg-danger/20 text-danger'
                  }`}
                >
                  {producto.disponible ? 'Disponible' : 'No disponible'}
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-ink-muted/60">Actualizado</dt>
                <dd className="mt-0.5 text-sm text-ink">
                  {formatDate(producto.updated_at)}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Categorías card */}
        <div className="rounded-lg border border-line-subtle bg-surface-base p-6 shadow-card-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Categorías
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {producto.categorias.length > 0 ? (
              producto.categorias.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand"
                >
                  {cat.nombre}
                </span>
              ))
            ) : (
              <p className="text-sm italic text-ink-muted/60">Sin categorías asignadas</p>
            )}
          </div>
        </div>
      </div>

      {/* Ingredientes section */}
      <div className="mt-6 rounded-lg border border-line-subtle bg-surface-base p-6 shadow-card-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Ingredientes
        </h2>
        {producto.ingredientes.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {producto.ingredientes.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-high px-3 py-2"
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
                  <span className="text-xs italic text-ink-muted/60">Removible</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm italic text-ink-muted/60">Sin ingredientes asignados</p>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg border border-line-subtle bg-surface-base p-6 shadow-card-md">
            <h3 className="text-lg font-semibold text-ink">Confirmar eliminación</h3>
            <p className="mt-2 text-sm text-ink-muted">
              ¿Estás seguro de eliminar <strong className="text-ink">{producto.nombre}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-lg border border-line-subtle px-4 py-2 text-sm font-medium text-ink hover:bg-surface-high disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-danger-container px-4 py-2 text-sm font-semibold text-danger hover:opacity-90 disabled:opacity-50 transition-colors"
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
