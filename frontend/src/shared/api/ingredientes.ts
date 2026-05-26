import api from '@/shared/api/axios'
import type {
  IngredienteCreate,
  IngredienteListResponse,
  IngredienteRead,
  IngredienteUpdate,
} from '@/entities/ingredientes/types'

export interface IngredienteListParams {
  page?: number
  size?: number
  alergeno?: boolean
  q?: string
}

export async function getIngredientes(
  params: IngredienteListParams = {},
): Promise<IngredienteListResponse> {
  const res = await api.get<IngredienteListResponse>('/ingredientes', { params })
  return res.data
}

export async function createIngrediente(
  data: IngredienteCreate,
): Promise<IngredienteRead> {
  const res = await api.post<IngredienteRead>('/ingredientes', data)
  return res.data
}

export async function updateIngrediente(
  id: number,
  data: IngredienteUpdate,
): Promise<IngredienteRead> {
  const res = await api.put<IngredienteRead>(`/ingredientes/${id}`, data)
  return res.data
}

export async function deleteIngrediente(id: number): Promise<void> {
  await api.delete(`/ingredientes/${id}`)
}
