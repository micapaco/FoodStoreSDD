import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { loginApi, registerApi, logoutApi, meApi } from '@/shared/api/auth'
import type { LoginPayload, RegisterPayload } from '@/shared/api/auth'
import { getSafeUserRoles, useAuthStore } from '@/shared/stores/authStore'

export function useLogin() {
  const { login, updateTokens } = useAuthStore()

  return useMutation({
    mutationFn: async (data: LoginPayload) => {
      const tokens = await loginApi(data)
      // Set tokens first so the /me request is authenticated via the interceptor
      updateTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
      const user = await meApi()
      return { tokens, user }
    },
    onSuccess: ({ tokens, user }) => {
      login(
        { accessToken: tokens.access_token, refreshToken: tokens.refresh_token },
        {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          telefono: user.telefono,
          email: user.email,
          roles: getSafeUserRoles(user),
        },
      )
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterPayload) => registerApi(data),
  })
}

export function useLogout() {
  const { logoutAndRedirect, refreshToken } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        // Best-effort — server-side token revocation; proceed even if it fails
        await logoutApi(refreshToken).catch(() => undefined)
      }
    },
    onSettled: () => {
      // Always clear client state regardless of server response
      logoutAndRedirect('/')
    },
  })
}

export function useRehydrateUser() {
  const { accessToken, refreshToken, login } = useAuthStore()

  useEffect(() => {
    if (!accessToken) return
    meApi()
      .then((user) => {
        if (refreshToken) {
          login(
            { accessToken, refreshToken },
            {
              id: user.id,
              nombre: user.nombre,
              apellido: user.apellido,
              telefono: user.telefono,
              email: user.email,
              roles: getSafeUserRoles(user),
            },
          )
        }
      })
      .catch(() => {
        // 401 handled by Axios interceptor (refresh or logout)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
