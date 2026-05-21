import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearPagoApi, crearPedidoMercadoPagoApi, obtenerPagoStatusApi } from '@/shared/api/pagos'

export function useCrearPago() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: crearPagoApi,
    onSuccess: (pago) => {
      queryClient.invalidateQueries({ queryKey: ['pagos', pago.pedidoId] })
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}

export function useCrearPedidoMercadoPago() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: crearPedidoMercadoPagoApi,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pagos', result.pedido.id] })
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}

export function usePagoStatus(pedidoId: number | null) {
  return useQuery({
    queryKey: ['pagos', pedidoId],
    queryFn: () => obtenerPagoStatusApi(pedidoId!),
    enabled: pedidoId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.ultimoIntento?.mpStatus
      return status === 'pending' || status === 'in_process' ? 30000 : false
    },
  })
}
