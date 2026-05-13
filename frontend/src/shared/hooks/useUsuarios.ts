import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cambiarEstadoApi,
  cambiarRolesApi,
  editarUsuarioApi,
  listarUsuariosApi,
} from '@/shared/api/usuarios'
import type { UsuariosListParams } from '@/entities/usuarios/types'

export function useUsuariosList(params: UsuariosListParams) {
  return useQuery({
    queryKey: ['usuarios', 'admin', params],
    queryFn: () => listarUsuariosApi(params),
    staleTime: 30_000,
  })
}

export function useEditarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof editarUsuarioApi>[1] }) =>
      editarUsuarioApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', 'admin'] })
    },
  })
}

export function useCambiarRoles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof cambiarRolesApi>[1] }) =>
      cambiarRolesApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', 'admin'] })
    },
  })
}

export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof cambiarEstadoApi>[1] }) =>
      cambiarEstadoApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', 'admin'] })
    },
  })
}
