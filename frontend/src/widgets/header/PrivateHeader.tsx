import { useAuthStore } from '@/shared/stores/authStore'

/**
 * Header for private (authenticated) routes.
 * Displays: user name, active role badge, logout button.
 */
function getPrimaryRole(roles: string[]): string {
  if (roles.includes('ADMIN')) return 'ADMIN'
  if (roles.includes('STOCK')) return 'STOCK'
  if (roles.includes('PEDIDOS')) return 'PEDIDOS'
  return 'CLIENT'
}

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  STOCK: 'bg-blue-100 text-blue-700',
  PEDIDOS: 'bg-yellow-100 text-yellow-700',
  CLIENT: 'bg-green-100 text-green-700',
}

export function PrivateHeader() {
  const user = useAuthStore((s) => s.user)
  const logoutAndRedirect = useAuthStore((s) => s.logoutAndRedirect)

  const handleLogout = () => {
    // logoutAndRedirect stores the target so ProtectedRoute's <Navigate>
    // goes to '/' instead of '/login?from=...' on the next render.
    logoutAndRedirect('/')
  }

  const primaryRole = user ? getPrimaryRole(user.roles) : 'CLIENT'
  const badgeClass = roleBadgeClass[primaryRole] ?? 'bg-gray-100 text-gray-700'

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <span className="text-xl font-extrabold text-orange-500 tracking-tight">
            Food Store
          </span>

          {/* Session info */}
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="hidden sm:block text-sm text-gray-700 font-medium">
                  {user.nombre}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                  aria-label={`Rol activo: ${primaryRole}`}
                >
                  {primaryRole}
                </span>
              </>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
