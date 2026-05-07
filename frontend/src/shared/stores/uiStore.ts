import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, Toast } from '@/shared/types/ui'

interface UiState {
  theme: Theme
  sidebarOpen: boolean
  toasts: Toast[]
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: false,
      toasts: [],
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      addToast: (toast) =>
        set((s) => ({
          toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
        })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'food-store-ui',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)
