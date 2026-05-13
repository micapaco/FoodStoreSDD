import { Outlet } from 'react-router-dom'
import { PrivateHeader } from '@/widgets/header/PrivateHeader'
import { RoleNav } from '@/widgets/nav/RoleNav'
import { Footer } from '@/widgets/footer/Footer'
import { Toaster } from '@/widgets/toaster/Toaster'
import { useConfigPublica } from '@/shared/hooks/useConfig'
import { RootErrorBoundary } from './RootErrorBoundary'

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

/**
 * Layout for all private (authenticated) routes.
 * Structure: PrivateHeader > RoleNav > main > Outlet (inside RootErrorBoundary) > Footer > Toaster
 */
export function PrivateLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PrivateHeader />
      <RoleNav />
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
