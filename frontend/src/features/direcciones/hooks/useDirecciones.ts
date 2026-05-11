import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/shared/api/direcciones'
import type { DireccionCreate, DireccionUpdate } from '@/entities/direcciones/types'

export function useAddressesQuery(params: { page: number; page_size: number }) {
  return useQuery({
    queryKey: ['direcciones', params],
    queryFn: () => api.getDirecciones(params),
    staleTime: 30_000,
  })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DireccionCreate) => api.createDireccion(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['direcciones'] })
    },
  })
}

export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DireccionUpdate }) => api.updateDireccion(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['direcciones'] })
    },
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteDireccion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['direcciones'] })
    },
  })
}

export function useSetPrincipalAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.setDireccionPrincipal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['direcciones'] })
    },
  })
}
