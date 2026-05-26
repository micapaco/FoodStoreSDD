import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePedidosPropios } from '@/shared/hooks/usePedidos'

const ESTADOS = ['', 'PENDIENTE', 'CONFIRMADO', 'EN_PREP', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO']

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value))
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function describeOrderState(estadoCodigo: string): string {
  if (estadoCodigo === 'PENDIENTE') return 'Pendiente'
  if (estadoCodigo === 'CONFIRMADO') return 'Confirmado'
  if (estadoCodigo === 'EN_PREP') return 'En preparacion'
  if (estadoCodigo === 'EN_CAMINO') return 'En camino'
  if (estadoCodigo === 'ENTREGADO') return 'Entregado'
  return 'Cancelado'
}

export function OrdersListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState('')
  const size = 10
  const { data, isLoading, isError, refetch, isFetching } = usePedidosPropios({
    page,
    size,
    estado: estado || undefined,
  })

  const items = data?.items ?? []
  const canPrev = page > 1
  const canNext = data ? page < data.pages : false

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mis pedidos</h1>
          <p className="mt-1 text-sm text-ink-muted">Seguimiento de tus compras y su estado actual.</p>
        </div>
        <label className="text-sm font-medium text-ink-muted">
          Estado
          <select
            value={estado}
            onChange={(event) => {
              setEstado(event.target.value)
              setPage(1)
            }}
            className="mt-1 block min-w-52 rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink"
          >
            {ESTADOS.map((option) => (
              <option key={option || 'todos'} value={option}>
                {option || 'Todos'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-lg border border-line-subtle bg-surface-base p-5">
              <div className="h-4 w-32 rounded bg-surface-higher" />
              <div className="mt-4 h-5 w-48 rounded bg-surface-higher" />
              <div className="mt-3 h-4 w-36 rounded bg-surface-higher" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-lg border border-danger/30 bg-danger/10 p-6 text-sm text-danger">
          <p>No se pudieron cargar tus pedidos.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-danger-container px-4 py-2 font-semibold text-danger"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-line-subtle bg-surface-base p-10 text-center">
          <h2 className="text-lg font-semibold text-ink">Todavia no hay pedidos para mostrar</h2>
          <p className="mt-2 text-sm text-ink-muted">Cuando completes una compra, aparecera aca.</p>
          <Link
            to="/productos"
            className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-on hover:bg-brand-dim"
          >
            Ir al catalogo
          </Link>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="mt-6 grid gap-4">
          {items.map((pedido) => (
            <article key={pedido.id} className="rounded-lg border border-line-subtle bg-surface-base p-5 shadow-card-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-ink-muted">Pedido #{pedido.id}</p>
                  <h2 className="mt-1 text-lg font-semibold text-ink">{describeOrderState(pedido.estadoCodigo)}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{formatDate(pedido.createdAt)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm sm:min-w-64">
                  <div>
                    <p className="text-ink-muted">Items</p>
                    <p className="mt-1 font-semibold text-ink">{pedido.cantidadItems}</p>
                  </div>
                  <div>
                    <p className="text-ink-muted">Total</p>
                    <p className="mt-1 font-semibold text-brand">{formatCurrency(pedido.total)}</p>
                  </div>
                </div>
                <Link
                  to={`/pedidos/${pedido.id}`}
                  className="inline-flex items-center justify-center rounded-lg border border-line-subtle px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-high"
                >
                  Ver detalle
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {data && data.total > data.size && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted">
            Pagina {data.page} de {data.pages}{isFetching ? ' (actualizando...)' : ''}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => canPrev && setPage((value) => value - 1)}
              disabled={!canPrev}
              className="rounded-lg border border-line-subtle px-3 py-2 text-sm text-ink hover:bg-surface-high disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => canNext && setPage((value) => value + 1)}
              disabled={!canNext}
              className="rounded-lg border border-line-subtle px-3 py-2 text-sm text-ink hover:bg-surface-high disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
