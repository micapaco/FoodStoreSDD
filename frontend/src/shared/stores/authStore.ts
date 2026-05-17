import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useCartStore } from '@/shared/stores/cartStore'

export interface User {
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

type StoredUser = Omit<User, 'roles'> & { roles?: unknown }
type StoredAuthState = Partial<Omit<AuthState, 'user'>> & { user?: StoredUser | null }
type PersistedAuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
}

export function getSafeUserRoles(user: { roles?: unknown } | null | undefined): string[] {
  return Array.isArray(user?.roles)
    ? user.roles.filter((role): role is string => typeof role === 'string')
    : []
}

function normalizeUser(user: StoredUser | User | null | undefined): User | null {
  if (!user) return null
  return {
    ...user,
    telefono: user.telefono ?? null,
    roles: getSafeUserRoles(user),
  }
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
        const normalizedUser = normalizeUser(user)
        if (!normalizedUser) return
        set({ ...tokens, user: normalizedUser, isAuthenticated: true, navigateAfterLogout: null })
        useCartStore.getState().setOwner(normalizedUser.id)
      },
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
      logoutAndRedirect: (to) =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, navigateAfterLogout: to }),
      updateTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      hasRole: (role) => getSafeUserRoles(get().user).includes(role),
    }),
    {
      name: 'food-store-auth',
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as StoredAuthState
        return {
          accessToken: state.accessToken ?? null,
          refreshToken: state.refreshToken ?? null,
          user: normalizeUser(state.user),
          isAuthenticated: state.isAuthenticated ?? false,
        } satisfies PersistedAuthState
      },
      partialize: (state): PersistedAuthState => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: normalizeUser(state.user),
        isAuthenticated: state.isAuthenticated,
        // navigateAfterLogout is intentionally excluded — transient, resets on page load
      }),
    },
  ),
)
