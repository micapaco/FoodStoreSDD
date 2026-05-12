import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductos, useCategorias, useDeleteProducto, useUpdateStock, useUpdateDisponibilidad } from '@/features/productos/hooks/useProductos'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'
import type { ProductoFilters } from '@/entities/productos/types'

const PAGE_SIZES = [10, 20, 50]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-200" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

interface DeleteModalProps {
  open: boolean
  productName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function DeleteModal({ open, productName, onConfirm, onCancel, loading }: DeleteModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
        <p className="mt-2 text-sm text-gray-600">
          ¿Estás seguro de eliminar <strong>{productName}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProductosPage() {
  const addToast = useUiStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles.includes('ADMIN') ?? false
  const isStock = user?.roles.includes('STOCK') ?? false

  // Filters state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [draftStockValues, setDraftStockValues] = useState<Record<number, string>>({})
  const [filters, setFilters] = useState<ProductoFilters>({ page: 1, size: 20 })
  const [catFilter, setCatFilter] = useState<number | ''>('')
  const [disponibleFilter, setDisponibleFilter] = useState<boolean | ''>('')
  const [stockBajo, setStockBajo] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nombre: string } | null>(null)

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  // Build filters
  const effectiveFilters: ProductoFilters = {
    ...filters,
    q: debouncedSearch || undefined,
    categoria_id: catFilter || undefined,
    disponible: disponibleFilter === '' ? undefined : disponibleFilter,
  }
  if (stockBajo) {
    effectiveFilters.sort = 'stock_cantidad'
    effectiveFilters.order = 'asc'
  }

  const { data, isLoading, isError, error, refetch } = useProductos(effectiveFilters)
  const { data: categorias } = useCategorias()

  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteProducto()
  const { mutate: updateStockMutate } = useUpdateStock()
  const { mutate: updateDispMutate } = useUpdateDisponibilidad()

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutate(deleteTarget.id, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Producto eliminado correctamente' })
        setDeleteTarget(null)
      },
      onError: () => {
        addToast({ type: 'error', message: 'Error al eliminar el producto' })
      },
    })
  }

  const handleStockBlur = (id: number, rawValue: string) => {
    // Clear draft state so input reverts to server value on next render
    setDraftStockValues((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    const value = parseInt(rawValue, 10)
    if (isNaN(value) || value < 0) return
    updateStockMutate(
      { id, stock_cantidad: value },
      {
        onError: () => addToast({ type: 'error', message: 'Error al actualizar el stock' }),
      },
    )
  }

  const handleDisponibilidadToggle = (id: number, current: boolean) => {
    updateDispMutate(
      { id, disponible: !current },
      {
        onError: () => addToast({ type: 'error', message: 'Error al cambiar disponibilidad' }),
      },
    )
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión de productos del catálogo</p>
        </div>
        {isAdmin && (
          <Link
            to="/admin/productos/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo producto
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar productos…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {/* Categoria filter */}
        <select
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value ? Number(e.target.value) : '')
            setFilters((f) => ({ ...f, page: 1 }))
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Todas las categorías</option>
          {categorias?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        {/* Disponible filter */}
        <select
          value={disponibleFilter === '' ? '' : String(disponibleFilter)}
          onChange={(e) => {
            setDisponibleFilter(e.target.value === '' ? '' : e.target.value === 'true')
            setFilters((f) => ({ ...f, page: 1 }))
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Todos (disponibilidad)</option>
          <option value="true">Disponibles</option>
          <option value="false">No disponibles</option>
        </select>

        {/* Stock bajo */}
        <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={stockBajo}
            onChange={(e) => {
              setStockBajo(e.target.checked)
              setFilters((f) => ({ ...f, page: 1 }))
            }}
            className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          Stock bajo
        </label>
      </div>

      {/* Error state */}
      {isError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700 font-medium">
            {error instanceof Error ? error.message : 'Error al cargar los productos'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Precio
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Disponible
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Categorías
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : data && data.items.length > 0 ? (
              data.items.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      to={`/admin/productos/${prod.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors"
                    >
                      {prod.nombre}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(prod.precio_base)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {isStock ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={draftStockValues[prod.id] ?? prod.stock_cantidad}
                        onChange={(e) => setDraftStockValues((prev) => ({ ...prev, [prod.id]: e.target.value }))}
                        onBlur={(e) => handleStockBlur(prod.id, e.target.value)}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
                      />
                    ) : (
                      <span
                        className={
                          prod.stock_cantidad <= 5
                            ? 'font-semibold text-red-600'
                            : 'text-gray-700'
                        }
                      >
                        {prod.stock_cantidad}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {isStock ? (
                      <button
                        type="button"
                        onClick={() => handleDisponibilidadToggle(prod.id, prod.disponible)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                          prod.disponible
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {prod.disponible ? 'Sí' : 'No'}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          prod.disponible
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {prod.disponible ? 'Sí' : 'No'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {prod.categoria_ids.slice(0, 3).map((cid) => (
                        <span
                          key={cid}
                          className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {categorias?.find((c) => c.id === cid)?.nombre ?? `#${cid}`}
                        </span>
                      ))}
                      {prod.categoria_ids.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          +{prod.categoria_ids.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/productos/${prod.id}`}
                        className="rounded p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Ver detalle"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      {isAdmin && (
                        <>
                          <Link
                            to={`/admin/productos/${prod.id}/editar`}
                            className="rounded p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                            title="Editar"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: prod.id, nombre: prod.nombre })}
                            className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              !isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="mt-4 text-sm font-medium text-gray-500">No se encontraron productos</p>
                    <p className="mt-1 text-xs text-gray-400">Probá cambiando los filtros de búsqueda</p>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 0 && (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Mostrar</span>
            <select
              value={filters.size}
              onChange={(e) => setFilters((f) => ({ ...f, size: Number(e.target.value), page: 1 }))}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span>
              de {data.total} resultados (pág. {data.page} de {data.pages})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(data.pages, 5) }, (_, i) => {
              const start = Math.max(1, data.page - 2)
              const pageNum = start + i
              if (pageNum > data.pages) return null
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, page: pageNum }))}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    pageNum === data.page
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              type="button"
              disabled={data.page >= data.pages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      <DeleteModal
        open={deleteTarget !== null}
        productName={deleteTarget?.nombre ?? ''}
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
