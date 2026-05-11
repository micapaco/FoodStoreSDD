import { useState } from 'react'
import type { IngredienteReadRef } from '@/entities/productos/types'
import type { Personalizacion } from '@/shared/types/cart'

interface PersonalizarProductoModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (personalizacion: Personalizacion) => void
  productoNombre: string
  ingredientesRemovibles: IngredienteReadRef[]
}

export function PersonalizarProductoModal({
  open,
  onClose,
  onConfirm,
  productoNombre,
  ingredientesRemovibles,
}: PersonalizarProductoModalProps) {
  const [excludedIds, setExcludedIds] = useState<number[]>([])

  if (!open) return null

  const handleToggle = (id: number) => {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleConfirm = () => {
    onConfirm({ ingredientesExcluidos: excludedIds })
    setExcludedIds([])
    onClose()
  }

  const handleClose = () => {
    setExcludedIds([])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />
      <div className="relative z-10 mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Personalizar</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Seleccioná los ingredientes que querés <strong>excluir</strong> de <strong>{productoNombre}</strong>:
        </p>

        {ingredientesRemovibles.length === 0 ? (
          <p className="text-sm text-gray-400">Este producto no tiene ingredientes removibles.</p>
        ) : (
          <ul className="space-y-2">
            {ingredientesRemovibles.map((ing) => (
              <li key={ing.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={excludedIds.includes(ing.id)}
                    onChange={() => handleToggle(ing.id)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{ing.nombre}</span>
                    {ing.es_alergeno && (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                        Alérgeno
                      </span>
                    )}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  )
}
