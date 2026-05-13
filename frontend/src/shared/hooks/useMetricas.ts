import { useQuery } from '@tanstack/react-query'
import {
  getPedidosPorEstadoApi,
  getProductosTopApi,
  getResumenApi,
  getVentasApi,
} from '@/shared/api/metricas'
import type { Granularidad, MetricasParams, ProductosTopParams, VentasParams } from '@/entities/metricas/types'

export function useMetricasResumen(params?: MetricasParams) {
  return useQuery({
    queryKey: ['metricas', 'resumen', params],
    queryFn: () => getResumenApi(params),
    staleTime: 60_000,
  })
}

export function useMetricasVentas(params?: VentasParams) {
  return useQuery({
    queryKey: ['metricas', 'ventas', params],
    queryFn: () => getVentasApi(params),
    staleTime: 60_000,
  })
}

export function useMetricasProductosTop(params?: ProductosTopParams) {
  return useQuery({
    queryKey: ['metricas', 'productos-top', params],
    queryFn: () => getProductosTopApi(params),
    staleTime: 60_000,
  })
}

export function useMetricasPedidosPorEstado(params?: MetricasParams) {
  return useQuery({
    queryKey: ['metricas', 'pedidos-por-estado', params],
    queryFn: () => getPedidosPorEstadoApi(params),
    staleTime: 60_000,
  })
}

export type { Granularidad }
