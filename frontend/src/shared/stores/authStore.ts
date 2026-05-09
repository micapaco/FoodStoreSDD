import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  nombre: string
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
      login: (tokens, user) =>
        set({ ...tokens, user, isAuthenticated: true, navigateAfterLogout: null }),
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
