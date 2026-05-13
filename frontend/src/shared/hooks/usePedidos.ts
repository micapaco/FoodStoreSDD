import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  avanzarEstadoPedidoApi,
  cancelarPedidoApi,
  confirmarPagoOfflineApi,
  crearPedidoApi,
  obtenerPedidoAdminDetalleApi,
  obtenerPedidoDetalleApi,
  obtenerPedidosAdminApi,
  obtenerPedidosPropiosApi,
} from '@/shared/api/pedidos'
import type { PedidosAdminParams, PedidosPropiosParams } from '@/entities/pedidos/types'

export function useCrearPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: crearPedidoApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}

export function usePedidosPropios(params: PedidosPropiosParams) {
  return useQuery({
    queryKey: ['pedidos', 'propios', params],
    queryFn: () => obtenerPedidosPropiosApi(params),
    staleTime: 30_000,
  })
}

export function usePedidoDetalle(pedidoId: number | null) {
  return useQuery({
    queryKey: ['pedidos', 'detalle', pedidoId],
    queryFn: () => obtenerPedidoDetalleApi(pedidoId as number),
    enabled: pedidoId !== null,
    staleTime: 30_000,
  })
}

export function usePedidosAdmin(params: PedidosAdminParams) {
  return useQuery({
    queryKey: ['pedidos', 'admin', params],
    queryFn: () => obtenerPedidosAdminApi(params),
    staleTime: 20_000,
  })
}

export function usePedidoAdminDetalle(pedidoId: number | null) {
  return useQuery({
    queryKey: ['pedidos', 'admin', 'detalle', pedidoId],
    queryFn: () => obtenerPedidoAdminDetalleApi(pedidoId as number),
    enabled: pedidoId !== null,
    staleTime: 20_000,
  })
}

export function useAvanzarEstadoPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: avanzarEstadoPedidoApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'admin'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'propios'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'detalle'] })
    },
  })
}

export function useCancelarPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelarPedidoApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'admin'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'propios'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'detalle'] })
    },
  })
}

export function useConfirmarPagoOffline() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: confirmarPagoOfflineApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'admin'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'propios'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'detalle'] })
    },
  })
}
