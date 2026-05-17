import { NavLink, useLocation } from 'react-router-dom'
import { getSafeUserRoles, useAuthStore } from '@/shared/stores/authStore'
import { isClientViewPath } from '@/shared/lib/auth/roles'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

/**
 * Role-aware navigation bar for private routes.
 * Shows only the links relevant to the user's roles.
 * Active link gets aria-current="page" (set by NavLink) and a highlighted style.
 */
const CLIENT_ITEMS: NavItem[] = [
  { to: '/productos', label: 'Catálogo' },
  { to: '/carrito', label: 'Mi carrito' },
  { to: '/pedidos', label: 'Mis pedidos' },
  { to: '/direcciones', label: 'Mis direcciones' },
  { to: '/perfil', label: 'Mi perfil' },
]

const ADMIN_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Panel admin', end: true },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/ingredientes', label: 'Ingredientes' },
  { to: '/admin/categorias', label: 'Categorías' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/configuracion', label: 'Configuración' },
]

const STOCK_ITEMS: NavItem[] = [
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/ingredientes', label: 'Ingredientes' },
]

const PEDIDOS_ITEMS: NavItem[] = [{ to: '/admin/pedidos', label: 'Pedidos' }]

function getNavItems(roles: string[], path: string): NavItem[] {
  if (roles.includes('ADMIN') && isClientViewPath(path)) {
    return [...CLIENT_ITEMS, { to: '/admin', label: 'Panel admin', end: true }]
  }
  if (roles.includes('ADMIN')) return ADMIN_ITEMS
  if (roles.includes('STOCK')) return STOCK_ITEMS
  if (roles.includes('PEDIDOS')) return PEDIDOS_ITEMS
  return CLIENT_ITEMS
}

export function RoleNav() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const items = user ? getNavItems(getSafeUserRoles(user), location.pathname) : CLIENT_ITEMS

  return (
    <nav
      className="bg-surface-low border-b border-line-subtle px-4 sm:px-6 lg:px-8"
      aria-label="Navegación de sección"
    >
      <ul className="flex flex-wrap gap-1 py-2">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand font-semibold'
                    : 'text-ink-muted hover:bg-surface-high hover:text-ink',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
