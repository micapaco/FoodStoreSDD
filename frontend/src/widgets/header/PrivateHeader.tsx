import { useState } from 'react'
import { useAuthStore } from '@/shared/stores/authStore'
import { useCartStore } from '@/shared/stores/cartStore'
import { CartDrawer } from '@/features/store/components/CartDrawer'

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
  const [cartOpen, setCartOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logoutAndRedirect = useAuthStore((s) => s.logoutAndRedirect)
  const itemCount = useCartStore((s) => s.itemCount)

  const handleLogout = () => {
    logoutAndRedirect('/')
  }

  const primaryRole = user ? getPrimaryRole(user.roles) : 'CLIENT'
  const badgeClass = roleBadgeClass[primaryRole] ?? 'bg-gray-100 text-gray-700'
  const count = itemCount()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <span className="text-xl font-extrabold text-orange-500 tracking-tight">
            Food Store
          </span>

          <div className="flex items-center gap-4">
            {/* Cart button */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors"
              aria-label="Abrir carrito"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>

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

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  )
}
