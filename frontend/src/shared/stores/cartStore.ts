import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Personalizacion, Producto } from '@/shared/types/cart'

interface CartState {
  items: CartItem[]
  addItem: (producto: Producto, cantidad: number, personalizacion: Personalizacion) => void
  removeItem: (productoId: number) => void
  updateQuantity: (productoId: number, cantidad: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
  getItem: (productoId: number) => CartItem | undefined
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (producto, cantidad, personalizacion) =>
        set((state) => {
          const existing = state.items.find((i) => i.productoId === producto.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productoId === producto.id
                  ? { ...i, cantidad: i.cantidad + cantidad }
                  : i,
              ),
            }
          }
          return {
            items: [...state.items, { productoId: producto.id, producto, cantidad, personalizacion }],
          }
        }),
      removeItem: (productoId) =>
        set((state) => ({ items: state.items.filter((i) => i.productoId !== productoId) })),
      updateQuantity: (productoId, cantidad) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productoId === productoId ? { ...i, cantidad } : i,
          ),
        })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
      totalPrice: () =>
        get().items.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0),
      getItem: (productoId) => get().items.find((i) => i.productoId === productoId),
    }),
    { name: 'food-store-cart' },
  ),
)
