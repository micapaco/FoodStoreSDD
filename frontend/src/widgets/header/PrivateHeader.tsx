import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getSafeUserRoles, useAuthStore } from '@/shared/stores/authStore'
import { useCartStore } from '@/shared/stores/cartStore'
import { CartDrawer } from '@/features/store/components/CartDrawer'
import { isClientViewPath } from '@/shared/lib/auth/roles'

function getPrimaryRole(roles: string[]): string {
  if (roles.includes('ADMIN')) return 'ADMIN'
  if (roles.includes('STOCK')) return 'STOCK'
  if (roles.includes('PEDIDOS')) return 'PEDIDOS'
  return 'CLIENT'
}

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-violet-500/20 text-violet-300',
  STOCK: 'bg-surface-higher text-ink-muted',
  PEDIDOS: 'bg-warning/20 text-warning',
  CLIENT: 'bg-success/20 text-success',
}

export function PrivateHeader() {
  const [cartOpen, setCartOpen] = useState(false)
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logoutAndRedirect = useAuthStore((s) => s.logoutAndRedirect)
  const setCartOwner = useCartStore((s) => s.setOwner)
  const count = useCartStore((s) => s.items.reduce((acc, item) => acc + item.cantidad, 0))

  const handleLogout = () => {
    logoutAndRedirect('/')
  }

  const roles = user ? getSafeUserRoles(user) : []
  const userId = user?.id
  const primaryRole = user ? getPrimaryRole(roles) : 'CLIENT'
  const canUseCart = roles.includes('CLIENT') || (roles.includes('ADMIN') && isClientViewPath(location.pathname))
  const badgeClass = roleBadgeClass[primaryRole] ?? 'bg-surface-higher text-ink-muted'

  useEffect(() => {
    if (userId) {
      setCartOwner(userId)
    }
  }, [setCartOwner, userId])

  return (
    <header className="bg-surface-low border-b border-line-subtle shadow-card-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <span className="text-xl font-extrabold text-brand tracking-tight">
            Food Store
          </span>

          <div className="flex items-center gap-4">
            {canUseCart && (
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative rounded-md p-2 text-ink-muted hover:bg-surface-high hover:text-ink transition-colors"
                aria-label="Abrir carrito"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-brand-on">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            )}

            {user && (
              <>
                <span className="hidden sm:block text-sm text-ink font-medium">
                  {user.nombre}
                </span>
                {primaryRole !== 'CLIENT' && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                    aria-label={`Rol activo: ${primaryRole}`}
                  >
                    {primaryRole}
                  </span>
                )}
              </>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-surface-high px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-higher transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {canUseCart && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />}
    </header>
  )
}
