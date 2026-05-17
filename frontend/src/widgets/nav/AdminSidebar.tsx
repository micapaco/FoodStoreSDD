import { NavLink } from 'react-router-dom'
import { getSafeUserRoles, useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const ADMIN_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Panel admin', end: true },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/ingredientes', label: 'Ingredientes' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/configuracion', label: 'Configuración' },
]

const STOCK_PEDIDOS_ITEMS: NavItem[] = [
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/ingredientes', label: 'Ingredientes' },
  { to: '/admin/pedidos', label: 'Pedidos' },
]

const STOCK_ITEMS: NavItem[] = [
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/ingredientes', label: 'Ingredientes' },
]

const PEDIDOS_ITEMS: NavItem[] = [
  { to: '/admin/pedidos', label: 'Pedidos' },
]

function getNavItems(roles: string[]): NavItem[] {
  if (roles.includes('ADMIN')) return ADMIN_ITEMS
  if (roles.includes('STOCK') && roles.includes('PEDIDOS')) return STOCK_PEDIDOS_ITEMS
  if (roles.includes('STOCK')) return STOCK_ITEMS
  if (roles.includes('PEDIDOS')) return PEDIDOS_ITEMS
  return []
}

export function AdminSidebar() {
  const user = useAuthStore((s) => s.user)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  const roles = user ? getSafeUserRoles(user) : []
  const isAdmin = roles.includes('ADMIN')
  const items = getNavItems(roles)

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-surface-low border-r border-line-subtle shadow-card-sm transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-line-subtle px-4">
          <span className="text-xl font-extrabold text-brand tracking-tight">Food Store</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Navegación admin">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => { if (sidebarOpen) toggleSidebar() }}
              className={({ isActive }) =>
                [
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-ink-muted hover:bg-surface-higher hover:text-ink',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {isAdmin && (
          <div className="shrink-0 border-t border-line-subtle px-3 py-3">
            <NavLink
              to="/productos"
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-higher hover:text-ink transition-colors"
            >
              Ver como cliente
            </NavLink>
          </div>
        )}
      </aside>
    </>
  )
}
