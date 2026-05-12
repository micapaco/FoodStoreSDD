import { useEffect, useRef, useState } from 'react'
import {
  useAvanzarEstadoPedido,
  useCancelarPedido,
  useConfirmarPagoOffline,
  usePedidoAdminDetalle,
  usePedidosAdmin,
} from '@/shared/hooks/usePedidos'
import { parseHttpError } from '@/shared/lib/http/parseHttpError'
import { useUiStore } from '@/shared/stores/uiStore'
import type { EstadoPedidoOperativo } from '@/entities/pedidos/types'

const ESTADOS = ['', 'PENDIENTE', 'CONFIRMADO', 'EN_PREP', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO']
const NEXT_STATE: Partial<Record<EstadoPedidoOperativo, EstadoPedidoOperativo>> = {
  CONFIRMADO: 'EN_PREP',
  EN_PREP: 'EN_CAMINO',
  EN_CAMINO: 'ENTREGADO',
}

function nextStateLabel(estado: EstadoPedidoOperativo): string | null {
  const nextState = NEXT_STATE[estado]
  if (!nextState) return null

  const labels: Record<Exclude<EstadoPedidoOperativo, 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO'>, string> = {
    EN_PREP: 'Pasar a preparacion',
    EN_CAMINO: 'Marcar en camino',
    ENTREGADO: 'Marcar entregado',
  }

  return labels[nextState as keyof typeof labels]
}

function canCancel(estado: EstadoPedidoOperativo): boolean {
  return estado === 'PENDIENTE' || estado === 'CONFIRMADO' || estado === 'EN_PREP'
}

function canConfirmOffline(estado: EstadoPedidoOperativo, formaPagoCodigo: string): boolean {
  return estado === 'PENDIENTE' && (formaPagoCodigo === 'EFECTIVO' || formaPagoCodigo === 'TRANSFERENCIA')
}

function describePaymentStatus(
  formaPagoCodigo: string,
  estado: EstadoPedidoOperativo,
  mpStatus?: string | null,
): string {
  if (formaPagoCodigo === 'MERCADOPAGO') {
    return mpStatus ?? 'Sin intento'
  }
  if (estado === 'PENDIENTE') {
    return 'Pendiente de validacion operativa'
  }
  if (estado === 'CONFIRMADO') {
    return 'Pago offline validado'
  }
  return 'Gestionado fuera de MercadoPago'
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value))
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function OrdersAdminPage() {
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addToast = useUiStore((state) => state.addToast)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const { data, isLoading, isError, error, refetch, isFetching } = usePedidosAdmin({
    page,
    size: 20,
    estado: estado || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
    q: debouncedSearch || undefined,
  })
  const detailQuery = usePedidoAdminDetalle(selectedPedidoId)
  const advanceMutation = useAvanzarEstadoPedido()
  const cancelMutation = useCancelarPedido()
  const confirmOfflineMutation = useConfirmarPagoOffline()
  const parsedListError = error ? parseHttpError(error) : null
  const parsedDetailError = detailQuery.error ? parseHttpError(detailQuery.error) : null
  const selectedEstado = detailQuery.data?.estadoCodigo as EstadoPedidoOperativo | undefined
  const nextEstado = selectedEstado ? NEXT_STATE[selectedEstado] : undefined
  const actionBusy = advanceMutation.isPending || cancelMutation.isPending || confirmOfflineMutation.isPending

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedSearch(value.trim()), 300)
  }

  const handleAdvance = () => {
    if (!selectedPedidoId || !nextEstado) return

    advanceMutation.mutate(
      { pedidoId: selectedPedidoId, nuevoEstado: nextEstado as 'EN_PREP' | 'EN_CAMINO' | 'ENTREGADO' },
      {
        onSuccess: () => addToast({ type: 'success', message: 'Estado actualizado correctamente.' }),
        onError: (mutationError) => addToast({ type: 'error', message: parseHttpError(mutationError).message }),
      },
    )
  }

  const handleCancel = () => {
    const motivo = cancelReason.trim()
    if (!selectedPedidoId || !selectedEstado || !canCancel(selectedEstado)) return
    if (!motivo) {
      addToast({ type: 'warning', message: 'Ingresa un motivo para cancelar el pedido.' })
      return
    }

    cancelMutation.mutate(
      { pedidoId: selectedPedidoId, motivo },
      {
        onSuccess: () => {
          setCancelReason('')
          addToast({ type: 'success', message: 'Pedido cancelado correctamente.' })
        },
        onError: (mutationError) => addToast({ type: 'error', message: parseHttpError(mutationError).message }),
      },
    )
  }

  const handleConfirmOffline = () => {
    if (!selectedPedidoId || !detailQuery.data || !selectedEstado) return
    if (!canConfirmOffline(selectedEstado, detailQuery.data.formaPagoCodigo)) return

    confirmOfflineMutation.mutate(
      { pedidoId: selectedPedidoId },
      {
        onSuccess: () => addToast({ type: 'success', message: 'Pago offline confirmado correctamente.' }),
        onError: (mutationError) => addToast({ type: 'error', message: parseHttpError(mutationError).message }),
      },
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion de pedidos</h1>
        <p className="mt-1 text-sm text-gray-500">Vista operativa para revisar pedidos y su trazabilidad.</p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
        <input
          type="search"
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Buscar por pedido o cliente"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={estado}
          onChange={(event) => {
            setEstado(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {ESTADOS.map((option) => (
            <option key={option || 'todos'} value={option}>
              {option || 'Todos los estados'}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={desde}
          onChange={(event) => {
            setDesde(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={hasta}
          onChange={(event) => {
            setHasta(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {isError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p>{parsedListError?.message ?? 'No se pudieron cargar los pedidos.'}</p>
          <button type="button" onClick={() => refetch()} className="mt-3 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white">
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      {Array.from({ length: 5 }).map((__, cell) => (
                        <td key={cell} className="px-4 py-4">
                          <div className="h-4 rounded bg-gray-200" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isLoading &&
                  data?.items.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        <p className="font-semibold text-gray-900">#{pedido.id}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatDate(pedido.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <p className="font-medium text-gray-900">{pedido.clienteNombre}</p>
                        <p className="mt-1 text-xs text-gray-500">{pedido.clienteEmail}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-800">{pedido.estadoCodigo}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-orange-600">{formatCurrency(pedido.total)}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPedidoId(pedido.id)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center text-sm text-gray-500">
                      No hay pedidos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.total > data.size && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">
                Pagina {data.page} de {data.pages}{isFetching ? ' (actualizando...)' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={data.page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={data.page >= data.pages}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-gray-200 bg-white p-5">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Detalle operativo</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              {selectedPedidoId ? `Pedido #${selectedPedidoId}` : 'Selecciona un pedido'}
            </h2>
          </div>

          {!selectedPedidoId && (
            <p className="mt-5 text-sm text-gray-600">El detalle mostrara cliente, pago e historial.</p>
          )}

          {selectedPedidoId && detailQuery.isLoading && (
            <div className="mt-5 space-y-3 animate-pulse">
              <div className="h-5 rounded bg-gray-200" />
              <div className="h-20 rounded bg-gray-200" />
              <div className="h-28 rounded bg-gray-200" />
            </div>
          )}

          {selectedPedidoId && detailQuery.isError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {parsedDetailError?.message ?? 'No se pudo cargar el detalle.'}
            </div>
          )}

          {detailQuery.data && (
            <div className="mt-5 space-y-5 text-sm">
              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {detailQuery.data.cliente.nombre} {detailQuery.data.cliente.apellido}
                </p>
                <p className="text-gray-600">{detailQuery.data.cliente.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500">Estado</p>
                  <p className="mt-1 font-semibold text-gray-900">{detailQuery.data.estadoCodigo}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="mt-1 font-semibold text-orange-600">{formatCurrency(detailQuery.data.total)}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Pago</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {describePaymentStatus(
                    detailQuery.data.formaPagoCodigo,
                    selectedEstado ?? 'PENDIENTE',
                    detailQuery.data.pago?.mpStatus,
                  )}
                </p>
                {detailQuery.data.pago?.statusDetail && <p className="text-gray-600">{detailQuery.data.pago.statusDetail}</p>}
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-gray-500">Acciones operativas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedEstado && canConfirmOffline(selectedEstado, detailQuery.data.formaPagoCodigo) && (
                    <button
                      type="button"
                      onClick={handleConfirmOffline}
                      disabled={actionBusy}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Confirmar pago offline
                    </button>
                  )}
                  {selectedEstado && nextEstado && (
                    <button
                      type="button"
                      onClick={handleAdvance}
                      disabled={actionBusy}
                      className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {nextStateLabel(selectedEstado)}
                    </button>
                  )}
                  {selectedEstado && canCancel(selectedEstado) && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={actionBusy}
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar pedido
                    </button>
                  )}
                </div>
                {selectedEstado && canCancel(selectedEstado) && (
                  <label className="mt-3 block">
                    <span className="text-xs font-semibold uppercase text-gray-500">Motivo de cancelacion</span>
                    <textarea
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      rows={3}
                      maxLength={500}
                      disabled={actionBusy}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
                      placeholder="Describe brevemente por que se cancela."
                    />
                  </label>
                )}
                {selectedEstado && !nextEstado && !canCancel(selectedEstado) && (
                  <p className="mt-3 text-xs text-gray-500">No hay acciones disponibles para este estado.</p>
                )}
              </div>
              <div>
                <p className="text-gray-500">Items</p>
                <ul className="mt-2 space-y-2">
                  {detailQuery.data.items.map((item, index) => (
                    <li key={`${item.productoId ?? 'snapshot'}-${index}`} className="rounded-lg bg-gray-50 p-3">
                      <p className="font-semibold text-gray-900">{item.nombreSnapshot}</p>
                      <p className="mt-1 text-gray-600">Cantidad {item.cantidad}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-gray-500">Historial</p>
                <ol className="mt-2 space-y-3">
                  {detailQuery.data.historial.map((entry) => (
                    <li key={entry.id} className="border-l-2 border-orange-200 pl-3">
                      <p className="font-medium text-gray-900">
                        {entry.estadoDesde ?? 'Inicio'} - {entry.estadoHasta}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(entry.createdAt)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
