import { useState, useEffect } from 'react'
import { parseHttpError } from '@/shared/lib/http/parseHttpError'
import { useUiStore } from '@/shared/stores/uiStore'
import { useConfigAdmin, useUpdateConfig } from '@/shared/hooks/useConfig'

// ── Skeleton ─────────────────────────────────────────────────────────────────

function FieldSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 w-32 rounded bg-surface-higher" />
      <div className="h-10 w-full rounded bg-surface-higher" />
    </div>
  )
}

// ── Config field components ───────────────────────────────────────────────────

interface ConfigFieldProps {
  clave: string
  label: string
  initialValue: string
  onSave: (clave: string, valor: string) => Promise<void>
  isPending: boolean
  children: (
    value: string,
    onChange: (v: string) => void,
  ) => React.ReactNode
}

function ConfigField({ clave, label, initialValue, onSave, isPending, children }: ConfigFieldProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)

  // Sync when initialValue changes (fresh load)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSave = async () => {
    setError(null)
    try {
      await onSave(clave, value)
    } catch (err) {
      setError(parseHttpError(err).message)
    }
  }

  return (
    <div className="rounded-lg border border-line-subtle bg-surface-base p-5 shadow-card-sm">
      <label className="block text-sm font-semibold text-ink">{label}</label>
      <div className="mt-3">{children(value, setValue)}</div>
      {error && (
        <p className="mt-2 rounded bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-dim disabled:bg-surface-higher disabled:text-ink-muted"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SystemConfigPage() {
  const addToast = useUiStore((s) => s.addToast)
  const { data, isLoading, isError } = useConfigAdmin()
  const updateConfig = useUpdateConfig()

  const getValor = (clave: string): string => {
    if (!data) return ''
    const param = data.parametros.find((p) => p.clave === clave)
    return param?.valor ?? ''
  }

  const pedidosHabilitados = getValor('pedidos_habilitados').toLowerCase() !== 'false'

  const handleSave = async (clave: string, valor: string) => {
    await updateConfig.mutateAsync({ clave, valor })
    addToast({ type: 'success', message: 'Parámetro actualizado correctamente.' })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-ink">Configuración del sistema</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Administrá los parámetros operativos del local.
      </p>

      {/* Warning banner when orders are disabled */}
      {!isLoading && !isError && data && !pedidosHabilitados && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mt-0.5 h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <p className="text-sm font-medium">
            El local está cerrado — los clientes no pueden realizar pedidos.
          </p>
        </div>
      )}

      {isError && (
        <div className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Error al cargar la configuración. Recargá la página.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <>
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </>
        ) : (
          data && (
            <>
              {/* costo_envio_base */}
              <ConfigField
                clave="costo_envio_base"
                label="Costo de envío base ($)"
                initialValue={getValor('costo_envio_base')}
                onSave={handleSave}
                isPending={updateConfig.isPending}
              >
                {(value, onChange) => (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50"
                    placeholder="50.00"
                  />
                )}
              </ConfigField>

              {/* pedidos_habilitados */}
              <ConfigField
                clave="pedidos_habilitados"
                label="Pedidos habilitados"
                initialValue={getValor('pedidos_habilitados')}
                onSave={handleSave}
                isPending={updateConfig.isPending}
              >
                {(value, onChange) => (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={value.toLowerCase() !== 'false'}
                      onClick={() => onChange(value.toLowerCase() === 'false' ? 'true' : 'false')}
                      className={[
                        'relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-1 focus:ring-offset-surface-base',
                        value.toLowerCase() !== 'false' ? 'bg-brand' : 'bg-surface-higher',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                          value.toLowerCase() !== 'false' ? 'translate-x-5' : 'translate-x-0.5',
                          'mt-0.5',
                        ].join(' ')}
                      />
                    </button>
                    <span className="text-sm text-ink-muted">
                      {value.toLowerCase() !== 'false' ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>
                )}
              </ConfigField>

              {/* mensaje_sistema */}
              <ConfigField
                clave="mensaje_sistema"
                label="Mensaje del sistema"
                initialValue={getValor('mensaje_sistema')}
                onSave={handleSave}
                isPending={updateConfig.isPending}
              >
                {(value, onChange) => (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50"
                    placeholder="Ej: Cerrado por vacaciones"
                    maxLength={200}
                  />
                )}
              </ConfigField>
            </>
          )
        )}
      </div>
    </div>
  )
}
