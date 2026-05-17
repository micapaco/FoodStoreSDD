import type { CrearPedidoRequest, PedidoRead } from '@/entities/pedidos/types'

export type PagoStatus = 'pending' | 'approved' | 'rejected' | 'in_process' | 'cancelled'

export interface CrearPagoRequest {
  pedidoId: number
  cardToken: string
  paymentMethodId: string
  issuerId?: string | null
  installments: number
  payerEmail?: string | null
  payerIdentificationType?: string | null
  payerIdentificationNumber?: string | null
}

export interface CrearPedidoMercadoPagoRequest {
  pedido: CrearPedidoRequest
  cardToken: string
  paymentMethodId: string
  issuerId?: string | null
  installments: number
  payerEmail?: string | null
  payerIdentificationType?: string | null
  payerIdentificationNumber?: string | null
}

export interface PagoRead {
  id: number
  pedidoId: number
  mpOrderId: string | null
  mpPaymentId: number | null
  mpStatus: PagoStatus | string | null
  statusDetail: string | null
  externalReference: string
  idempotencyKey: string
  monto: string | null
  createdAt: string
  updatedAt: string
}

export interface PagoStatusResponse {
  pedidoId: number
  estadoPedido: string
  intentos: PagoRead[]
  ultimoIntento: PagoRead | null
}

export interface PedidoMercadoPagoResponse {
  pedido: PedidoRead
  pago: PagoRead
}
