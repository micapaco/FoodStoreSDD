import { useAuthStore } from './authStore'
import { useCartStore } from './cartStore'
import { usePaymentStore } from './paymentStore'
import { useUiStore } from './uiStore'

export { useAuthStore, useCartStore, usePaymentStore, useUiStore }

// Zustand persist only writes to localStorage on setState, not on initialization.
// Force initial write so storage keys exist on app start (not deferred until first mutation).
useAuthStore.setState(useAuthStore.getState())
useCartStore.setState(useCartStore.getState())
useUiStore.setState(useUiStore.getState())
