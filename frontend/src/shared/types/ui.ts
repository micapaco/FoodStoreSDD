export type Theme = 'light' | 'dark'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  actionLabel?: string
  actionTo?: string
}
