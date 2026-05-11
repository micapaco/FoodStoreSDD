import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { meApi } from '@/shared/api/auth'
import { updateProfileApi, changePasswordApi } from '@/shared/api/profile'
import type { UpdateProfilePayload, ChangePasswordPayload } from '@/shared/api/profile'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'

const PROFILE_KEY = ['profile', 'me'] as const

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: meApi,
    staleTime: 5 * 60 * 1000, // 5 min — perfil no cambia frecuentemente
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { login } = useAuthStore()
  const { addToast } = useUiStore()

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => updateProfileApi(data),
    onSuccess: (user) => {
      // Refrescar la cache del perfil
      queryClient.setQueryData(PROFILE_KEY, user)

      // Sincronizar authStore con datos actualizados (nombre, apellido, telefono, email)
      const { accessToken, refreshToken } = useAuthStore.getState()
      if (accessToken && refreshToken) {
        login(
          { accessToken, refreshToken },
          {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            telefono: user.telefono ?? null,
            email: user.email,
            roles: user.roles,
          },
        )
      }

      addToast({ message: 'Perfil actualizado correctamente.', type: 'success' })
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail
      addToast({ message: detail ?? 'Error al actualizar el perfil. Intentá de nuevo.', type: 'error' })
    },
  })
}

export function useChangePassword() {
  const { addToast } = useUiStore()

  return useMutation({
    mutationFn: (data: ChangePasswordPayload) => changePasswordApi(data),
    onSuccess: () => {
      addToast({ message: 'Contraseña actualizada correctamente.', type: 'success' })
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail
      if (detail) {
        addToast({ message: detail, type: 'error' })
      } else {
        addToast({ message: 'Error al cambiar la contraseña. Intentá de nuevo.', type: 'error' })
      }
    },
  })
}
