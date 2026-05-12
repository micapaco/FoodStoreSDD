import api from '@/shared/api/axios'
import type {
  CrearPedidoRequest,
  PedidoRead,
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
