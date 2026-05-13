import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useCartStore } from '@/shared/stores/cartStore'

interface User {
  id: number
  nombre: string
  apellido: string
  telefono: string | null
  email: string
  roles: string[]
}

interface Tokens {
  accessToken: string
  refreshToken: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  /** Non-persisted: where to redirect after an explicit logout (null = use /login?from=...) */
  navigateAfterLogout: string | null
  login: (tokens: Tokens, user: User) => void
  logout: () => void
  /** Explicit logout — also sets a redirect destination for ProtectedRoute */
  logoutAndRedirect: (to: string) => void
  updateTokens: (tokens: Tokens) => void
  hasRole: (role: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      navigateAfterLogout: null,
      login: (tokens, user) => {
        set({ ...tokens, user, isAuthenticated: true, navigateAfterLogout: null })
        // Non-client roles (ADMIN, STOCK, PEDIDOS) should never see a previous client's cart
        if (!user.roles.includes('CLIENT')) {
          useCartStore.getState().clearCart()
        }
      },
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
      logoutAndRedirect: (to) =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, navigateAfterLogout: to }),
      updateTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
    }),
    {
      name: 'food-store-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // navigateAfterLogout is intentionally excluded — transient, resets on page load
      }),
    },
  ),
)
