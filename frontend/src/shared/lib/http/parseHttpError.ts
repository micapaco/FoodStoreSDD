import axios from 'axios'
import type { AppHttpError } from '@/shared/types/http'

/**
 * Normalizes any error (AxiosError, runtime Error, unknown) to a stable AppHttpError shape.
 * Pure function — no side effects.
 */
export function parseHttpError(error: unknown): AppHttpError {
  if (axios.isAxiosError(error)) {
    // Network error — request never reached the server
    if (!error.response) {
      return {
        status: 0,
        code: 'NETWORK',
        message: 'Sin conexión con el servidor',
        detail: error,
      }
    }

    const { status, data } = error.response

    if (status === 401) {
      return {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Tu sesión expiró',
        detail: data,
      }
    }

    if (status === 403) {
      return {
        status: 403,
        code: 'FORBIDDEN',
        message: 'No tenés permiso para esta acción',
        detail: data,
      }
    }

    if (status === 404) {
      return {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Recurso no encontrado',
        detail: data,
      }
    }

    if (status === 422) {
      // Backend detail can be a string or FastAPI validation array
      const backendMessage =
        typeof data?.detail === 'string'
          ? data.detail
          : 'Datos inválidos — revisá los campos'
      return {
        status: 422,
        code: 'VALIDATION',
        message: backendMessage,
        detail: data,
      }
    }

    if (status >= 500 && status <= 599) {
      const backendMessage =
        status === 502 && typeof data?.detail === 'string'
          ? data.detail
          : 'Error del servidor, intentá de nuevo'
      return {
        status,
        code: 'SERVER_ERROR',
        message: backendMessage,
        detail: data,
      }
    }

    // Catch-all for other HTTP error codes
    return {
      status,
      code: 'UNKNOWN',
      message: error.message ?? 'Ocurrió un error inesperado',
      detail: data,
    }
  }

  // Non-Axios errors (runtime Error, string, etc.)
  const message =
    error instanceof Error ? error.message : 'Ocurrió un error inesperado'

  return {
    status: 0,
    code: 'UNKNOWN',
    message,
    detail: error,
  }
}
