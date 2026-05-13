import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getConfigAdminApi,
  getConfigPublicaApi,
  updateConfigApi,
} from '@/shared/api/config'

export function useConfigAdmin() {
  return useQuery({
    queryKey: ['config', 'admin'],
    queryFn: getConfigAdminApi,
    staleTime: 30_000,
  })
}

export function useUpdateConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clave, valor }: { clave: string; valor: string }) =>
      updateConfigApi(clave, { valor }),
    onSuccess: (updatedParam) => {
      // Surgical update: only change the saved param, not the whole list.
      // This prevents other ConfigField components from resetting their local state.
      queryClient.setQueryData<import('@/entities/config/types').ConfigListResponse>(
        ['config', 'admin'],
        (old) => {
          if (!old) return old
          return {
            ...old,
            parametros: old.parametros.map((p) =>
              p.clave === updatedParam.clave ? updatedParam : p
            ),
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: ['config', 'publica'] })
    },
  })
}

export function useConfigPublica() {
  return useQuery({
    queryKey: ['config', 'publica'],
    queryFn: getConfigPublicaApi,
    staleTime: 60_000,
  })
}
