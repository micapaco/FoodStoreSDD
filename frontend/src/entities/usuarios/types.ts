export interface UsuarioListItem {
  id: number
  nombre: string
  apellido: string
  email: string
  roles: string[]
  activo: boolean
  created_at: string
}

export interface UsuarioDetailRead extends UsuarioListItem {
  telefono: string | null
  updated_at: string
}

export interface UsuarioListResponse {
  items: UsuarioListItem[]
  total: number
  page: number
  size: number
  pages: number
}

export interface UsuarioUpdateRequest {
  nombre: string
  apellido: string
  email: string
  telefono?: string | null
}

export interface CambiarRolesRequest {
  roles: string[]
}

export interface CambiarEstadoRequest {
  activo: boolean
}

export interface UsuariosListParams {
  q?: string
  rol?: string
  page: number
  size: number
}
