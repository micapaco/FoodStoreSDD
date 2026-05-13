import api from '@/shared/api/axios'
import type {
  ConfigListResponse,
  ConfigParametro,
  ConfigPublicaResponse,
  ConfigUpdateRequest,
} from '@/entities/config/types'

export async function getConfigAdminApi(): Promise<ConfigListResponse> {
  const response = await api.get<ConfigListResponse>('/admin/configuracion')
  return response.data
}

export async function updateConfigApi(
  clave: string,
  data: ConfigUpdateRequest,
): Promise<ConfigParametro> {
  const response = await api.put<ConfigParametro>(`/admin/configuracion/${clave}`, data)
  return response.data
}

export async function getConfigPublicaApi(): Promise<ConfigPublicaResponse> {
  const response = await api.get<ConfigPublicaResponse>('/configuracion/publica')
  return response.data
}
