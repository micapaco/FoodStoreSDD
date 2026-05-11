import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/shared/lib/queryClient'
import '@/shared/stores'
import { router } from '@/app/router'
import { installErrorHandler } from '@/shared/lib/http/installErrorHandler'
import { useRehydrateUser } from '@/shared/hooks/useAuth'
import './index.css'

installErrorHandler()

function AppBootstrap() {
  useRehydrateUser()
  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
)
