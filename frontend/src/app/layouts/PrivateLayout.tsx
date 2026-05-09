import { Outlet } from 'react-router-dom'
import { PrivateHeader } from '@/widgets/header/PrivateHeader'
import { RoleNav } from '@/widgets/nav/RoleNav'
import { Footer } from '@/widgets/footer/Footer'
import { Toaster } from '@/widgets/toaster/Toaster'
import { RootErrorBoundary } from './RootErrorBoundary'

/**
 * Layout for all private (authenticated) routes.
 * Structure: PrivateHeader > RoleNav > main > Outlet (inside RootErrorBoundary) > Footer > Toaster
 */
export function PrivateLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PrivateHeader />
      <RoleNav />
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
