import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/shared/stores/authStore'
import { getCocinaOrdersActive } from '@/shared/api/cocina'
import { playBeep } from '@/features/cocina/lib/kdsSound'
import type { KDSEvent, PedidoCocinaRead } from '@/entities/cocina/types'

const POLL_INTERVAL_MS = 30_000

function buildWsUrl(token: string): string {
  if (import.meta.env.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL}/cocina/ws?token=${encodeURIComponent(token)}`
  }
  // Usa el mismo host del browser para que funcione con el proxy de Vite
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/v1/cocina/ws?token=${encodeURIComponent(token)}`
}

export function useKDS(soundEnabled: boolean) {
  const [orders, setOrders] = useState<Map<number, PedidoCocinaRead>>(new Map())
  const [wsConnected, setWsConnected] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)

  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const fetchAll = useCallback(async () => {
    try {
      const pedidos = await getCocinaOrdersActive()
      if (!mountedRef.current) return
      setOrders(new Map(pedidos.map((p) => [p.id, p])))
    } catch {
      // best-effort polling
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(fetchAll, POLL_INTERVAL_MS)
  }, [fetchAll])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const connectWs = useCallback(() => {
    if (!accessToken || wsRef.current) return

    const ws = new WebSocket(buildWsUrl(accessToken))
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setWsConnected(true)
      stopPolling()
      fetchAll()
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const msg: KDSEvent = JSON.parse(event.data)
        handleKDSEvent(msg)
      } catch {
        // malformed message — ignore
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      wsRef.current = null
      setWsConnected(false)
      startPolling()
      // Retry WS connection after one polling cycle
      setTimeout(() => {
        if (mountedRef.current) connectWs()
      }, POLL_INTERVAL_MS)
    }

    ws.onerror = () => {
      ws.close()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, fetchAll, startPolling, stopPolling])

  function handleKDSEvent(msg: KDSEvent) {
    setOrders((prev) => {
      const next = new Map(prev)

      if (msg.type === 'PEDIDO_CONFIRMADO') {
        next.set(msg.pedido_id, msg.pedido)
        if (soundEnabled) {
          playBeep()
        }
      } else if (msg.type === 'PEDIDO_EN_PREPARACION') {
        const existing = next.get(msg.pedido_id)
        if (existing) {
          next.set(msg.pedido_id, { ...existing, estadoCodigo: 'EN_PREP' })
        }
      } else if (msg.type === 'PEDIDO_EN_CAMINO' || msg.type === 'PEDIDO_CANCELADO') {
        next.delete(msg.pedido_id)
      }

      return next
    })
  }

  const advanceOrder = useCallback(async (pedidoId: number, nuevoEstado: string) => {
    const { avanzarEstadoPedidoApi } = await import('@/shared/api/pedidos')
    await avanzarEstadoPedidoApi({
      pedidoId,
      nuevoEstado: nuevoEstado as 'EN_PREP' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO',
    })
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchAll().then(() => connectWs())

    return () => {
      mountedRef.current = false
      wsRef.current?.close()
      wsRef.current = null
      stopPolling()
    }
  }, [fetchAll, connectWs, stopPolling])

  const porPreparar = Array.from(orders.values())
    .filter((p) => p.estadoCodigo === 'CONFIRMADO')
    .sort((a, b) => {
      const ta = a.timestampEntradaCocina ?? a.createdAt
      const tb = b.timestampEntradaCocina ?? b.createdAt
      return new Date(ta).getTime() - new Date(tb).getTime()
    })

  const enPreparacion = Array.from(orders.values())
    .filter((p) => p.estadoCodigo === 'EN_PREP')
    .sort((a, b) => {
      const ta = a.timestampEntradaCocina ?? a.createdAt
      const tb = b.timestampEntradaCocina ?? b.createdAt
      return new Date(ta).getTime() - new Date(tb).getTime()
    })

  return { porPreparar, enPreparacion, wsConnected, advanceOrder }
}
