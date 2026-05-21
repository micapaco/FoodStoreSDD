import api from '@/shared/api/axios'
import type { PedidoCocinaRead } from '@/entities/cocina/types'

export async function getCocinaOrdersActive(): Promise<PedidoCocinaRead[]> {
  const response = await api.get<PedidoCocinaRead[]>('/cocina/pedidos')
  return response.data
}
