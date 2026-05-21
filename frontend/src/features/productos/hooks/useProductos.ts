import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/shared/api/productos'
import { getIngredientes } from '@/shared/api/ingredientes'
import type {
  ProductoFilters,
  ProductoCreate,
  ProductoUpdate,
} from '@/entities/productos/types'

/**
 * useProductos — Fetch paginated product list (admin: includes unavailable).
 * Stale time 30s because products can change via mutations.
 */
export function useProductos(filters: ProductoFilters) {
  return useQuery({
    queryKey: ['productos', 'admin', filters],
    queryFn: () => api.getProductos(filters, true),
    staleTime: 30_000,
  })
}

/**
 * useProductosPublic — Fetch paginated product list for the public catalog.
 * Only available products are returned from the API.
 */
export function useProductosPublic(filters: ProductoFilters) {
  return useQuery({
    queryKey: ['productos', 'public', filters],
    queryFn: () => api.getProductos(filters, false),
    staleTime: 30_000,
  })
}

/**
 * useProducto — Fetch single product detail (admin).
 */
export function useProducto(id: number) {
  return useQuery({
    queryKey: ['productos', id],
    queryFn: () => api.getProducto(id, true),
    enabled: !!id,
    staleTime: 30_000,
  })
}

/**
 * useProductoPublic — Fetch single product detail (public).
 */
export function useProductoPublic(id: number) {
  return useQuery({
    queryKey: ['productos', 'public', id],
    queryFn: () => api.getProducto(id, false),
    enabled: !!id,
    staleTime: 30_000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useCreateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProductoCreate) => api.createProducto(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function useUpdateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoUpdate }) =>
      api.updateProducto(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function useDeleteProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteProducto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function useUploadProductoImagen() {
  return useMutation({
    mutationFn: (file: File) => api.uploadProductoImagen(file),
  })
}

export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stock_cantidad }: { id: number; stock_cantidad: number }) =>
      api.updateStock(id, stock_cantidad),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

export function useUpdateDisponibilidad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, disponible }: { id: number; disponible: boolean }) =>
      api.updateDisponibilidad(id, disponible),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

// ── Helper hooks (categorías / ingredientes for product forms) ────

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.getCategoriasList(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useIngredientes() {
  return useQuery({
    queryKey: ['ingredientes', 'form-list'],
    queryFn: async () => {
      const result = await getIngredientes({ page: 1, size: 100 })
      return result.items
    },
    staleTime: 5 * 60 * 1000,
  })
}
