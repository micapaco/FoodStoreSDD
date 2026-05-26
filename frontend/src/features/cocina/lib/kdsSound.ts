let ctx: AudioContext | null = null
let keepAliveTimer: ReturnType<typeof setInterval> | null = null

function startKeepAlive(): void {
  if (keepAliveTimer || !ctx) return
  keepAliveTimer = setInterval(() => {
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    } else if (ctx.state === 'running') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.01)
    }
  }, 30_000)
}

/**
 * Crea y activa el AudioContext. Debe llamarse desde un gesto del usuario (click).
 * Inicia el keep-alive para evitar que el browser suspenda el contexto.
 */
export async function activateAudio(): Promise<void> {
  if (!ctx) {
    try {
      ctx = new AudioContext()
      console.log('[kdsSound] AudioContext creado, state:', ctx.state)
    } catch {
      console.error('[kdsSound] No se pudo crear AudioContext')
      return
    }
  }
  if (ctx.state === 'suspended') {
    await ctx.resume()
    console.log('[kdsSound] AudioContext resumido, state:', ctx.state)
  } else {
    console.log('[kdsSound] AudioContext ya running, state:', ctx.state)
  }
  startKeepAlive()
}

export function deactivateAudio(): void {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer)
    keepAliveTimer = null
  }
}

function doBeep(context: AudioContext): void {
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

export function playBeep(): void {
  console.log('[kdsSound] playBeep llamado, ctx:', ctx ? `state=${ctx.state}` : 'null')
  if (!ctx) return
  if (ctx.state === 'running') {
    doBeep(ctx)
  } else if (ctx.state === 'suspended') {
    console.log('[kdsSound] ctx suspendido, intentando resume...')
    ctx.resume().then(() => { console.log('[kdsSound] resume ok'); doBeep(ctx!) }).catch((e) => console.error('[kdsSound] resume falló:', e))
  }
}
