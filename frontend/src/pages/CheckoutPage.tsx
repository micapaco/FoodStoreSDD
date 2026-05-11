import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ValidarCarritoResponse } from '@/entities/pedidos/types'
import { useValidarCheckout } from '@/shared/hooks/useValidarCheckout'
import { useCartStore } from '@/shared/stores/cartStore'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
}

export function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal)
  const costoEnvio = useCartStore((s) => s.costoEnvio)
  const total = useCartStore((s) => s.total)
  const validarCheckout = useValidarCheckout()
  const [resultado, setResultado] = useState<ValidarCarritoResponse | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)

  const handleValidar = async () => {
    setRequestError(null)
    setResultado(null)

    const request = {
      items: items.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioEsperado: item.producto.precio,
        exclusiones: item.personalizacion.ingredientesExcluidos,
      })),
    }

    try {
      const response = await validarCheckout.mutateAsync(request)
      setResultado(response)
    } catch {
      setRequestError('No se pudo validar el carrito. Intentá nuevamente.')
    }
  }

  const hasItems = items.length > 0
  const hasBlockingIssues = resultado && !resultado.valido

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      {!hasItems ? (
        <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">Tu carrito está vacío</p>
          <Link
            to="/productos"
            className="mt-4 inline-flex rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
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

            {requestError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {requestError}
              </div>
            )}

            {hasBlockingIssues && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-900">Revisá el carrito</h3>
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
                        El producto #{precio.productoId} cambió de{' '}
                        {formatCurrency(precio.precioViejo)} a {formatCurrency(precio.precioNuevo)}.
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {resultado?.valido && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                Carrito validado.
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
                  <span className="text-gray-600">Costo de envío</span>
                  <span className="font-medium text-gray-900">{formatCurrency(costoEnvio())}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(total())}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleValidar}
                disabled={validarCheckout.isPending || !hasItems}
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {validarCheckout.isPending ? 'Validando...' : 'Validar carrito'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
