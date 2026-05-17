import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib/queryClient'
import '@/shared/stores'
import { AppBootstrap } from '@/app/AppBootstrap'
import { installErrorHandler } from '@/shared/lib/http/installErrorHandler'
import './index.css'

installErrorHandler()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
    </QueryClientProvider>
  </StrictMode>,
)
