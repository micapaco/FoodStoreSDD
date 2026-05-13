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
  if (!mensaje) return null
  return (
    <div className="bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white">
      {mensaje}
    </div>
  )
}

export function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
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
