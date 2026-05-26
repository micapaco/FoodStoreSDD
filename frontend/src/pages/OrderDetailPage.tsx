import { Link, useParams } from 'react-router-dom'
import { usePedidoDetalle } from '@/shared/hooks/usePedidos'
import { parseHttpError } from '@/shared/lib/http/parseHttpError'

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value))
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function describePaymentStatus(formaPagoCodigo: string, estadoCodigo: string, mpStatus?: string | null): string {
  if (formaPagoCodigo === 'MERCADOPAGO') {
    return mpStatus ?? 'Sin intento'
  }
  if (estadoCodigo === 'PENDIENTE') {
    return 'Pendiente de validacion del local'
  }
  if (estadoCodigo === 'CONFIRMADO') {
    return 'Pago validado'
  }
  return 'Pago gestionado fuera de MercadoPago'
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

export function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const pedidoId = params.id && Number.isFinite(Number(params.id)) ? Number(params.id) : null
  const { data, isLoading, isError, error, refetch } = usePedidoDetalle(pedidoId)
  const parsedError = error ? parseHttpError(error) : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">Detalle del pedido</p>
          <h1 className="text-2xl font-bold text-ink">
            {pedidoId ? `Pedido #${pedidoId}` : 'Pedido invalido'}
          </h1>
        </div>
        <Link to="/pedidos" className="rounded-lg border border-line-subtle px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-high">
          Volver
        </Link>
      </div>

      {pedidoId === null && (
        <div className="mt-6 rounded-lg border border-danger/30 bg-danger/10 p-6 text-sm text-danger">
          El identificador del pedido no es valido.
        </div>
      )}

      {pedidoId !== null && isLoading && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-lg border border-line-subtle bg-surface-base" />
          ))}
        </div>
      )}

      {pedidoId !== null && isError && (
        <div className="mt-6 rounded-lg border border-danger/30 bg-danger/10 p-6 text-sm text-danger">
          <p>{parsedError?.message ?? 'No se pudo cargar el pedido.'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-danger-container px-4 py-2 font-semibold text-danger"
          >
            Reintentar
          </button>
        </div>
      )}

      {data && (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-line-subtle bg-surface-base p-5">
              <p className="text-xs font-semibold uppercase text-ink-muted">Estado</p>
              <p className="mt-2 text-lg font-bold text-ink">{data.estadoCodigo}</p>
              <p className="mt-1 text-sm text-ink-muted">{formatDate(data.createdAt)}</p>
            </div>
            <div className="rounded-lg border border-line-subtle bg-surface-base p-5">
              <p className="text-xs font-semibold uppercase text-ink-muted">Pago</p>
              <p className="mt-2 text-lg font-bold text-ink">
                {describePaymentStatus(data.formaPagoCodigo, data.estadoCodigo, data.pago?.mpStatus)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{data.pago?.statusDetail ?? data.formaPagoCodigo}</p>
            </div>
            <div className="rounded-lg border border-line-subtle bg-surface-base p-5">
              <p className="text-xs font-semibold uppercase text-ink-muted">Total</p>
              <p className="mt-2 text-lg font-bold text-brand">{formatCurrency(data.total)}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {data.direccionSnapshot
                  ? `Envio ${formatCurrency(data.costoEnvio)}`
                  : `Retiro en local - Envio ${formatCurrency(data.costoEnvio)}`}
              </p>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-lg border border-line-subtle bg-surface-base p-5">
              <h2 className="text-lg font-semibold text-ink">Items</h2>
              <div className="mt-4 divide-y divide-line-subtle">
                {data.items.map((item, index) => (
                  <div key={`${item.productoId ?? 'snapshot'}-${index}`} className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <p className="font-semibold text-ink">{item.nombreSnapshot}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        Cantidad {item.cantidad} · {formatCurrency(item.precioSnapshot)} cada uno
                      </p>
                      {formatExclusiones(item) && (
                        <p className="mt-1 text-sm text-ink-muted">
                          Sin {formatExclusiones(item)}
                        </p>
                      )}
                      {item.notas && (
                        <p className="mt-1 text-sm text-ink-muted italic">"{item.notas}"</p>
                      )}
                    </div>
                    <p className="font-semibold text-ink">
                      {formatCurrency(String(Number(item.precioSnapshot) * item.cantidad))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-line-subtle bg-surface-base p-5">
                <h2 className="text-lg font-semibold text-ink">Entrega</h2>
                {data.direccionSnapshot ? (
                  <div className="mt-3 text-sm text-ink-muted">
                    <p className="font-semibold text-ink">{data.direccionSnapshot.alias ?? 'Direccion registrada'}</p>
                    <p className="mt-1">{data.direccionSnapshot.linea1}</p>
                    {data.direccionSnapshot.linea2 && <p>{data.direccionSnapshot.linea2}</p>}
                    <p>{data.direccionSnapshot.ciudad}, {data.direccionSnapshot.provincia}</p>
                    {data.direccionSnapshot.codigoPostal && <p>CP {data.direccionSnapshot.codigoPostal}</p>}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-ink-muted">Retiro en local.</p>
                )}
              </div>

              <div className="rounded-lg border border-line-subtle bg-surface-base p-5">
                <h2 className="text-lg font-semibold text-ink">Historial</h2>
                <ol className="mt-4 space-y-4">
                  {data.historial.map((entry) => (
                    <li key={entry.id} className="border-l-2 border-brand/30 pl-4">
                      <p className="text-sm font-semibold text-ink">
                        {entry.estadoDesde ?? 'Inicio'} - {entry.estadoHasta}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">{formatDate(entry.createdAt)}</p>
                      {entry.motivo && <p className="mt-1 text-sm text-ink-muted">{entry.motivo}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
