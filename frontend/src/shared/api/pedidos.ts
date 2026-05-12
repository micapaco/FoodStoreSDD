import api from '@/shared/api/axios'
import type {
  AvanzarEstadoPedidoRequest,
  CancelarPedidoRequest,
  ConfirmarPagoOfflineRequest,
  CrearPedidoRequest,
  PedidoAdminDetailRead,
  PedidoAdminListResponse,
  PedidoDetailRead,
  PedidoListResponse,
  PedidoRead,
  PedidosAdminParams,
  PedidosPropiosParams,
  ValidarCarritoRequest,
  ValidarCarritoResponse,
} from '@/entities/pedidos/types'

export async function validarCarritoApi(data: ValidarCarritoRequest): Promise<ValidarCarritoResponse> {
  const response = await api.post<ValidarCarritoResponse>('/pedidos/validar', data)
  return response.data
}

export async function crearPedidoApi(data: CrearPedidoRequest): Promise<PedidoRead> {
  const response = await api.post<PedidoRead>('/pedidos', data)
  return response.data
}

export async function obtenerPedidosPropiosApi(params: PedidosPropiosParams): Promise<PedidoListResponse> {
  const response = await api.get<PedidoListResponse>('/pedidos', { params })
  return response.data
}

export async function obtenerPedidoDetalleApi(pedidoId: number): Promise<PedidoDetailRead> {
  const response = await api.get<PedidoDetailRead>(`/pedidos/${pedidoId}`)
  return response.data
}

export async function obtenerPedidosAdminApi(params: PedidosAdminParams): Promise<PedidoAdminListResponse> {
  const response = await api.get<PedidoAdminListResponse>('/admin/pedidos', { params })
  return response.data
}

export async function obtenerPedidoAdminDetalleApi(pedidoId: number): Promise<PedidoAdminDetailRead> {
  const response = await api.get<PedidoAdminDetailRead>(`/admin/pedidos/${pedidoId}`)
  return response.data
}

export async function avanzarEstadoPedidoApi({
  pedidoId,
  nuevoEstado,
  motivo,
}: AvanzarEstadoPedidoRequest): Promise<PedidoRead> {
  const response = await api.patch<PedidoRead>(`/pedidos/${pedidoId}/estado`, {
    nuevoEstado,
    motivo,
  })
  return response.data
}

export async function cancelarPedidoApi({
  pedidoId,
  motivo,
}: CancelarPedidoRequest): Promise<PedidoRead> {
  const response = await api.delete<PedidoRead>(`/pedidos/${pedidoId}`, {
    data: { motivo },
  })
  return response.data
}

export async function confirmarPagoOfflineApi({
  pedidoId,
  motivo,
}: ConfirmarPagoOfflineRequest): Promise<PedidoRead> {
  const response = await api.post<PedidoRead>(`/pedidos/${pedidoId}/confirmar-pago-offline`, {
    motivo,
  })
  return response.data
}
