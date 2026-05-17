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

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:  'bg-warning/20 text-warning',
  CONFIRMADO: 'bg-success/20 text-success',
  EN_PREP:    'bg-brand/20 text-brand',
  EN_CAMINO:  'bg-success/30 text-success',
  ENTREGADO:  'bg-success/20 text-success',
  CANCELADO:  'bg-danger/20 text-danger',
}

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${ESTADO_COLORS[estado] ?? 'bg-surface-high text-ink-muted'}`}>
      {estado}
    </span>
  )
}
function resolveNextState(
  estado: EstadoPedidoOperativo,
  isPickup: boolean,
): EstadoPedidoOperativo | undefined {
  if (estado === 'CONFIRMADO') return 'EN_PREP'
  if (estado === 'EN_PREP') return isPickup ? 'ENTREGADO' : 'EN_CAMINO'
  if (estado === 'EN_CAMINO') return 'ENTREGADO'
  return undefined
}

function nextStateLabel(
  estado: EstadoPedidoOperativo,
  isPickup: boolean,
): string | null {
  const nextState = resolveNextState(estado, isPickup)
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

function formatPaymentMethod(codigo: string): string {
  switch (codigo) {
    case 'MERCADOPAGO': return 'MercadoPago'
    case 'EFECTIVO': return 'Efectivo'
    case 'TRANSFERENCIA': return 'Transferencia'
    default: return codigo
  }
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

function formatExclusiones(item: { personalizacion: number[]; personalizacionDetalle: { nombre: string }[] }): string | null {
  if (item.personalizacionDetalle.length > 0) {
    return item.personalizacionDetalle.map((exclusion) => exclusion.nombre).join(', ')
  }
  if (item.personalizacion.length > 0) {
    return item.personalizacion.map((id) => `Ingrediente #${id}`).join(', ')
  }
  return null
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
  const selectedPedidoIsPickup = detailQuery.data?.direccionSnapshot === null
  const nextEstado = selectedEstado ? resolveNextState(selectedEstado, selectedPedidoIsPickup) : undefined
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
        <h1 className="text-2xl font-bold text-ink">Gestion de pedidos</h1>
        <p className="mt-1 text-sm text-ink-muted">Vista operativa para revisar pedidos y su trazabilidad.</p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
        <input
          type="search"
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Buscar por pedido o cliente"
          className="rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        <select
          value={estado}
          onChange={(event) => {
            setEstado(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink"
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
          className="rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink"
        />
        <input
          type="date"
          value={hasta}
          onChange={(event) => {
            setHasta(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink"
        />
      </div>

      {isError && (
        <div className="mt-6 rounded-lg border border-danger/30 bg-danger/10 p-5 text-sm text-danger">
          <p>{parsedListError?.message ?? 'No se pudieron cargar los pedidos.'}</p>
          <button type="button" onClick={() => refetch()} className="mt-3 rounded-lg bg-danger-container px-4 py-2 font-semibold text-danger">
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="overflow-hidden rounded-lg border border-line-subtle bg-surface-base">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line-subtle">
              <thead className="bg-surface-low">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-ink-muted">Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-ink-muted">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-ink-muted">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-ink-muted">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-ink-muted">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {isLoading &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      {Array.from({ length: 5 }).map((__, cell) => (
                        <td key={cell} className="px-4 py-4">
                          <div className="h-4 rounded bg-surface-higher" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isLoading &&
                  data?.items.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-surface-high">
                      <td className="px-4 py-4 text-sm">
                        <p className="font-semibold text-ink">#{pedido.id}</p>
                        <p className="mt-1 whitespace-nowrap text-xs text-ink-muted">{formatDate(pedido.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <p className="font-medium text-ink">{pedido.clienteNombre}</p>
                        <p className="mt-1 text-xs text-ink-muted">{pedido.clienteEmail}</p>
                      </td>
                      <td className="px-4 py-4"><EstadoBadge estado={pedido.estadoCodigo} /></td>
                      <td className="px-4 py-4 text-sm">
                        <p className="font-semibold text-brand">{formatCurrency(pedido.total)}</p>
                        <p className="mt-1 text-xs text-ink-muted">{formatPaymentMethod(pedido.formaPagoCodigo)}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPedidoId(pedido.id)}
                          className="rounded-lg border border-line-subtle px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-high"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center text-sm text-ink-muted">
                      No hay pedidos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.total > data.size && (
            <div className="flex items-center justify-between border-t border-line-subtle px-4 py-3">
              <p className="text-sm text-ink-muted">
                Pagina {data.page} de {data.pages}{isFetching ? ' (actualizando...)' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={data.page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="rounded-lg border border-line-subtle px-3 py-2 text-sm text-ink hover:bg-surface-high disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={data.page >= data.pages}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-lg border border-line-subtle px-3 py-2 text-sm text-ink hover:bg-surface-high disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-line-subtle bg-surface-base p-5">
          <div>
            <p className="text-xs font-semibold uppercase text-ink-muted">Detalle operativo</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">
              {selectedPedidoId ? `Pedido #${selectedPedidoId}` : 'Selecciona un pedido'}
            </h2>
          </div>

          {!selectedPedidoId && (
            <p className="mt-5 text-sm text-ink-muted">El detalle mostrara cliente, pago e historial.</p>
          )}

          {selectedPedidoId && detailQuery.isLoading && (
            <div className="mt-5 space-y-3 animate-pulse">
              <div className="h-5 rounded bg-surface-higher" />
              <div className="h-20 rounded bg-surface-higher" />
              <div className="h-28 rounded bg-surface-higher" />
            </div>
          )}

          {selectedPedidoId && detailQuery.isError && (
            <div className="mt-5 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
              {parsedDetailError?.message ?? 'No se pudo cargar el detalle.'}
            </div>
          )}

          {detailQuery.data && (
            <div className="mt-5 space-y-5 text-sm">
              <div>
                <p className="text-ink-muted">Cliente</p>
                <p className="mt-1 font-semibold text-ink">
                  {detailQuery.data.cliente.nombre} {detailQuery.data.cliente.apellido}
                </p>
                <p className="text-ink-muted">{detailQuery.data.cliente.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-ink-muted">Estado</p>
                  <div className="mt-1"><EstadoBadge estado={detailQuery.data.estadoCodigo} /></div>
                </div>
                <div>
                  <p className="text-ink-muted">Total</p>
                  <p className="mt-1 font-semibold text-brand">{formatCurrency(detailQuery.data.total)}</p>
                </div>
              </div>
              <div>
                <p className="text-ink-muted">Entrega</p>
                <p className="mt-1 font-semibold text-ink">
                  {selectedPedidoIsPickup ? 'Retiro en local' : 'Envio a domicilio'}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Método de pago</p>
                <p className="mt-1 font-semibold text-ink">
                  {formatPaymentMethod(detailQuery.data.formaPagoCodigo)}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Estado del pago</p>
                <p className="mt-1 font-semibold text-ink">
                  {describePaymentStatus(
                    detailQuery.data.formaPagoCodigo,
                    selectedEstado ?? 'PENDIENTE',
                    detailQuery.data.pago?.mpStatus,
                  )}
                </p>
                {detailQuery.data.pago?.statusDetail && <p className="text-ink-muted">{detailQuery.data.pago.statusDetail}</p>}
              </div>
              <div className="rounded-lg border border-line-subtle bg-surface-low p-4">
                <p className="text-ink-muted">Acciones operativas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedEstado && canConfirmOffline(selectedEstado, detailQuery.data.formaPagoCodigo) && (
                    <button
                      type="button"
                      onClick={handleConfirmOffline}
                      disabled={actionBusy}
                      className="rounded-lg bg-success px-3 py-2 text-sm font-semibold text-success-on hover:bg-success/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Confirmar pago offline
                    </button>
                  )}
                  {selectedEstado && nextEstado && (
                    <button
                      type="button"
                      onClick={handleAdvance}
                      disabled={actionBusy}
                      className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-on hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {nextStateLabel(selectedEstado, selectedPedidoIsPickup)}
                    </button>
                  )}
                  {selectedEstado && canCancel(selectedEstado) && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={actionBusy}
                      className="rounded-lg border border-danger/30 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar pedido
                    </button>
                  )}
                </div>
                {selectedEstado && canCancel(selectedEstado) && (
                  <label className="mt-3 block">
                    <span className="text-xs font-semibold uppercase text-ink-muted">Motivo de cancelacion</span>
                    <textarea
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      rows={3}
                      maxLength={500}
                      disabled={actionBusy}
                      className="mt-2 w-full rounded-lg border border-line-subtle bg-surface-base px-3 py-2 text-sm text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:bg-surface-high"
                      placeholder="Describe brevemente por que se cancela."
                    />
                  </label>
                )}
                {selectedEstado && !nextEstado && !canCancel(selectedEstado) && (
                  <p className="mt-3 text-xs text-ink-muted">No hay acciones disponibles para este estado.</p>
                )}
              </div>
              <div>
                <p className="text-ink-muted">Items</p>
                <ul className="mt-2 space-y-2">
                  {detailQuery.data.items.map((item, index) => (
                    <li key={`${item.productoId ?? 'snapshot'}-${index}`} className="rounded-lg bg-surface-low p-3">
                      <p className="font-semibold text-ink">{item.nombreSnapshot}</p>
                      <p className="mt-1 text-ink-muted">Cantidad {item.cantidad}</p>
                      {formatExclusiones(item) && (
                        <p className="mt-1 text-ink-muted">Sin {formatExclusiones(item)}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-ink-muted">Historial</p>
                <ol className="mt-2 space-y-3">
                  {detailQuery.data.historial.map((entry) => (
                    <li key={entry.id} className="border-l-2 border-brand/30 pl-3">
                      <p className="font-medium text-ink">
                        {entry.estadoDesde ?? 'Inicio'} - {entry.estadoHasta}
                      </p>
                      <p className="text-xs text-ink-muted">{formatDate(entry.createdAt)}</p>
                      {entry.motivo && <p className="mt-1 text-xs text-ink-muted">{entry.motivo}</p>}
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
