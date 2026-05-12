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

function productQuantity(items: CartItem[], productoId: number): number {
  return items
    .filter((item) => item.productoId === productoId)
    .reduce((acc, item) => acc + item.cantidad, 0)
}

function maxCartQuantity(stockDisponible?: number): number {
  return Math.min(99, stockDisponible ?? 99)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (producto, cantidad, personalizacion) =>
        set((state) => {
          const currentProductQuantity = productQuantity(state.items, producto.id)
          const available = Math.max(0, maxCartQuantity(producto.stockDisponible) - currentProductQuantity)
          const quantityToAdd = Math.min(cantidad, available)
          if (quantityToAdd <= 0) return state

          const idx = state.items.findIndex((i) => matchItem(i, producto.id, personalizacion))
          if (idx !== -1) {
            const next = [...state.items]
            next[idx] = {
              ...next[idx],
              producto: { ...next[idx].producto, stockDisponible: producto.stockDisponible },
              cantidad: next[idx].cantidad + quantityToAdd,
            }
            return { items: next }
          }
          return {
            items: [...state.items, { productoId: producto.id, producto, cantidad: quantityToAdd, personalizacion }],
          }
        }),

      removeItem: (productoId, personalizacion) =>
        set((state) => ({
          items: state.items.filter((i) => !matchItem(i, productoId, personalizacion)),
        })),

      updateCantidad: (productoId, personalizacion, cantidad) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (!matchItem(item, productoId, personalizacion)) return item
            const otherProductQuantity = state.items
              .filter((other) => other.productoId === productoId && other !== item)
              .reduce((acc, other) => acc + other.cantidad, 0)
            const maxForItem = Math.max(1, maxCartQuantity(item.producto.stockDisponible) - otherProductQuantity)
            return { ...item, cantidad: Math.min(Math.max(1, cantidad), maxForItem) }
          }),
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
