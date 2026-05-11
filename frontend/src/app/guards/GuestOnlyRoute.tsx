import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/shared/stores/authStore'

/**
 * Guard: renders <Outlet /> for unauthenticated users only.
 * Authenticated users are redirected to their role-based home:
 *   ADMIN     → /admin
 *   STOCK     → /admin/productos
 *   PEDIDOS   → /admin/pedidos
 *   CLIENT    → /
 */
function getRoleHome(roles: string[]): string {
  if (roles.includes('ADMIN')) return '/admin'
  if (roles.includes('STOCK')) return '/admin/productos'
  if (roles.includes('PEDIDOS')) return '/admin/pedidos'
  return '/'
}

export function GuestOnlyRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (isAuthenticated && user) {
    const home = getRoleHome(user.roles)
    return <Navigate to={home} replace />
  }

  return <Outlet />
}
