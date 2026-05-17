import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ValidarCarritoResponse } from '@/entities/pedidos/types'
import { useAddressesQuery } from '@/features/direcciones/hooks/useDirecciones'
import { MercadoPagoCheckoutPayment } from '@/features/pagos/MercadoPagoCheckoutPayment'
import { useIngredientes } from '@/features/productos/hooks/useProductos'
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
  const ingredientesQuery = useIngredientes()
  const { data: configPublica } = useConfigPublica()

  const [resultado, setResultado] = useState<ValidarCarritoResponse | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [showMercadoPagoPayment, setShowMercadoPagoPayment] = useState(false)
  const [formaPagoCodigo, setFormaPagoCodigo] = useState('MERCADOPAGO')
  const [modoEntrega, setModoEntrega] = useState<'delivery' | 'pickup'>('delivery')
  const [direccionId, setDireccionId] = useState<string>('')
  const [notas, setNotas] = useState('')

  const direcciones = addressesQuery.data?.items ?? []
  const hasItems = items.length > 0
  const hasBlockingIssues = resultado && !resultado.valido
  const isPending = validarCheckout.isPending || crearPedido.isPending
  const configCosto = configPublica?.costo_envio_base ?? 50
  const pedidosHabilitados = configPublica?.pedidos_habilitados !== false
  const checkoutCostoEnvio = modoEntrega === 'pickup' ? 0 : configCosto
  const checkoutTotal = subtotal() + checkoutCostoEnvio
  const isMercadoPago = formaPagoCodigo === 'MERCADOPAGO'
  const ingredientNameMap = useMemo(
    () => new Map(ingredientesQuery.data?.map((ingrediente) => [ingrediente.id, ingrediente.nombre]) ?? []),
    [ingredientesQuery.data],
  )

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
      exclusiones: item.personalizacion?.ingredientesExcluidos ?? [],
    })),
  }

  const pedidoRequest = {
    items: items.map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      personalizacion: item.personalizacion?.ingredientesExcluidos ?? [],
    })),
    formaPagoCodigo,
    direccionId: selectedDireccionId,
    notas: notas.trim() || null,
  }

  useEffect(() => {
    setShowMercadoPagoPayment(false)
  }, [formaPagoCodigo, modoEntrega, direccionId, notas, items])

  function formatExclusiones(ids: number[]): string | null {
    if (ids.length === 0) return null
    return ids.map((id) => ingredientNameMap.get(id) ?? `Ingrediente #${id}`).join(', ')
  }

  const handleCrearPedido = async () => {
    setRequestError(null)
    setResultado(null)
    resetPayment()

    if (!pedidosHabilitados) {
      const message = 'El local no esta aceptando pedidos en este momento.'
      setRequestError(message)
      addToast({ type: 'warning', message })
      return
    }

    if (modoEntrega === 'delivery' && selectedDireccionId === null) {
      setRequestError('Selecciona una direccion de entrega o elegi retiro en local.')
      return
    }

    try {
      const validacion = await validarCheckout.mutateAsync(validarRequest)
      setResultado(validacion)
      if (!validacion.valido) return

      if (isMercadoPago) {
        setShowMercadoPagoPayment(true)
        return
      }

      const pedido = await crearPedido.mutateAsync(pedidoRequest)

      clearCart()
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
      <button type="button" onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>
      <h1 className="text-2xl font-bold text-ink">Checkout</h1>

      {!hasItems ? (
        <div className="mt-10 rounded-lg border border-line-subtle bg-surface-base p-6 text-center shadow-card-sm">
          <p className="text-sm font-medium text-ink">Tu carrito esta vacio</p>
          <Link
            to="/productos"
            className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-dim"
          >
            Ir al catalogo
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div>
              <h2 className="text-base font-semibold text-ink">Productos</h2>
              <ul className="mt-4 divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface-base">
                {items.map((item) => (
                  <li
                    key={`${item.productoId}-${(item.personalizacion?.ingredientesExcluidos ?? []).slice().sort().join('-')}`}
                    className="flex items-start justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{item.producto.nombre}</p>
                      <p className="mt-1 text-xs text-ink-muted">Cantidad: {item.cantidad}</p>
                      {formatExclusiones(item.personalizacion?.ingredientesExcluidos ?? []) && (
                        <p className="mt-1 text-xs text-ink-muted">
                          Sin {formatExclusiones(item.personalizacion?.ingredientesExcluidos ?? [])}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-ink">
                      {formatCurrency(item.producto.precio * item.cantidad)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-line-subtle bg-surface-base p-5 shadow-card-sm">
              <h2 className="text-base font-semibold text-ink">Entrega</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-subtle p-3 text-sm text-ink">
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
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-subtle p-3 text-sm text-ink">
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
                  <label htmlFor="direccionId" className="text-sm font-medium text-ink-muted">
                    Direccion
                  </label>
                  <select
                    id="direccionId"
                    value={direccionId}
                    onChange={(event) => setDireccionId(event.target.value)}
                    disabled={addressesQuery.isLoading}
                    className="mt-1 w-full rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink"
                  >
                    <option value="">Seleccionar direccion</option>
                    {direcciones.map((direccion) => (
                      <option key={direccion.id} value={direccion.id}>
                        {direccion.alias} - {direccion.linea1}
                      </option>
                    ))}
                  </select>
                  {!addressesQuery.isLoading && direcciones.length === 0 && (
                    <p className="mt-2 text-sm text-ink-muted">
                      No tenes direcciones cargadas.{' '}
                      <Link to="/direcciones" className="font-semibold text-brand hover:underline">
                        Crear direccion
                      </Link>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-line-subtle bg-surface-base p-5 shadow-card-sm">
              <h2 className="text-base font-semibold text-ink">Pago y notas</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="formaPago" className="text-sm font-medium text-ink-muted">
                    Forma de pago
                  </label>
                  <select
                    id="formaPago"
                    value={formaPagoCodigo}
                    onChange={(event) => setFormaPagoCodigo(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink"
                  >
                    {FORMAS_PAGO.map((forma) => (
                      <option key={forma.codigo} value={forma.codigo}>
                        {forma.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="notas" className="text-sm font-medium text-ink-muted">
                    Notas
                  </label>
                  <input
                    id="notas"
                    value={notas}
                    onChange={(event) => setNotas(event.target.value)}
                    maxLength={500}
                    className="mt-1 w-full rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            {showMercadoPagoPayment && isMercadoPago && (
              <MercadoPagoCheckoutPayment
                amount={checkoutTotal}
                pedido={pedidoRequest}
                onRejected={(message) => setRequestError(message)}
                onSuccess={(result) => {
                  clearCart()
                  startCheckoutPayment()
                  addToast({ type: 'success', message: 'Pedido creado correctamente.' })
                  navigate(`/pedidos/${result.pedido.id}/confirmacion`)
                }}
              />
            )}

            {requestError && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                {requestError}
              </div>
            )}

            {!pedidosHabilitados && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                El local no esta aceptando pedidos en este momento. Tu carrito se conserva para cuando se reanuden.
              </div>
            )}

            {hasBlockingIssues && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <h3 className="text-sm font-semibold text-warning">Revisa el carrito</h3>
                {resultado.errores.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-warning/80">
                    {resultado.errores.map((error) => (
                      <li key={`${error.productoId}-${error.tipo}`}>{error.mensaje}</li>
                    ))}
                  </ul>
                )}
                {resultado.preciosActualizados.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-warning/80">
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
            <div className="rounded-lg border border-line-subtle bg-surface-base p-6 shadow-card-sm">
              <h2 className="text-base font-semibold text-ink">Resumen</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Subtotal</span>
                  <span className="font-medium text-ink">{formatCurrency(subtotal())}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">Costo de envio</span>
                  <span className="font-medium text-ink">{formatCurrency(checkoutCostoEnvio)}</span>
                </div>
                <div className="border-t border-line-subtle pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-ink">Total</span>
                    <span className="text-lg font-bold text-brand">{formatCurrency(checkoutTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCrearPedido}
                disabled={isPending || !hasItems || !pedidosHabilitados || showMercadoPagoPayment}
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:bg-surface-higher disabled:text-ink-muted"
              >
                {isPending ? 'Validando...' : isMercadoPago ? 'Continuar al pago' : 'Crear pedido'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
