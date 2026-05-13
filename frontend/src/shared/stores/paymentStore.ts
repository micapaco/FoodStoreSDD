import { create } from 'zustand'

type CheckoutStep = 'idle' | 'checkout' | 'processing' | 'success' | 'error'

interface PaymentState {
  checkoutStep: CheckoutStep
  paymentId: number | null
  preferenceId: string | null
  paymentStatus: string | null
  statusDetail: string | null
  error: string | null
  startCheckout: () => void
  startProcessing: () => void
  setPreference: (preferenceId: string) => void
  updatePaymentStatus: (status: string, statusDetail?: string | null) => void
  setPaymentResult: (paymentId: number | null, status: string | null, statusDetail?: string | null) => void
  setPaymentError: (error: string) => void
  resetPayment: () => void
}

const initialState = {
  checkoutStep: 'idle' as CheckoutStep,
  paymentId: null,
  preferenceId: null,
  paymentStatus: null,
  statusDetail: null,
  error: null,
}

export const usePaymentStore = create<PaymentState>()((set) => ({
  ...initialState,
  startCheckout: () => set({ checkoutStep: 'checkout', error: null }),
  startProcessing: () => set({ checkoutStep: 'processing', error: null }),
  setPreference: (preferenceId) => set({ preferenceId, checkoutStep: 'processing' }),
  updatePaymentStatus: (status, statusDetail = null) =>
    set({ paymentStatus: status, statusDetail }),
  setPaymentResult: (paymentId, status, statusDetail = null) =>
    set({
      paymentId,
      paymentStatus: status,
      statusDetail,
      checkoutStep: status === 'approved' ? 'success' : status === null ? 'processing' : 'checkout',
      error: null,
    }),
  setPaymentError: (error) => set({ checkoutStep: 'error', error }),
  resetPayment: () => set(initialState),
}))
