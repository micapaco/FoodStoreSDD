import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductosPublic, useCategorias } from '@/features/productos/hooks/useProductos'
import type { ProductoFilters, ProductoRead } from '@/entities/productos/types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-line-subtle bg-surface-base overflow-hidden">
      <div className="aspect-square bg-surface-higher" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-surface-higher" />
        <div className="h-3 w-full rounded bg-surface-higher" />
        <div className="h-5 w-1/3 rounded bg-surface-higher" />
      </div>
      <div className="px-4 pb-4">
        <div className="h-9 w-full rounded-lg bg-surface-higher" />
      </div>
    </div>
  )
}

// ── Product card ──────────────────────────────────────────────────────────────

interface ProductCardProps {
  producto: ProductoRead
  categoriaNames: Map<number, string>
}

function ProductCard({ producto, categoriaNames }: ProductCardProps) {
  const sinStock = !producto.disponible || producto.stock_cantidad === 0

  const firstCatName = producto.categoria_ids[0]
    ? categoriaNames.get(producto.categoria_ids[0])
    : null

  return (
    <Link
      to={`/productos/${producto.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line-subtle bg-surface-base shadow-card-sm transition-all hover:border-brand/40 hover:shadow-card-md"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-high">
        {producto.imagen_url ? (
          <>
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement | null
                if (placeholder) placeholder.style.display = 'flex'
              }}
            />
            <div className="hidden h-full w-full items-center justify-center">
              <svg className="h-14 w-14 text-brand/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-14 w-14 text-brand/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {firstCatName && (
          <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-brand backdrop-blur-sm">
            {firstCatName}
          </span>
        )}
        {sinStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-surface-base/90 px-3 py-1 text-xs font-semibold text-ink-muted">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-ink transition-colors group-hover:text-brand line-clamp-1">
          {producto.nombre}
        </h3>
        {producto.descripcion && (
          <p className="mt-1 flex-1 text-xs text-ink-muted line-clamp-2">
            {producto.descripcion}
          </p>
        )}
        <p className="mt-2 text-base font-bold text-brand">
          {formatCurrency(producto.precio_base)}
        </p>
        <p className="text-xs text-ink-muted/70">
          {producto.stock_cantidad} disponibles
        </p>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <span className="flex w-full items-center justify-center rounded-lg border border-brand/40 py-2 text-sm font-semibold text-brand transition-colors group-hover:bg-brand group-hover:text-brand-on">
          Ver producto
        </span>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CatalogoPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [catFilter, setCatFilter] = useState<number | ''>('')
  const [precioMin, setPrecioMin] = useState('')
  const [precioMax, setPrecioMax] = useState('')
  const [page, setPage] = useState(1)
  const [showPriceFilter, setShowPriceFilter] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const catalogRef = useRef<HTMLDivElement>(null)
  const pillsRef = useRef<HTMLDivElement>(null)

  const scrollPills = (dir: 'left' | 'right') => {
    if (!pillsRef.current) return
    pillsRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  const { data: categorias } = useCategorias()

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }

  const handleCatFilter = (id: number | '') => {
    setCatFilter(id)
    setPage(1)
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
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 py-16 sm:py-24"
        style={{
          backgroundImage: 'url(/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay para legibilidad del texto */}
        <div className="absolute inset-0 bg-surface-lowest/80 backdrop-blur-sm" />

        <div className="relative mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">
            Gastronomía premium · Envío a domicilio
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            El sabor que buscás,{' '}
            <span className="text-brand">cuando querés</span>
          </h1>
          <p className="mt-4 text-base text-ink-muted">
            Experiencias gastronómicas premium en la puerta de tu casa
          </p>
          <button
            type="button"
            onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-6 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-on"
          >
            Ver catálogo
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Catalog ───────────────────────────────────────────────────── */}
      <div ref={catalogRef} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Search + price filter toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
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
              className="w-full rounded-full border border-line-subtle bg-surface-low py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPriceFilter((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
              showPriceFilter || precioMin || precioMax
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-line-subtle bg-surface-low text-ink-muted hover:bg-surface-high'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Precio
          </button>
        </div>

        {/* Price filter (expandible) */}
        {showPriceFilter && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Mínimo"
              value={precioMin}
              onChange={(e) => { setPrecioMin(e.target.value); setPage(1) }}
              className="w-32 rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
            />
            <span className="text-ink-muted">—</span>
            <input
              type="number"
              min="0"
              placeholder="Máximo"
              value={precioMax}
              onChange={(e) => { setPrecioMax(e.target.value); setPage(1) }}
              className="w-32 rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
            />
            {(precioMin || precioMax) && (
              <button
                type="button"
                onClick={() => { setPrecioMin(''); setPrecioMax(''); setPage(1) }}
                className="text-xs text-ink-muted hover:text-danger transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* Category pills */}
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollPills('left')}
            aria-label="Categorías anteriores"
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full border border-line-subtle bg-surface-low text-ink-muted hover:bg-surface-high hover:text-ink transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div ref={pillsRef} className="flex flex-1 gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => handleCatFilter('')}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                catFilter === ''
                  ? 'bg-brand text-brand-on shadow-glow-brand'
                  : 'border border-line-subtle bg-surface-low text-ink-muted hover:bg-surface-high'
              }`}
            >
              Todos
            </button>
            {categorias?.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCatFilter(cat.id)}
                className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  catFilter === cat.id
                    ? 'bg-brand text-brand-on shadow-glow-brand'
                    : 'border border-line-subtle bg-surface-low text-ink-muted hover:bg-surface-high'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollPills('right')}
            aria-label="Más categorías"
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full border border-line-subtle bg-surface-low text-ink-muted hover:bg-surface-high hover:text-ink transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {isError && (
          <div className="mt-8 rounded-xl border border-danger/30 bg-danger/10 p-8 text-center">
            <p className="text-danger font-medium">Error al cargar el catálogo</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-lg bg-danger-container px-4 py-2 text-sm font-medium text-danger hover:opacity-90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Product grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : data?.items && data.items.length > 0 ? (
            data.items.map((prod) => (
              <ProductCard
                key={prod.id}
                producto={prod}
                categoriaNames={categoriaMap}
              />
            ))
          ) : (
            !isLoading && (
              <div className="col-span-full py-20 text-center">
                <svg className="mx-auto h-16 w-16 text-ink-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="mt-4 text-base font-medium text-ink-muted">No hay productos disponibles</p>
                <p className="mt-1 text-sm text-ink-muted/60">
                  Probá ajustando los filtros o volvé más tarde.
                </p>
              </div>
            )
          )}
        </div>

        {/* Pagination */}
        {data?.pages && data.pages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-line-subtle px-5 py-2 text-sm text-ink disabled:opacity-40 hover:bg-surface-high transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-sm text-ink-muted">
              {page} / {data.pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="rounded-full border border-line-subtle px-5 py-2 text-sm text-ink disabled:opacity-40 hover:bg-surface-high transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
