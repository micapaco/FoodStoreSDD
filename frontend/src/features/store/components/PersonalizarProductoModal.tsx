import { useState } from 'react'
import type { IngredienteReadRef } from '@/entities/productos/types'
import type { Personalizacion } from '@/shared/types/cart'

interface PersonalizarProductoModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (personalizacion: Personalizacion) => void
  productoNombre: string
  ingredientesRemovibles: IngredienteReadRef[]
  cantidad?: number
}

export function PersonalizarProductoModal({
  open,
  onClose,
  onConfirm,
  productoNombre,
  ingredientesRemovibles,
  cantidad = 1,
}: PersonalizarProductoModalProps) {
  const [excludedIds, setExcludedIds] = useState<number[]>([])
  const [notas, setNotas] = useState('')

  if (!open) return null

  const handleToggle = (id: number) => {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleConfirm = () => {
    const trimmedNotas = notas.trim()
    onConfirm({
      ingredientesExcluidos: excludedIds,
      ...(trimmedNotas ? { notas: trimmedNotas } : {}),
    })
    setExcludedIds([])
    setNotas('')
    onClose()
  }

  const handleClose = () => {
    setExcludedIds([])
    setNotas('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
      <div className="relative z-10 mx-4 w-full max-w-md rounded-xl border border-line-subtle bg-surface-base p-6 shadow-dropdown">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Personalizar</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-ink-muted hover:text-ink hover:bg-surface-high transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-ink-muted">
          Seleccioná los ingredientes que querés <strong className="text-ink">excluir</strong> de <strong className="text-ink">{productoNombre}</strong>:
        </p>

        {ingredientesRemovibles.length === 0 ? (
          <p className="text-sm text-ink-muted/50">Este producto no tiene ingredientes removibles.</p>
        ) : (
          <ul className="space-y-2">
            {ingredientesRemovibles.map((ing) => (
              <li key={ing.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-subtle bg-surface-low px-3 py-2.5 hover:bg-surface-high transition-colors">
                  <input
                    type="checkbox"
                    checked={excludedIds.includes(ing.id)}
                    onChange={() => handleToggle(ing.id)}
                    className="h-4 w-4 rounded border-line-subtle text-brand focus:ring-brand/20"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink">{ing.nombre}</span>
                    {ing.es_alergeno && (
                      <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                        Alérgeno
                      </span>
                    )}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <label htmlFor="notas-prep" className="block text-sm font-medium text-ink mb-1.5">
            Notas de preparación <span className="text-ink-muted font-normal">(opcional)</span>
          </label>
          <textarea
            id="notas-prep"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder='Ej: "sin sal", "extra queso", "término medio"'
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none transition-colors"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-line-subtle px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface-high transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-brand-on hover:bg-brand-dim transition-colors"
          >
            {cantidad > 1 ? `Agregar ${cantidad} al carrito` : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}
