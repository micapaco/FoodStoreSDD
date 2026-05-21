let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  return ctx
}

/**
 * Activa el AudioContext si está suspendido.
 * Debe llamarse en respuesta a un evento de usuario (click/tap).
 */
export async function activateAudio(): Promise<void> {
  const context = getCtx()
  if (context && context.state === 'suspended') {
    await context.resume()
  }
}

/** Reproduce un beep breve vía Web Audio API. No requiere archivos externos. */
export function playBeep(): void {
  const context = getCtx()
  if (!context || context.state !== 'running') return

  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(880, context.currentTime)
  gain.gain.setValueAtTime(0.3, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3)

  oscillator.start(context.currentTime)
  oscillator.stop(context.currentTime + 0.3)
}
