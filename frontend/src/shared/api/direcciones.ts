import api from '@/shared/api/axios'
import type {
  DireccionCreate,
  DireccionRead,
  DireccionUpdate,
  DireccionesPaginatedResponse,
} from '@/entities/direcciones/types'

export async function getDirecciones(params: {
  page: number
  page_size: number
}): Promise<DireccionesPaginatedResponse> {
  const res = await api.get<DireccionesPaginatedResponse>('/direcciones', { params })
  return res.data
}

export async function createDireccion(data: DireccionCreate): Promise<DireccionRead> {
  const res = await api.post<DireccionRead>('/direcciones', data)
  return res.data
}

export async function updateDireccion(id: number, data: DireccionUpdate): Promise<DireccionRead> {
  const res = await api.put<DireccionRead>(`/direcciones/${id}`, data)
  return res.data
}

export async function deleteDireccion(id: number): Promise<void> {
  await api.delete(`/direcciones/${id}`)
}

export async function setDireccionPrincipal(id: number): Promise<DireccionRead> {
  const res = await api.patch<DireccionRead>(`/direcciones/${id}/principal`)
  return res.data
}
