export interface ItemCocinaRead {
  nombreSnapshot: string
  cantidad: number
  personalizacion: number[] | null
}

export interface PedidoCocinaRead {
  id: number
  estadoCodigo: string
  notas: string | null
  createdAt: string
  timestampEntradaCocina: string | null
  items: ItemCocinaRead[]
}

export type KDSEventType =
  | 'PEDIDO_CONFIRMADO'
  | 'PEDIDO_EN_PREPARACION'
  | 'PEDIDO_EN_CAMINO'
  | 'PEDIDO_CANCELADO'

export interface KDSEventConfirmado {
  type: 'PEDIDO_CONFIRMADO'
  pedido_id: number
  pedido: PedidoCocinaRead
}

export interface KDSEventMovimiento {
  type: 'PEDIDO_EN_PREPARACION' | 'PEDIDO_EN_CAMINO' | 'PEDIDO_CANCELADO'
  pedido_id: number
}

export type KDSEvent = KDSEventConfirmado | KDSEventMovimiento
