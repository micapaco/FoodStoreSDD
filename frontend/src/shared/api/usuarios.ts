import api from '@/shared/api/axios'
import type {
  CambiarEstadoRequest,
  CambiarRolesRequest,
  UsuarioDetailRead,
  UsuarioListResponse,
  UsuariosListParams,
  UsuarioUpdateRequest,
} from '@/entities/usuarios/types'

export async function listarUsuariosApi(params: UsuariosListParams): Promise<UsuarioListResponse> {
  const response = await api.get<UsuarioListResponse>('/admin/usuarios', { params })
  return response.data
}

export async function obtenerUsuarioApi(id: number): Promise<UsuarioDetailRead> {
  const response = await api.get<UsuarioDetailRead>(`/admin/usuarios/${id}`)
  return response.data
}

export async function editarUsuarioApi(id: number, data: UsuarioUpdateRequest): Promise<UsuarioDetailRead> {
  const response = await api.put<UsuarioDetailRead>(`/admin/usuarios/${id}`, data)
  return response.data
}

export async function cambiarRolesApi(id: number, data: CambiarRolesRequest): Promise<UsuarioDetailRead> {
  const response = await api.patch<UsuarioDetailRead>(`/admin/usuarios/${id}/roles`, data)
  return response.data
}

export async function cambiarEstadoApi(id: number, data: CambiarEstadoRequest): Promise<UsuarioDetailRead> {
  const response = await api.patch<UsuarioDetailRead>(`/admin/usuarios/${id}/estado`, data)
  return response.data
}
