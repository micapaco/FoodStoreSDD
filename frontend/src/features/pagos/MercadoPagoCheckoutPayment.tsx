import { useEffect, useState } from 'react'
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react'
import type { CrearPedidoRequest } from '@/entities/pedidos/types'
import type { PedidoMercadoPagoResponse } from '@/entities/pagos/types'
import { useCrearPedidoMercadoPago } from '@/shared/hooks/usePagos'
import { parseHttpError } from '@/shared/lib/http/parseHttpError'
import { useAuthStore } from '@/shared/stores/authStore'
import { usePaymentStore } from '@/shared/stores/paymentStore'
import { useUiStore } from '@/shared/stores/uiStore'

interface MercadoPagoCheckoutPaymentProps {
  amount: number
  pedido: CrearPedidoRequest
  onSuccess: (result: PedidoMercadoPagoResponse) => void
  onRejected: (message: string) => void
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

function isRejected(status: string | null | undefined): boolean {
  return status === 'rejected' || status === 'cancelled'
}

export function MercadoPagoCheckoutPayment({
  amount,
  pedido,
  onSuccess,
  onRejected,
}: MercadoPagoCheckoutPaymentProps) {
  const userEmail = useAuthStore((s) => s.user?.email)
  const addToast = useUiStore((s) => s.addToast)
  const paymentStore = usePaymentStore()
  const crearPedidoMercadoPago = useCrearPedidoMercadoPago()
  const [brickReady, setBrickReady] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (publicKey) {
      initMercadoPago(publicKey, { locale: 'es-AR' })
      setSdkReady(true)
    }
  }, [])

  async function handleSubmit(data: CardPaymentSubmitData): Promise<void> {
    paymentStore.startProcessing()
    try {
      const result = await crearPedidoMercadoPago.mutateAsync({
        pedido,
        cardToken: data.token,
        paymentMethodId: data.payment_method_id,
        issuerId: data.issuer_id ?? null,
        installments: data.installments,
        payerEmail: data.payer?.email ?? userEmail ?? null,
        payerIdentificationType: data.payer?.identification?.type ?? null,
        payerIdentificationNumber: data.payer?.identification?.number ?? null,
      })
      paymentStore.setPaymentResult(result.pago.mpPaymentId, result.pago.mpStatus, result.pago.statusDetail)
      if (isRejected(result.pago.mpStatus)) {
        const message = result.pago.statusDetail ?? 'MercadoPago rechazo el pago. Podes reintentar o elegir otra forma de pago.'
        paymentStore.setPaymentError(message)
        addToast({ type: 'error', message })
        onRejected(message)
        return
      }
      addToast({ type: 'success', message: 'Pago enviado a MercadoPago.' })
      onSuccess(result)
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
    onRejected(message)
  }

  if (!publicKey) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
        MercadoPago no esta configurado. Falta `VITE_MERCADOPAGO_PUBLIC_KEY`.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-line-subtle bg-surface-base p-5 shadow-card-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Pago MercadoPago</h2>
          <p className="mt-1 text-sm text-ink-muted">Completa el pago para crear el pedido.</p>
        </div>
        <span className="text-sm font-semibold text-brand">
          {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)}
        </span>
      </div>

      {paymentStore.error && (
        <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {paymentStore.error}
        </p>
      )}

      <div className="mt-5">
        {(!brickReady || !sdkReady) && (
          <p className="mb-3 text-sm text-ink-muted">Cargando formulario de pago...</p>
        )}
        {sdkReady && (
          <CardPayment
            initialization={{ amount }}
            locale="es-AR"
            onReady={() => setBrickReady(true)}
            onError={handleBrickError}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  )
}
