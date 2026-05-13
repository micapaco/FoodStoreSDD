export interface ItemValidar {
  productoId: number
  cantidad: number
  precioEsperado: number
  exclusiones: number[]
}

export interface ValidarCarritoRequest {
  items: ItemValidar[]
}

export interface ErrorValidacion {
  productoId: number
  tipo: 'STOCK_INSUFICIENTE' | 'PRECIO_CAMBIADO' | 'NO_DISPONIBLE'
  mensaje: string
}

export interface PrecioActualizado {
  productoId: number
  precioViejo: number
  precioNuevo: number
}

export interface ValidarCarritoResponse {
  valido: boolean
  errores: ErrorValidacion[]
  preciosActualizados: PrecioActualizado[]
}

export interface ItemPedidoRequest {
  productoId: number
  cantidad: number
  personalizacion: number[]
}

export interface CrearPedidoRequest {
  items: ItemPedidoRequest[]
  formaPagoCodigo: string
  direccionId: number | null
  notas?: string | null
}

export interface PedidoRead {
  id: number
  estadoCodigo: string
  total: string
  costoEnvio: string
  createdAt: string
}

export type EstadoPedidoOperativo =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_PREP'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO'

export interface PedidoListItem extends PedidoRead {
  cantidadItems: number
}

export interface PedidoListResponse {
  items: PedidoListItem[]
  total: number
  page: number
  size: number
  pages: number
}

export interface PedidoAdminListItem extends PedidoListItem {
  clienteNombre: string
  clienteEmail: string
}

export interface PedidoAdminListResponse {
  items: PedidoAdminListItem[]
  total: number
  page: number
  size: number
  pages: number
}

export interface PedidoDetalleItem {
  productoId: number | null
  nombreSnapshot: string
  precioSnapshot: string
  cantidad: number
  personalizacion: number[]
}

export interface DireccionSnapshot {
  id: number | null
  alias: string | null
  linea1: string
  linea2: string | null
  ciudad: string
  provincia: string
  codigoPostal: string | null
  notas: string | null
}

export interface PedidoPagoResumen {
  mpPaymentId: number | null
  mpStatus: string | null
  statusDetail: string | null
  updatedAt: string | null
}

export interface HistorialEstadoRead {
  id: number
  pedidoId: number
  estadoDesde: string | null
  estadoHasta: string
  cambiadoPorId: number | null
  motivo: string | null
  createdAt: string
}

export interface PedidoDetailRead extends PedidoRead {
  formaPagoCodigo: string
  direccionSnapshot: DireccionSnapshot | null
  notas: string | null
  items: PedidoDetalleItem[]
  historial: HistorialEstadoRead[]
  pago: PedidoPagoResumen | null
}

export interface PedidoClienteRead {
  id: number
  nombre: string
  apellido: string
  email: string
}

export interface PedidoAdminDetailRead extends PedidoDetailRead {
  cliente: PedidoClienteRead
}

export interface AvanzarEstadoPedidoRequest {
  pedidoId: number
  nuevoEstado: Extract<EstadoPedidoOperativo, 'EN_PREP' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO'>
  motivo?: string | null
}

export interface CancelarPedidoRequest {
  pedidoId: number
  motivo: string
}

export interface ConfirmarPagoOfflineRequest {
  pedidoId: number
  motivo?: string | null
}

export interface PedidosPropiosParams {
  page: number
  size: number
  estado?: string
}

export interface PedidosAdminParams extends PedidosPropiosParams {
  desde?: string
  hasta?: string
  q?: string
}
