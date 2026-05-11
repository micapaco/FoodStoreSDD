import { Outlet } from 'react-router-dom'
import { PublicHeader } from '@/widgets/header/PublicHeader'
import { Footer } from '@/widgets/footer/Footer'
import { Toaster } from '@/widgets/toaster/Toaster'
import { RootErrorBoundary } from './RootErrorBoundary'

/**
 * Layout for all public routes.
 * Structure: PublicHeader > main > Outlet (inside RootErrorBoundary) > Footer > Toaster
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PublicHeader />
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
