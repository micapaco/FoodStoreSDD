import { Outlet } from 'react-router-dom'
import { PrivateHeader } from '@/widgets/header/PrivateHeader'
import { AdminSidebar } from '@/widgets/nav/AdminSidebar'
import { RoleNav } from '@/widgets/nav/RoleNav'
import { Footer } from '@/widgets/footer/Footer'
import { Toaster } from '@/widgets/toaster/Toaster'
import { getSafeUserRoles, useAuthStore } from '@/shared/stores/authStore'
import { useConfigPublica } from '@/shared/hooks/useConfig'
import { RootErrorBoundary } from './RootErrorBoundary'

function SystemMessageBanner() {
  const { data } = useConfigPublica()
  const mensaje = data?.mensaje_sistema ?? ''
  if (!mensaje) return null
  return (
    <div className="border-b border-brand/20 bg-brand/10 px-4 py-2 text-center text-sm font-medium text-brand">
      {mensaje}
    </div>
  )
}

export function PrivateLayout() {
  const user = useAuthStore((s) => s.user)
  const roles = user ? getSafeUserRoles(user) : []
  const isClient = !roles.includes('ADMIN') && !roles.includes('STOCK') && !roles.includes('PEDIDOS')

  if (isClient) {
    return (
      <div className="flex min-h-screen flex-col bg-surface">
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

  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex flex-1 flex-col lg:ml-64">
        <PrivateHeader />
        <SystemMessageBanner />
        <main className="flex-1">
          <RootErrorBoundary>
            <Outlet />
          </RootErrorBoundary>
        </main>
        <Footer />
      </div>
      <Toaster />
    </div>
  )
}
