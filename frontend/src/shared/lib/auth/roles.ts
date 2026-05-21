export function getRoleHome(roles: string[]): string {
  if (roles.includes('ADMIN')) return '/admin'
  if (roles.includes('STOCK')) return '/admin/productos'
  if (roles.includes('PEDIDOS')) return '/admin/pedidos'
  return '/'
}

export function isClientViewPath(path: string): boolean {
  return (
    path.startsWith('/productos') ||
    path.startsWith('/perfil') ||
    path.startsWith('/direcciones') ||
    path.startsWith('/carrito') ||
    path.startsWith('/checkout') ||
    path.startsWith('/pedidos')
  )
}

export function canAccessPath(roles: string[], path: string): boolean {
  if (path.startsWith('/admin/productos')) {
    return roles.includes('ADMIN') || roles.includes('STOCK')
  }
  if (path.startsWith('/admin/pedidos')) {
    return roles.includes('ADMIN') || roles.includes('PEDIDOS')
  }
  if (path.startsWith('/admin')) {
    return roles.includes('ADMIN')
  }
  if (isClientViewPath(path)) {
    return roles.includes('ADMIN') || roles.includes('CLIENT')
  }
  return true
}

export function resolvePostLoginPath(roles: string[], requestedPath: string | null): string {
  if (requestedPath && canAccessPath(roles, requestedPath)) {
    return requestedPath
  }
  return getRoleHome(roles)
}
