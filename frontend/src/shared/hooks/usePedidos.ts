import { useMutation, useQueryClient } from '@tanstack/react-query'
import { crearPedidoApi } from '@/shared/api/pedidos'

export function useCrearPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: crearPedidoApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}
