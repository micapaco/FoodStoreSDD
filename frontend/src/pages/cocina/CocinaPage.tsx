import { useEffect, useRef, useState } from 'react'
import { useKDS } from '@/features/cocina/hooks/useKDS'
import { KDSColumn } from '@/features/cocina/components/KDSColumn'
import { SoundToggle } from '@/features/cocina/components/SoundToggle'

const SOUND_KEY = 'kds_sound_enabled'

function useSoundPreference() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SOUND_KEY) === 'true'
    } catch {
      return false
    }
  })

  function toggle(next: boolean) {
    setEnabled(next)
    try {
      localStorage.setItem(SOUND_KEY, String(next))
    } catch {
      // localStorage unavailable — ignore
    }
  }

  return { soundEnabled: enabled, setSoundEnabled: toggle }
}

export function CocinaPage() {
  const { soundEnabled, setSoundEnabled } = useSoundPreference()
  const { porPreparar, enPreparacion, wsConnected, advanceOrder } = useKDS(soundEnabled)

  const [flash, setFlash] = useState(false)
  const prevCountRef = useRef(0)

  // Flash visual cuando llega un pedido nuevo en "Por preparar"
  useEffect(() => {
    const prev = prevCountRef.current
    if (porPreparar.length > prev) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 1500)
      prevCountRef.current = porPreparar.length
      return () => clearTimeout(t)
    }
    prevCountRef.current = porPreparar.length
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porPreparar.length])

  async function handleStart(pedidoId: number) {
    await advanceOrder(pedidoId, 'EN_PREP')
  }

  async function handleDone(pedidoId: number) {
    const pedido = enPreparacion.find((p) => p.id === pedidoId)
    const nuevoEstado = pedido?.esRetiro ? 'ENTREGADO' : 'EN_CAMINO'
    await advanceOrder(pedidoId, nuevoEstado)
  }

  return (
    <div className="flex h-full min-h-screen flex-col bg-surface-base">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-line-subtle bg-surface-high px-6 py-4 shadow-card-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            🍳 Cocina
          </h1>
          <span
            className={[
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
              wsConnected
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger',
            ].join(' ')}
          >
            <span
              className={[
                'h-2 w-2 rounded-full',
                wsConnected ? 'bg-success animate-pulse' : 'bg-danger',
              ].join(' ')}
            />
            {wsConnected ? 'En vivo' : 'Sin conexión — polling cada 30s'}
          </span>
        </div>
        <SoundToggle enabled={soundEnabled} onChange={setSoundEnabled} />
      </header>

      {/* KDS grid */}
      <main className="flex flex-1 gap-4 p-6 md:grid md:grid-cols-2">
        <KDSColumn
          title="Por preparar"
          pedidos={porPreparar}
          action="start"
          onAction={handleStart}
          flash={flash}
        />
        <KDSColumn
          title="En preparación"
          pedidos={enPreparacion}
          action="done"
          onAction={handleDone}
        />
      </main>
    </div>
  )
}
