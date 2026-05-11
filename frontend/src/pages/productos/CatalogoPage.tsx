import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useProductosPublic, useCategorias } from '@/features/productos/hooks/useProductos'
import { useCartStore } from '@/shared/stores/cartStore'
import type { ProductoFilters } from '@/entities/productos/types'
import type { ProductoRead } from '@/entities/productos/types'

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
  producto: ProductoRead
  categoriaNames: Map<number, string>
  hasAlergenos: boolean
}

function ProductCard({ producto, categoriaNames, hasAlergenos }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(
      { id: producto.id, nombre: producto.nombre, precio: producto.precio_base },
      1,
      { ingredientesExcluidos: [] },
    )
  }

  return (
    <Link
      to={`/productos/${producto.id}`}
      className="group relative rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="aspect-[3/2] flex items-center justify-center rounded-t-lg bg-gradient-to-br from-orange-50 to-amber-50">
        <svg className="h-16 w-16 text-orange-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
          {producto.nombre}
        </h3>
        <p className="mt-1.5 text-lg font-bold text-orange-600">
          {formatCurrency(producto.precio_base)}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {producto.categoria_ids.slice(0, 3).map((cid) => {
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

        {hasAlergenos && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <span>⚠️</span>
            <span>Contiene alérgenos</span>
          </div>
        )}
      </div>

      {producto.disponible && producto.stock_cantidad > 0 && (
        <button
          type="button"
          onClick={handleQuickAdd}
          className="absolute right-2 top-2 rounded-full bg-orange-500 p-1.5 text-white shadow-sm hover:bg-orange-600 transition-colors"
          aria-label={`Agregar ${producto.nombre} al carrito`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
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

  const categoriaMap = new Map<number, string>()
  categorias?.forEach((cat) => {
    categoriaMap.set(cat.id, cat.nombre)
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Nuestro catálogo</h1>
        <p className="mt-2 text-sm text-gray-500">
          Descubrí todos nuestros productos disponibles
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-3">
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

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((prod) => (
            <ProductCard
              key={prod.id}
              producto={prod}
              categoriaNames={categoriaMap}
              hasAlergenos={false}
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

      {data?.pages && data.pages > 1 && (
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
