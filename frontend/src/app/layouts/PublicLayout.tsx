import { Outlet } from 'react-router-dom'
import { PublicHeader } from '@/widgets/header/PublicHeader'
import { PrivateHeader } from '@/widgets/header/PrivateHeader'
import { RoleNav } from '@/widgets/nav/RoleNav'
import { Footer } from '@/widgets/footer/Footer'
import { Toaster } from '@/widgets/toaster/Toaster'
import { useAuthStore } from '@/shared/stores/authStore'
import { useConfigPublica } from '@/shared/hooks/useConfig'
import { RootErrorBoundary } from './RootErrorBoundary'

/**
 * Layout for all public routes.
 * Structure: PublicHeader > main > Outlet (inside RootErrorBoundary) > Footer > Toaster
 */
function SystemMessageBanner() {
  const { data } = useConfigPublica()
  const mensaje = data?.mensaje_sistema ?? ''
  const pedidosDeshabilitados = data?.pedidos_habilitados === false
  if (!mensaje && !pedidosDeshabilitados) return null
  return (
    <div className="border-b border-brand/20 bg-brand/10 px-4 py-2 text-center text-sm font-medium text-brand">
      {pedidosDeshabilitados ? 'El local no esta aceptando pedidos en este momento' : mensaje}
      {pedidosDeshabilitados && mensaje ? ` - ${mensaje}` : ''}
    </div>
  )
}

export function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {isAuthenticated ? (
        <>
          <PrivateHeader />
          <RoleNav />
        </>
      ) : (
        <PublicHeader />
      )}
      <SystemMessageBanner />
      <main className="flex-1">
        <RootErrorBoundary>
          <Outlet />
        </RootErrorBoundary>
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
