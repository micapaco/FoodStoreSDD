import { activateAudio } from '@/features/cocina/lib/kdsSound'

interface Props {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function SoundToggle({ enabled, onChange }: Props) {
  async function handleToggle() {
    const next = !enabled
    if (next) {
      await activateAudio()
    }
    onChange(next)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={enabled ? 'Desactivar sonido' : 'Activar sonido'}
      className={[
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        enabled
          ? 'bg-brand/10 text-brand border border-brand/30'
          : 'bg-surface-high text-ink-muted border border-line-subtle hover:text-ink',
      ].join(' ')}
    >
      <span className="text-base" aria-hidden="true">
        {enabled ? '🔔' : '🔕'}
      </span>
      <span>{enabled ? 'Sonido ON' : 'Sonido OFF'}</span>
    </button>
  )
}
