import { Link, useParams } from 'react-router-dom'
import { MercadoPagoCardPayment } from '@/features/pagos/MercadoPagoCardPayment'
import { usePedidoDetalle } from '@/shared/hooks/usePedidos'

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(num)
}

function itemSubtotal(precioSnapshot: string, cantidad: number): string {
  return formatCurrency(Number.parseFloat(precioSnapshot) * cantidad)
}

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const pedidoId = id ? Number.parseInt(id, 10) : null

  const { data: pedido, isLoading, isError } = usePedidoDetalle(pedidoId)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-gray-500">
        Cargando pedido...
      </div>
    )
  }

  if (isError || !pedido) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-gray-600">No se pudo cargar el pedido.</p>
        <Link to="/pedidos" className="mt-4 inline-block text-sm font-semibold text-orange-600 hover:underline">
          Ver mis pedidos
        </Link>
      </div>
    )
  }

  const isPickup = pedido.direccionSnapshot === null
  const isMercadoPago = pedido.formaPagoCodigo === 'MERCADOPAGO'

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-green-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Pedido creado</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Pedido #{pedido.id}</h1>
        <p className="mt-1 text-sm text-gray-500">PENDIENTE — Esperando pago</p>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700">Resumen del pedido</h2>
          <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {pedido.items.map((item, index) => (
              <li
                key={`${item.productoId ?? index}-${item.nombreSnapshot}`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="text-gray-800">
                  {item.cantidad}× {item.nombreSnapshot}
                </span>
                <span className="font-medium text-gray-900">
                  {itemSubtotal(item.precioSnapshot, item.cantidad)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <dl className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Envío</dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {isPickup ? 'Sin costo — retiro en local' : formatCurrency(pedido.costoEnvio)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-gray-500">Total</dt>
            <dd className="mt-1 text-sm font-bold text-orange-600">{formatCurrency(pedido.total)}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase text-gray-500">Entrega</p>
          {isPickup ? (
            <p className="mt-1 text-sm text-gray-900">Retiro en local</p>
          ) : (
            pedido.direccionSnapshot && (
              <p className="mt-1 text-sm text-gray-900">
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
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Ver detalle del pedido
          </Link>
          <Link
            to="/pedidos"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Mis pedidos
          </Link>
        </div>

        {isMercadoPago && <MercadoPagoCardPayment pedido={pedido} />}
      </div>
    </div>
  )
}
