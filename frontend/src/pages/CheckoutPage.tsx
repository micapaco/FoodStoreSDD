import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ValidarCarritoResponse } from '@/entities/pedidos/types'
import { useAddressesQuery } from '@/features/direcciones/hooks/useDirecciones'
import { parseHttpError } from '@/shared/lib/http/parseHttpError'
import { useCrearPedido } from '@/shared/hooks/usePedidos'
import { useValidarCheckout } from '@/shared/hooks/useValidarCheckout'
import { useConfigPublica } from '@/shared/hooks/useConfig'
import { useCartStore } from '@/shared/stores/cartStore'
import { usePaymentStore } from '@/shared/stores/paymentStore'
import { useUiStore } from '@/shared/stores/uiStore'

const FORMAS_PAGO = [
  { codigo: 'MERCADOPAGO', label: 'MercadoPago' },
  { codigo: 'EFECTIVO', label: 'Efectivo' },
  { codigo: 'TRANSFERENCIA', label: 'Transferencia' },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}


export function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal)
  const clearCart = useCartStore((s) => s.clearCart)
  const addToast = useUiStore((s) => s.addToast)
  const startCheckoutPayment = usePaymentStore((s) => s.startCheckout)
  const resetPayment = usePaymentStore((s) => s.resetPayment)

  const validarCheckout = useValidarCheckout()
  const crearPedido = useCrearPedido()
  const addressesQuery = useAddressesQuery({ page: 1, page_size: 100 })
  const { data: configPublica } = useConfigPublica()

  const [resultado, setResultado] = useState<ValidarCarritoResponse | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [formaPagoCodigo, setFormaPagoCodigo] = useState('MERCADOPAGO')
  const [modoEntrega, setModoEntrega] = useState<'delivery' | 'pickup'>('delivery')
  const [direccionId, setDireccionId] = useState<string>('')
  const [notas, setNotas] = useState('')

  const direcciones = addressesQuery.data?.items ?? []
  const hasItems = items.length > 0
  const hasBlockingIssues = resultado && !resultado.valido
  const isPending = validarCheckout.isPending || crearPedido.isPending
  const configCosto = configPublica?.costo_envio_base ?? 50
  const checkoutCostoEnvio = modoEntrega === 'pickup' ? 0 : configCosto
  const checkoutTotal = subtotal() + checkoutCostoEnvio

  const selectedDireccionId = useMemo(() => {
    if (modoEntrega === 'pickup') return null
    const parsed = Number.parseInt(direccionId, 10)
    return Number.isNaN(parsed) ? null : parsed
  }, [direccionId, modoEntrega])

  const validarRequest = {
    items: items.map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioEsperado: item.producto.precio,
      exclusiones: item.personalizacion.ingredientesExcluidos,
    })),
  }

  const handleCrearPedido = async () => {
    setRequestError(null)
    setResultado(null)
    resetPayment()

    if (modoEntrega === 'delivery' && selectedDireccionId === null) {
      setRequestError('Selecciona una direccion de entrega o elegi retiro en local.')
      return
    }

    try {
      const validacion = await validarCheckout.mutateAsync(validarRequest)
      setResultado(validacion)
      if (!validacion.valido) return

      const pedido = await crearPedido.mutateAsync({
        items: items.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          personalizacion: item.personalizacion.ingredientesExcluidos,
        })),
        formaPagoCodigo,
        direccionId: selectedDireccionId,
        notas: notas.trim() || null,
      })

      clearCart()
      if (formaPagoCodigo === 'MERCADOPAGO') {
        startCheckoutPayment()
      }
      addToast({ type: 'success', message: 'Pedido creado correctamente.' })
      navigate(`/pedidos/${pedido.id}/confirmacion`)
    } catch (error) {
      const parsed = parseHttpError(error)
      setRequestError(parsed.message)
      addToast({ type: 'error', message: parsed.message })
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      {!hasItems ? (
        <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">Tu carrito esta vacio</p>
          <Link
            to="/productos"
            className="mt-4 inline-flex rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Ir al catalogo
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Productos</h2>
              <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {items.map((item) => (
                  <li
                    key={`${item.productoId}-${item.personalizacion.ingredientesExcluidos.slice().sort().join('-')}`}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.producto.nombre}</p>
                      <p className="mt-1 text-xs text-gray-500">Cantidad: {item.cantidad}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.producto.precio * item.cantidad)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Entrega</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm">
                  <input
                    type="radio"
                    name="modoEntrega"
                    value="delivery"
                    checked={modoEntrega === 'delivery'}
                    onChange={() => setModoEntrega('delivery')}
                    className="h-4 w-4"
                  />
                  Enviar a domicilio
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm">
                  <input
                    type="radio"
                    name="modoEntrega"
                    value="pickup"
                    checked={modoEntrega === 'pickup'}
                    onChange={() => setModoEntrega('pickup')}
                    className="h-4 w-4"
                  />
                  Retiro en local
                </label>
              </div>

              {modoEntrega === 'delivery' && (
                <div className="mt-4">
                  <label htmlFor="direccionId" className="text-sm font-medium text-gray-700">
                    Direccion
                  </label>
                  <select
                    id="direccionId"
                    value={direccionId}
                    onChange={(event) => setDireccionId(event.target.value)}
                    disabled={addressesQuery.isLoading}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar direccion</option>
                    {direcciones.map((direccion) => (
                      <option key={direccion.id} value={direccion.id}>
                        {direccion.alias} - {direccion.linea1}
                      </option>
                    ))}
                  </select>
                  {!addressesQuery.isLoading && direcciones.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      No tenes direcciones cargadas.{' '}
                      <Link to="/direcciones" className="font-semibold text-orange-600 hover:underline">
                        Crear direccion
                      </Link>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Pago y notas</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="formaPago" className="text-sm font-medium text-gray-700">
                    Forma de pago
                  </label>
                  <select
                    id="formaPago"
                    value={formaPagoCodigo}
                    onChange={(event) => setFormaPagoCodigo(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {FORMAS_PAGO.map((forma) => (
                      <option key={forma.codigo} value={forma.codigo}>
                        {forma.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="notas" className="text-sm font-medium text-gray-700">
                    Notas
                  </label>
                  <input
                    id="notas"
                    value={notas}
                    onChange={(event) => setNotas(event.target.value)}
                    maxLength={500}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            {requestError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {requestError}
              </div>
            )}

            {hasBlockingIssues && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-900">Revisa el carrito</h3>
                {resultado.errores.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-amber-800">
                    {resultado.errores.map((error) => (
                      <li key={`${error.productoId}-${error.tipo}`}>{error.mensaje}</li>
                    ))}
                  </ul>
                )}
                {resultado.preciosActualizados.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-amber-800">
                    {resultado.preciosActualizados.map((precio) => (
                      <li key={precio.productoId}>
                        El producto #{precio.productoId} cambio de {formatCurrency(precio.precioViejo)} a{' '}
                        {formatCurrency(precio.precioNuevo)}.
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <aside>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Resumen</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal())}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Costo de envio</span>
                  <span className="font-medium text-gray-900">{formatCurrency(checkoutCostoEnvio)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(checkoutTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCrearPedido}
                disabled={isPending || !hasItems}
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isPending ? 'Creando pedido...' : 'Crear pedido'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
