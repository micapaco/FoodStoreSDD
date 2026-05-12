import axiosInstance from '@/shared/api/axios'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'
import { parseHttpError } from './parseHttpError'

let installed = false

/**
 * Installs a global response interceptor on the axios instance.
 * Must be called ONCE before React mounts (from main.tsx).
 * Idempotent — subsequent calls are no-ops.
 *
 * Handles:
 *  - 403 → toast error "No tenés permiso para esta acción"
 *  - 5xx → toast error "Error del servidor, intentá de nuevo"
 *  - NETWORK → toast error "Sin conexión con el servidor"
 *  - Refresh failure path: authStore.logout() is already called by axios.ts;
 *    this handler catches that case and publishes a warning toast.
 *
 * Silently passes through:
 *  - 401 with successful refresh (the existing interceptor retried the request)
 *  - 422 validation errors (handled per-feature at field level)
 */
export function installErrorHandler(): void {
  if (installed) return
  installed = true

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const { addToast } = useUiStore.getState()
      const { isAuthenticated } = useAuthStore.getState()
      const parsed = parseHttpError(error)

      switch (parsed.code) {
        case 'NETWORK':
          addToast({ type: 'error', message: 'Sin conexión con el servidor' })
          break

        case 'FORBIDDEN':
          addToast({ type: 'error', message: 'No tenés permiso para esta acción' })
          break

        case 'SERVER_ERROR':
          addToast({ type: 'error', message: parsed.message })
          break

        case 'UNAUTHORIZED': {
          // 401 is handled by the refresh interceptor in axios.ts.
          // If we reach here AND the user is no longer authenticated,
          // the refresh failed — the existing interceptor already called logout().
          // Publish the "session expired" warning toast.
          // Exception: login attempts (no refresh token) set _skipGlobalToast so we
          // don't show "Tu sesión expiró" for plain wrong-credentials errors.
          const skipToast = !!(error as { _skipGlobalToast?: boolean })?._skipGlobalToast
          if (!isAuthenticated && !skipToast) {
            addToast({ type: 'warning', message: 'Tu sesión expiró' })
          }
          break
        }

        case 'VALIDATION':
          // 422: feature handles field-level errors — no global toast.
          break

        default:
          // UNKNOWN and other codes: silently propagate.
          break
      }

      return Promise.reject(error)
    },
  )
}
