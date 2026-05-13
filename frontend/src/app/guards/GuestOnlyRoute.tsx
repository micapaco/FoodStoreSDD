import { Navigate, Outlet } from 'react-router-dom'
import { getSafeUserRoles, useAuthStore } from '@/shared/stores/authStore'
import { getRoleHome } from '@/shared/lib/auth/roles'

/**
 * Guard: renders <Outlet /> for unauthenticated users only.
 * Authenticated users are redirected to their role-based home:
 *   ADMIN     → /admin
 *   STOCK     → /admin/productos
 *   PEDIDOS   → /admin/pedidos
 *   CLIENT    → /
 */
export function GuestOnlyRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (isAuthenticated && user) {
    const home = getRoleHome(getSafeUserRoles(user))
    return <Navigate to={home} replace />
  }

  return <Outlet />
}
