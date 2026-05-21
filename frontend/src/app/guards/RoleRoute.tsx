import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/authStore'

interface RoleRouteProps {
  roles: string[]
}

/**
 * Guard: renders <Outlet /> when the authenticated user has at least one of the required roles.
 * - Unauthenticated (defensive fallback) → /login
 * - Authenticated but missing required role → /403
 *
 * NOTE: In the router, RoleRoute is always nested inside ProtectedRoute,
 * so the unauthenticated case is a defensive fallback only.
 *
 * Uses getState() for role check (outside React reactivity — role check is synchronous
 * and always reflects current auth state after ProtectedRoute passed through).
 */
export function RoleRoute({ roles }: RoleRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const auth = useAuthStore.getState()
  const hasRequiredRole = auth.hasRole('ADMIN') || roles.some((r) => auth.hasRole(r))

  if (!hasRequiredRole) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
