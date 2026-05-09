import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * Guard: renders <Outlet /> for authenticated users.
 * - Explicit logout (logoutAndRedirect): redirects to the stored destination (e.g. '/').
 * - Session expiry (logout): redirects to /login?from=<currentPath> so the user
 *   can return after re-authenticating.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigateAfterLogout = useAuthStore((s) => s.navigateAfterLogout)
  const location = useLocation()

  if (!isAuthenticated) {
    const to = navigateAfterLogout ?? `/login?from=${encodeURIComponent(location.pathname)}`
    return <Navigate to={to} replace />
  }

  return <Outlet />
}
