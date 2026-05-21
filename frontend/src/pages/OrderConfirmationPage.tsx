import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePedidoDetalle } from '@/shared/hooks/usePedidos'

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(num)
}

function itemSubtotal(precioSnapshot: string, cantidad: number): string {
  return formatCurrency(Number.parseFloat(precioSnapshot) * cantidad)
}

function formatExclusiones(item: { personalizacion: number[]; personalizacionDetalle: { nombre: string }[] }): string | null {
  if (item.personalizacionDetalle.length > 0) {
    return item.personalizacionDetalle.map((exclusion) => exclusion.nombre).join(', ')
  }
  if (item.personalizacion.length > 0) {
    return item.personalizacion.map((id) => `Ingrediente #${id}`).join(', ')
  }
  return null
}

export function OrderConfirmationPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const pedidoId = id ? Number.parseInt(id, 10) : null

  const { data: pedido, isLoading, isError } = usePedidoDetalle(pedidoId)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-ink-muted">
        Cargando pedido...
      </div>
    )
  }

  if (isError || !pedido) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-ink-muted">No se pudo cargar el pedido.</p>
        <Link to="/pedidos" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
          Ver mis pedidos
        </Link>
      </div>
    )
  }

  const isPickup = pedido.direccionSnapshot === null

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate('/pedidos')} className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Mis pedidos
      </button>
      <div className="rounded-lg border border-success/30 bg-surface-base p-8 shadow-card-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-success">Pedido creado</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Pedido #{pedido.id}</h1>
        <p className="mt-1 text-sm text-ink-muted">{pedido.estadoCodigo}</p>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-ink-muted">Resumen del pedido</h2>
          <ul className="mt-3 divide-y divide-line-subtle rounded-lg border border-line-subtle">
            {pedido.items.map((item, index) => (
              <li
                key={`${item.productoId ?? index}-${item.nombreSnapshot}`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="text-ink">
                  {item.cantidad}× {item.nombreSnapshot}
                  {formatExclusiones(item) && (
                    <span className="mt-1 block text-xs text-ink-muted">
                      Sin {formatExclusiones(item)}
                    </span>
                  )}
                </span>
                <span className="font-medium text-ink">
                  {itemSubtotal(item.precioSnapshot, item.cantidad)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <dl className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-line-subtle bg-surface-low px-4 py-3">
          <div>
            <dt className="text-xs font-medium uppercase text-ink-muted">Envío</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">
              {isPickup ? 'Sin costo — retiro en local' : formatCurrency(pedido.costoEnvio)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-ink-muted">Total</dt>
            <dd className="mt-1 text-sm font-bold text-brand">{formatCurrency(pedido.total)}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase text-ink-muted">Entrega</p>
          {isPickup ? (
            <p className="mt-1 text-sm text-ink">Retiro en local</p>
          ) : (
            pedido.direccionSnapshot && (
              <p className="mt-1 text-sm text-ink">
                {pedido.direccionSnapshot.linea1}
                {pedido.direccionSnapshot.linea2 ? `, ${pedido.direccionSnapshot.linea2}` : ''},{' '}
                {pedido.direccionSnapshot.ciudad}
              </p>
            )
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={`/pedidos/${pedido.id}`}
            className="rounded-lg border border-line-subtle bg-surface-base px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-high"
          >
            Ver detalle del pedido
          </Link>
          <Link
            to="/pedidos"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-dim"
          >
            Mis pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}
