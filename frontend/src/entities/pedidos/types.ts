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
