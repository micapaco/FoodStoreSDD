import api from '@/shared/api/axios'
import type { ValidarCarritoRequest, ValidarCarritoResponse } from '@/entities/pedidos/types'

export async function validarCarritoApi(data: ValidarCarritoRequest): Promise<ValidarCarritoResponse> {
  const response = await api.post<ValidarCarritoResponse>('/pedidos/validar', data)
  return response.data
}
