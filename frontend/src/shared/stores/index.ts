import { useAuthStore } from './authStore'
import { useCartStore } from './cartStore'
import { usePaymentStore } from './paymentStore'
import { useUiStore } from './uiStore'

export { useAuthStore, useCartStore, usePaymentStore, useUiStore }

// Zustand persist only writes to localStorage on setState, not on initialization.
// Force an initial write so storage keys are created on app start, not deferred.
useAuthStore.setState(useAuthStore.getState())
useCartStore.setState(useCartStore.getState())
useUiStore.setState(useUiStore.getState())
