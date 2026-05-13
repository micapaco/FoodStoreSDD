import { useEffect, useMemo, useState } from 'react'
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react'
import type { PedidoRead } from '@/entities/pedidos/types'
import type { PagoRead } from '@/entities/pagos/types'
import { useCrearPago, usePagoStatus } from '@/shared/hooks/usePagos'
import { parseHttpError } from '@/shared/lib/http/parseHttpError'
import { useAuthStore } from '@/shared/stores/authStore'
import { usePaymentStore } from '@/shared/stores/paymentStore'
import { useUiStore } from '@/shared/stores/uiStore'

interface MercadoPagoCardPaymentProps {
  pedido: PedidoRead
}

interface CardPaymentSubmitData {
  token: string
  issuer_id?: string
  payment_method_id: string
  installments: number
  payer?: {
    email?: string
    identification?: {
      type?: string
      number?: string
    }
  }
}

interface BrickError {
  message?: string
  cause?: string
}

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY

function paymentStatusText(status: string | null | undefined): string {
  switch (status) {
    case 'approved':
      return 'Pago aprobado'
    case 'rejected':
      return 'Pago rechazado'
    case 'pending':
      return 'Pago pendiente'
    case 'in_process':
      return 'Pago en revision'
    case 'cancelled':
      return 'Pago cancelado'
    default:
      return 'Esperando pago'
  }
}

function canRetry(status: string | null | undefined): boolean {
  return status === 'rejected' || status === 'cancelled'
}

export function MercadoPagoCardPayment({ pedido }: MercadoPagoCardPaymentProps) {
  const userEmail = useAuthStore((s) => s.user?.email)
  const addToast = useUiStore((s) => s.addToast)
  const paymentStore = usePaymentStore()
  const crearPago = useCrearPago()
  const pagoStatus = usePagoStatus(pedido.id)
  const [createdPayment, setCreatedPayment] = useState<PagoRead | null>(null)
  const [brickReady, setBrickReady] = useState(false)

  const ultimoIntento = pagoStatus.data?.ultimoIntento ?? createdPayment
  const status = ultimoIntento?.mpStatus ?? paymentStore.paymentStatus
  const statusDetail = ultimoIntento?.statusDetail ?? paymentStore.statusDetail
  const amount = useMemo(() => Number.parseFloat(pedido.total), [pedido.total])
  const shouldShowBrick = !status || canRetry(status)

  useEffect(() => {
    if (publicKey) {
      initMercadoPago(publicKey, { locale: 'es-AR' })
    }
  }, [])

  async function handleSubmit(data: CardPaymentSubmitData): Promise<void> {
    paymentStore.startProcessing()
    try {
      const pago = await crearPago.mutateAsync({
        pedidoId: pedido.id,
        cardToken: data.token,
        paymentMethodId: data.payment_method_id,
        issuerId: data.issuer_id ?? null,
        installments: data.installments,
        payerEmail: data.payer?.email ?? userEmail ?? null,
        payerIdentificationType: data.payer?.identification?.type ?? null,
        payerIdentificationNumber: data.payer?.identification?.number ?? null,
      })
      setCreatedPayment(pago)
      paymentStore.setPaymentResult(pago.mpPaymentId, pago.mpStatus, pago.statusDetail)
      await pagoStatus.refetch()
      addToast({ type: 'success', message: 'Pago enviado a MercadoPago.' })
    } catch (error) {
      const parsed = parseHttpError(error)
      paymentStore.setPaymentError(parsed.message)
      addToast({ type: 'error', message: parsed.message })
      throw error
    }
  }

  function handleBrickError(error: BrickError): void {
    const message = error.message ?? error.cause ?? 'No se pudo cargar MercadoPago.'
    paymentStore.setPaymentError(message)
    addToast({ type: 'error', message })
  }

  if (!publicKey) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        MercadoPago no esta configurado. Falta `VITE_MERCADOPAGO_PUBLIC_KEY`.
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Pago MercadoPago</h2>
            <p className="mt-1 text-sm text-gray-600">{paymentStatusText(status)}</p>
          </div>
          <span className="text-sm font-semibold text-orange-600">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)}
          </span>
        </div>

        {statusDetail && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{statusDetail}</p>
        )}

        {paymentStore.error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {paymentStore.error}
          </p>
        )}

        {shouldShowBrick ? (
          <div className="mt-5">
            {!brickReady && <p className="mb-3 text-sm text-gray-500">Cargando formulario de pago...</p>}
            <CardPayment
              initialization={{ amount }}
              locale="es-AR"
              onReady={() => setBrickReady(true)}
              onError={handleBrickError}
              onSubmit={handleSubmit}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            {status === 'approved'
              ? 'Tu pedido quedo en proceso de confirmacion.'
              : 'Estamos esperando la confirmacion final de MercadoPago.'}
          </p>
        )}
      </div>
    </div>
  )
}
