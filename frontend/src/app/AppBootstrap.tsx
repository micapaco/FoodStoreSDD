import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { useRehydrateUser } from '@/shared/hooks/useAuth'

export function AppBootstrap() {
  useRehydrateUser()
  return <RouterProvider router={router} />
}
