import api from '@/shared/api/axios'
import type { CrearPagoRequest, PagoRead, PagoStatusResponse } from '@/entities/pagos/types'

export async function crearPagoApi(data: CrearPagoRequest): Promise<PagoRead> {
  const response = await api.post<PagoRead>('/pagos/crear', data)
  return response.data
}

export async function obtenerPagoStatusApi(pedidoId: number): Promise<PagoStatusResponse> {
  const response = await api.get<PagoStatusResponse>(`/pagos/${pedidoId}`)
  return response.data
}
