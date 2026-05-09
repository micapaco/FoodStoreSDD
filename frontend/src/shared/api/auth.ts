import api from '@/shared/api/axios'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  nombre: string
  apellido: string
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface UserResponse {
  id: number
  nombre: string
  apellido: string
  email: string
  roles: string[]
  created_at: string
}

export async function loginApi(data: LoginPayload): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>('/auth/login', data)
  return res.data
}

export async function registerApi(data: RegisterPayload): Promise<UserResponse> {
  const res = await api.post<UserResponse>('/auth/register', data)
  return res.data
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refresh_token: refreshToken })
}

export async function meApi(): Promise<UserResponse> {
  const res = await api.get<UserResponse>('/auth/me')
  return res.data
}
