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
  imagen_url: string
  categoria_ids: number[]
  ingredientes: { ingrediente_id: number; es_removible: boolean }[]
}

export type ProductoFormSubmit = ProductoCreate | ProductoUpdate

interface ProductoFormProps {
  initialValues?: Partial<ProductoFormValues>
  categorias: CategoriaRead[]
  ingredientes: IngredienteRead[]
  isPending: boolean
  onSubmit: (values: ProductoFormValues) => void
  onCancel: () => void
  isEdit?: boolean
}

function FieldError({ errors }: { errors: unknown[] }) {
  const msgs = errors.filter(Boolean) as string[]
  if (!msgs.length) return null
  return <p className="mt-1 text-xs text-danger">{msgs[0]}</p>
}

const inputCls = 'w-full rounded-lg border border-line-subtle bg-surface-low px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
const labelCls = 'block text-sm font-medium text-ink-muted mb-1'

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
    imagen_url: '',
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
            <label htmlFor={field.name} className={labelCls}>
              Nombre *
            </label>
            <input
              id={field.name}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Ej: Pizza Mozzarella"
              className={inputCls}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      {/* Descripción */}
      <form.Field name="descripcion">
        {(field) => (
          <div>
            <label htmlFor={field.name} className={labelCls}>
              Descripción
            </label>
            <textarea
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Descripción del producto..."
              rows={3}
              className={inputCls}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      {/* Imagen URL */}
      <form.Field
        name="imagen_url"
        validators={{
          onChange: ({ value }) =>
            value && value.length > 500 ? 'La URL no puede superar los 500 caracteres' : undefined,
        }}
      >
        {(field) => (
          <div>
            <label htmlFor={field.name} className={labelCls}>
              Imagen (URL)
            </label>
            <input
              id={field.name}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className={inputCls}
            />
            <FieldError errors={field.state.meta.errors} />
            {field.state.value && (
              <div className="mt-2 overflow-hidden rounded-lg border border-line-subtle aspect-video bg-surface-high">
                <img
                  src={field.state.value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement | null
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = 'block'
                    const placeholder = e.currentTarget.nextElementSibling as HTMLElement | null
                    if (placeholder) placeholder.style.display = 'none'
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-sm text-ink-muted/60">
                  URL no válida o imagen no disponible
                </div>
              </div>
            )}
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
              <label htmlFor={field.name} className={labelCls}>
                Precio base * ($)
              </label>
              <input
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                value={field.state.value === 0 ? '' : field.state.value}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                  field.handleBlur()
                  if (e.target.value === '') field.handleChange(0)
                }}
                onChange={(e) => field.handleChange(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0.00"
                className={inputCls}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="stock_cantidad">
          {(field) => (
            <div>
              <label htmlFor={field.name} className={labelCls}>
                Stock
              </label>
              <input
                id={field.name}
                type="number"
                min="0"
                step="1"
                value={field.state.value === 0 ? '' : field.state.value}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                  field.handleBlur()
                  if (e.target.value === '') field.handleChange(0)
                }}
                onChange={(e) => field.handleChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                className={inputCls}
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
                <div className="h-6 w-11 rounded-full bg-surface-higher after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand peer-checked:after:translate-x-full" />
                <span className="ml-3 text-sm font-medium text-ink">Disponible</span>
              </label>
            </div>
          )}
        </form.Field>
      </div>

      {/* Categorías */}
      <form.Field name="categoria_ids">
        {(field) => (
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-2">
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
                        ? 'bg-brand/10 text-brand ring-1 ring-brand/50'
                        : 'bg-surface-high text-ink-muted ring-1 ring-line-subtle hover:bg-surface-higher'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                )
              })}
              {categorias.length === 0 && (
                <span className="text-sm text-ink-muted/50">No hay categorías disponibles</span>
              )}
            </div>
          </div>
        )}
      </form.Field>

      {/* Ingredientes */}
      <form.Field name="ingredientes">
        {(field) => (
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-2">
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
                      selected ? 'border-brand/30 bg-brand/5' : 'border-line-subtle bg-surface-low'
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
                        className="h-4 w-4 rounded border-line-subtle text-brand focus:ring-brand/20"
                      />
                      <span className="text-sm text-ink">{ing.nombre}</span>
                      {ing.es_alergeno && (
                        <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                          ⚠ Alérgeno
                        </span>
                      )}
                    </div>
                    {selected && (
                      <label className="flex items-center gap-1.5 text-xs text-ink-muted">
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
                          className="h-3.5 w-3.5 rounded border-line-subtle text-brand focus:ring-brand/20"
                        />
                        Removible
                      </label>
                    )}
                  </div>
                )
              })}
              {ingredientes.length === 0 && (
                <span className="text-sm text-ink-muted/50">No hay ingredientes disponibles</span>
              )}
            </div>
          </div>
        )}
      </form.Field>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-line-subtle pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-line-subtle px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-high disabled:opacity-50 transition-colors"
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
              className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-brand-on hover:bg-brand-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
