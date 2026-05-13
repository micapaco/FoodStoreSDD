export interface ProductoTopItem {
  producto_id: number | null
  nombre: string
  cantidad_vendida: number
  ingreso_total: number
}

export interface ResumenResponse {
  total_ventas: number
  cantidad_pedidos: number
  ticket_promedio: number
  usuarios_registrados: number
  productos_top: ProductoTopItem[]
}

export interface PuntoVentaItem {
  fecha: string
  total_ventas: number
  cantidad_pedidos: number
}

export interface VentasResponse {
  puntos: PuntoVentaItem[]
}

export interface ProductosTopResponse {
  productos: ProductoTopItem[]
}

export interface EstadoCountItem {
  estado_codigo: string
  cantidad: number
}

export interface PedidosPorEstadoResponse {
  estados: EstadoCountItem[]
}

export type Granularidad = 'dia' | 'semana' | 'mes'

export interface MetricasParams {
  desde?: string
  hasta?: string
}

export interface VentasParams extends MetricasParams {
  granularidad?: Granularidad
}

export interface ProductosTopParams extends MetricasParams {
  top?: number
}
