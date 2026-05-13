import api from '@/shared/api/axios'
import type {
  MetricasParams,
  PedidosPorEstadoResponse,
  ProductosTopParams,
  ProductosTopResponse,
  ResumenResponse,
  VentasParams,
  VentasResponse,
} from '@/entities/metricas/types'

export async function getResumenApi(params?: MetricasParams): Promise<ResumenResponse> {
  const response = await api.get<ResumenResponse>('/admin/metricas/resumen', { params })
  return response.data
}

export async function getVentasApi(params?: VentasParams): Promise<VentasResponse> {
  const response = await api.get<VentasResponse>('/admin/metricas/ventas', { params })
  return response.data
}

export async function getProductosTopApi(params?: ProductosTopParams): Promise<ProductosTopResponse> {
  const response = await api.get<ProductosTopResponse>('/admin/metricas/productos-top', { params })
  return response.data
}

export async function getPedidosPorEstadoApi(params?: MetricasParams): Promise<PedidosPorEstadoResponse> {
  const response = await api.get<PedidosPorEstadoResponse>('/admin/metricas/pedidos-por-estado', { params })
  return response.data
}
