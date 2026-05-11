import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Personalizacion, Producto } from '@/shared/types/cart'

function sameExclusiones(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

interface CartState {
  items: CartItem[]
  addItem: (producto: Producto, cantidad: number, personalizacion: Personalizacion) => void
  removeItem: (productoId: number, personalizacion: Personalizacion) => void
  updateCantidad: (productoId: number, personalizacion: Personalizacion, cantidad: number) => void
  clearCart: () => void
  itemCount: () => number
  subtotal: () => number
  costoEnvio: () => number
  total: () => number
  getItem: (productoId: number, personalizacion: Personalizacion) => CartItem | undefined
}

function matchItem(i: CartItem, productoId: number, p: Personalizacion) {
  return i.productoId === productoId && sameExclusiones(i.personalizacion.ingredientesExcluidos, p.ingredientesExcluidos)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (producto, cantidad, personalizacion) =>
        set((state) => {
          const idx = state.items.findIndex((i) => matchItem(i, producto.id, personalizacion))
          if (idx !== -1) {
            const next = [...state.items]
            next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidad }
            return { items: next }
          }
          return {
            items: [...state.items, { productoId: producto.id, producto, cantidad, personalizacion }],
          }
        }),

      removeItem: (productoId, personalizacion) =>
        set((state) => ({
          items: state.items.filter((i) => !matchItem(i, productoId, personalizacion)),
        })),

      updateCantidad: (productoId, personalizacion, cantidad) =>
        set((state) => ({
          items: state.items.map((i) =>
            matchItem(i, productoId, personalizacion) ? { ...i, cantidad } : i,
          ),
        })),

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),

      subtotal: () => get().items.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0),

      costoEnvio: () => (get().items.length > 0 ? 50 : 0),

      total: () => get().subtotal() + get().costoEnvio(),

      getItem: (productoId, personalizacion) => get().items.find((i) => matchItem(i, productoId, personalizacion)),
    }),
    {
      name: 'food-store-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
