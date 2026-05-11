import { useForm } from '@tanstack/react-form'
import type { CategoriaRead } from '@/entities/categorias/types'
import type { IngredienteRead } from '@/entities/ingredientes/types'
import type { ProductoCreate, ProductoUpdate } from '@/entities/productos/types'

export interface ProductoFormValues {
  nombre: string
  descripcion: string
  precio_base: number
  stock_cantidad: number
  disponible: boolean
  categoria_ids: number[]
  ingredientes: { ingrediente_id: number; es_removible: boolean }[]
}

export type ProductoFormSubmit = ProductoCreate | ProductoUpdate

interface ProductoFormProps {
  /** Initial values for edit mode */
  initialValues?: Partial<ProductoFormValues>
  categorias: CategoriaRead[]
  ingredientes: IngredienteRead[]
  isPending: boolean
  onSubmit: (values: ProductoFormValues) => void
  onCancel: () => void
  /** True when editing, false when creating */
  isEdit?: boolean
}

function FieldError({ errors }: { errors: unknown[] }) {
  const msgs = errors.filter(Boolean) as string[]
  if (!msgs.length) return null
  return <p className="mt-1 text-xs text-red-500">{msgs[0]}</p>
}

/**
 * Shared form component for creating and editing products.
 * Uses TanStack Form for basic fields and plain state for
 * category/ingredient multi-selects.
 */
export function ProductoForm({
  initialValues,
  categorias,
  ingredientes,
  isPending,
  onSubmit,
  onCancel,
  isEdit = false,
}: ProductoFormProps) {
  const defaultValues: ProductoFormValues = {
    nombre: '',
    descripcion: '',
    precio_base: 0,
    stock_cantidad: 0,
    disponible: true,
    categoria_ids: [],
    ingredientes: [],
    ...initialValues,
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
      noValidate
    >
      {/* Nombre */}
      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) =>
            !value.trim() ? 'El nombre es requerido' : undefined,
        }}
      >
        {(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              id={field.name}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Ej: Pizza Mozzarella"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      {/* Descripción */}
      <form.Field name="descripcion">
        {(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Descripción del producto..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      {/* Precio y Stock — row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <form.Field
          name="precio_base"
          validators={{
            onChange: ({ value }) =>
              value <= 0 ? 'El precio debe ser mayor a 0' : undefined,
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                Precio base * ($)
              </label>
              <input
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="stock_cantidad">
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                id={field.name}
                type="number"
                min="0"
                step="1"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="disponible">
          {(field) => (
            <div className="flex items-end pb-2.5">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full" />
                <span className="ml-3 text-sm font-medium text-gray-700">Disponible</span>
              </label>
            </div>
          )}
        </form.Field>
      </div>

      {/* Categorías */}
      <form.Field name="categoria_ids">
        {(field) => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorías
            </label>
            <div className="flex flex-wrap gap-2">
              {categorias.map((cat) => {
                const selected = field.state.value.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? field.state.value.filter((id) => id !== cat.id)
                        : [...field.state.value, cat.id]
                      field.handleChange(next)
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-400'
                        : 'bg-gray-100 text-gray-600 ring-1 ring-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                )
              })}
              {categorias.length === 0 && (
                <span className="text-sm text-gray-400">No hay categorías disponibles</span>
              )}
            </div>
          </div>
        )}
      </form.Field>

      {/* Ingredientes */}
      <form.Field name="ingredientes">
        {(field) => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredientes
            </label>
            <div className="space-y-1.5">
              {ingredientes.map((ing) => {
                const asignacion = field.state.value.find(
                  (a) => a.ingrediente_id === ing.id,
                )
                const selected = !!asignacion
                return (
                  <div
                    key={ing.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                      selected ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const next = selected
                            ? field.state.value.filter((a) => a.ingrediente_id !== ing.id)
                            : [
                                ...field.state.value,
                                { ingrediente_id: ing.id, es_removible: false },
                              ]
                          field.handleChange(next)
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{ing.nombre}</span>
                      {ing.es_alergeno && (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          ⚠ Alérgeno
                        </span>
                      )}
                    </div>
                    {selected && (
                      <label className="flex items-center gap-1.5 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          checked={asignacion?.es_removible ?? false}
                          onChange={(e) => {
                            const next = field.state.value.map((a) =>
                              a.ingrediente_id === ing.id
                                ? { ...a, es_removible: e.target.checked }
                                : a,
                            )
                            field.handleChange(next)
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        Removible
                      </label>
                    )}
                  </div>
                )
              })}
              {ingredientes.length === 0 && (
                <span className="text-sm text-gray-400">No hay ingredientes disponibles</span>
              )}
            </div>
          </div>
        )}
      </form.Field>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting || isPending}
              className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting || isPending
                ? 'Guardando…'
                : isEdit
                  ? 'Actualizar producto'
                  : 'Crear producto'}
            </button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
