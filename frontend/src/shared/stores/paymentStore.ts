import { create } from 'zustand'

type CheckoutStep = 'idle' | 'checkout' | 'processing' | 'success' | 'error'

interface PaymentState {
  checkoutStep: CheckoutStep
  preferenceId: string | null
  paymentStatus: string | null
  error: string | null
  startCheckout: (_pedidoId: number) => void
  setPreference: (preferenceId: string) => void
  updatePaymentStatus: (status: string) => void
  resetPayment: () => void
}

const initialState = {
  checkoutStep: 'idle' as CheckoutStep,
  preferenceId: null,
  paymentStatus: null,
  error: null,
}

export const usePaymentStore = create<PaymentState>()((set) => ({
  ...initialState,
  startCheckout: (_pedidoId) => set({ checkoutStep: 'checkout', error: null }),
  setPreference: (preferenceId) => set({ preferenceId, checkoutStep: 'processing' }),
  updatePaymentStatus: (status) => set({ paymentStatus: status }),
  resetPayment: () => set(initialState),
}))
