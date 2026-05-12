import { Outlet } from 'react-router-dom'
import { PublicHeader } from '@/widgets/header/PublicHeader'
import { PrivateHeader } from '@/widgets/header/PrivateHeader'
import { RoleNav } from '@/widgets/nav/RoleNav'
import { Footer } from '@/widgets/footer/Footer'
import { Toaster } from '@/widgets/toaster/Toaster'
import { useAuthStore } from '@/shared/stores/authStore'
import { RootErrorBoundary } from './RootErrorBoundary'

/**
 * Layout for all public routes.
 * Structure: PublicHeader > main > Outlet (inside RootErrorBoundary) > Footer > Toaster
 */
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
