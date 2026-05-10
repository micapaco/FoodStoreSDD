import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useProductosPublic, useCategorias } from '@/features/productos/hooks/useProductos'
import type { ProductoFilters } from '@/entities/productos/types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white">
      <div className="aspect-[3/2] rounded-t-lg bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-5 w-1/3 rounded bg-gray-200" />
        <div className="flex gap-1">
          <div className="h-5 w-16 rounded-full bg-gray-200" />
          <div className="h-5 w-20 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

interface ProductCardProps {
  id: number
  nombre: string
  precio_base: number
  categoriaIds: number[]
  categoriaNames: Map<number, string>
  hasAlergenos: boolean
}

function ProductCard({ id, nombre, precio_base, categoriaIds, categoriaNames, hasAlergenos }: ProductCardProps) {
  return (
    <Link
      to={`/productos/${id}`}
      className="group rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Image placeholder */}
      <div className="aspect-[3/2] flex items-center justify-center rounded-t-lg bg-gradient-to-br from-orange-50 to-amber-50">
        <svg className="h-16 w-16 text-orange-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
          {nombre}
        </h3>
        <p className="mt-1.5 text-lg font-bold text-orange-600">
          {formatCurrency(precio_base)}
        </p>

        {/* Categorías badges */}
        <div className="mt-2 flex flex-wrap gap-1">
          {categoriaIds.slice(0, 3).map((cid) => {
            const name = categoriaNames.get(cid)
            return name ? (
              <span
                key={cid}
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
              >
                {name}
              </span>
            ) : null
          })}
        </div>

        {/* Alérgeno indicator */}
        {hasAlergenos && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <span>⚠️</span>
            <span>Contiene alérgenos</span>
          </div>
        )}
      </div>
    </Link>
  )
}

export function CatalogoPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [catFilter, setCatFilter] = useState<number | ''>('')
  const [precioMin, setPrecioMin] = useState('')
  const [precioMax, setPrecioMax] = useState('')
  const [page, setPage] = useState(1)

  const { data: categorias } = useCategorias()

  // Debounce search
  const debounced = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>
      return (value: string) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          setDebouncedSearch(value)
          setPage(1)
        }, 300)
      }
    })(),
    [],
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    debounced(value)
  }

  const filters: ProductoFilters = {
    page,
    size: 12,
    q: debouncedSearch || undefined,
    categoria_id: catFilter || undefined,
    precio_min: precioMin ? Number(precioMin) : undefined,
    precio_max: precioMax ? Number(precioMax) : undefined,
  }

  const { data, isLoading, isError, refetch } = useProductosPublic(filters)

  // Build a map of category id → name for resolving product categoria_ids
  const categoriaMap = new Map<number, string>()
  categorias?.forEach((cat) => {
    categoriaMap.set(cat.id, cat.nombre)
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero / Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Nuestro catálogo</h1>
        <p className="mt-2 text-sm text-gray-500">
          Descubrí todos nuestros productos disponibles
        </p>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
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
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {/* Categoría */}
        <select
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value ? Number(e.target.value) : '')
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Todas las categorías</option>
          {categorias?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        {/* Precio min */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            placeholder="Precio min"
            value={precioMin}
            onChange={(e) => {
              setPrecioMin(e.target.value)
              setPage(1)
            }}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min="0"
            placeholder="Precio max"
            value={precioMax}
            onChange={(e) => {
              setPrecioMax(e.target.value)
              setPage(1)
            }}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700 font-medium">Error al cargar el catálogo</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Product grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : data && data.items.length > 0 ? (
          data.items.map((prod) => (
            <ProductCard
              key={prod.id}
              id={prod.id}
              nombre={prod.nombre}
              precio_base={prod.precio_base}
              categoriaIds={prod.categoria_ids}
              categoriaNames={categoriaMap}
              hasAlergenos={false /* We'd need to check detail, but this is shown on detail page */}
            />
          ))
        ) : (
          !isLoading && (
            <div className="col-span-full py-16 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-500">No hay productos disponibles</p>
              <p className="mt-1 text-sm text-gray-400">
                Probá ajustando los filtros o volvé más tarde.
              </p>
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="px-4 text-sm text-gray-600">
            Página {data.page} de {data.pages}
          </span>
          <button
            type="button"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
