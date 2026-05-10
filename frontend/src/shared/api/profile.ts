import api from '@/shared/api/axios'
import type { UserResponse } from '@/shared/api/auth'

export interface UpdateProfilePayload {
  nombre: string
  apellido: string
  email: string
  telefono: string | null
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  confirm_password: string
}

export async function updateProfileApi(data: UpdateProfilePayload): Promise<UserResponse> {
  const res = await api.put<UserResponse>('/auth/me', data)
  return res.data
}

export async function changePasswordApi(data: ChangePasswordPayload): Promise<{ message: string }> {
  const res = await api.put<{ message: string }>('/auth/change-password', data)
  return res.data
}
