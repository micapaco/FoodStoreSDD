import api from '@/shared/api/axios'
import type {
  CrearPagoRequest,
  CrearPedidoMercadoPagoRequest,
  CrearPreferenciaPayload,
  PagoRead,
  PagoStatusResponse,
  PedidoMercadoPagoResponse,
  PreferenciaResponse,
} from '@/entities/pagos/types'

export async function crearPagoApi(data: CrearPagoRequest): Promise<PagoRead> {
  const response = await api.post<PagoRead>('/pagos/crear', data)
  return response.data
}

export async function crearPedidoMercadoPagoApi(
  data: CrearPedidoMercadoPagoRequest,
): Promise<PedidoMercadoPagoResponse> {
  const response = await api.post<PedidoMercadoPagoResponse>('/pagos/checkout', data)
  return response.data
}

export async function obtenerPagoStatusApi(pedidoId: number): Promise<PagoStatusResponse> {
  const response = await api.get<PagoStatusResponse>(`/pagos/${pedidoId}`)
  return response.data
}

export async function crearPreferenciaMercadoPagoApi(
  data: CrearPreferenciaPayload,
): Promise<PreferenciaResponse> {
  const response = await api.post<PreferenciaResponse>('/pagos/preferencia', data)
  return response.data
}
