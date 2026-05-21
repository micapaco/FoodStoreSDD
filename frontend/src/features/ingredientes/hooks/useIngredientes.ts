import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/shared/api/ingredientes'
import type { IngredienteCreate, IngredienteUpdate } from '@/entities/ingredientes/types'

export function useIngredientesList(params: api.IngredienteListParams = {}) {
  return useQuery({
    queryKey: ['ingredientes', 'list', params],
    queryFn: () => api.getIngredientes(params),
    staleTime: 60_000,
  })
}

function useInvalidateIngredientes() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['ingredientes'] })
    queryClient.invalidateQueries({ queryKey: ['productos'] })
  }
}

export function useCreateIngrediente() {
  const invalidateIngredientes = useInvalidateIngredientes()
  return useMutation({
    mutationFn: (data: IngredienteCreate) => api.createIngrediente(data),
    onSuccess: invalidateIngredientes,
  })
}

export function useUpdateIngrediente() {
  const invalidateIngredientes = useInvalidateIngredientes()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IngredienteUpdate }) =>
      api.updateIngrediente(id, data),
    onSuccess: invalidateIngredientes,
  })
}

export function useDeleteIngrediente() {
  const invalidateIngredientes = useInvalidateIngredientes()
  return useMutation({
    mutationFn: (id: number) => api.deleteIngrediente(id),
    onSuccess: invalidateIngredientes,
  })
}
