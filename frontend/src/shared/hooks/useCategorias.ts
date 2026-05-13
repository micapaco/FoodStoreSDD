import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/shared/api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '@/entities/categorias/types'

export function useCategoriasList(params: api.CategoriaListParams = {}) {
  return useQuery({
    queryKey: ['categorias', 'list', params],
    queryFn: () => api.getCategorias(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCategoriasTree() {
  return useQuery({
    queryKey: ['categorias', 'tree'],
    queryFn: () => api.getCategoriasTree(),
    staleTime: 5 * 60 * 1000,
  })
}

function useInvalidateCategorias() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['categorias'] })
    queryClient.invalidateQueries({ queryKey: ['productos'] })
  }
}

export function useCreateCategoria() {
  const invalidateCategorias = useInvalidateCategorias()
  return useMutation({
    mutationFn: (data: CategoriaCreate) => api.createCategoria(data),
    onSuccess: invalidateCategorias,
  })
}

export function useUpdateCategoria() {
  const invalidateCategorias = useInvalidateCategorias()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaUpdate }) =>
      api.updateCategoria(id, data),
    onSuccess: invalidateCategorias,
  })
}

export function useDeleteCategoria() {
  const invalidateCategorias = useInvalidateCategorias()
  return useMutation({
    mutationFn: (id: number) => api.deleteCategoria(id),
    onSuccess: invalidateCategorias,
  })
}
