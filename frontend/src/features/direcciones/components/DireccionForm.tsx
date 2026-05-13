import { useForm } from '@tanstack/react-form'
import type { DireccionCreate } from '@/entities/direcciones/types'

export type DireccionFormValues = DireccionCreate

function FieldError({ errors }: { errors: unknown[] }) {
  const msgs = errors.filter(Boolean) as string[]
  if (!msgs.length) return null
  return <p className="mt-1 text-xs text-red-500">{msgs[0]}</p>
}

function inputCls(hasError: boolean) {
  return [
    'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
    hasError ? 'border-red-400' : 'border-gray-300',
  ].join(' ')
}

export function DireccionForm({
  initialValues,
  isPending,
  onSubmit,
  onCancel,
}: {
  initialValues?: Partial<DireccionFormValues>
  isPending: boolean
  onSubmit: (values: DireccionFormValues) => void
  onCancel: () => void
}) {
  const defaultValues: DireccionFormValues = {
    alias: '',
    linea1: '',
    linea2: '',
    ciudad: '',
    provincia: '',
    codigo_postal: '',
    notas: '',
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
      className="space-y-4"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field
          name="alias"
          validators={{ onChange: ({ value }) => (!value.trim() ? 'El alias es requerido' : undefined) }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">Alias *</label>
              <input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Casa"
                className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
              />
              {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
            </div>
          )}
        </form.Field>

        <form.Field
          name="codigo_postal"
          validators={{ onChange: ({ value }) => (!value.trim() ? 'El código postal es requerido' : undefined) }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">Código postal *</label>
              <input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="2000"
                className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
              />
              {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
            </div>
          )}
        </form.Field>
      </div>

      <form.Field
        name="linea1"
        validators={{ onChange: ({ value }) => (!value.trim() ? 'La línea 1 es requerida' : undefined) }}
      >
        {(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">Línea 1 *</label>
            <input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Calle y número"
              className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
            />
            {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
          </div>
        )}
      </form.Field>

      <form.Field
        name="linea2"
        validators={{ onChange: ({ value }) => (!value.trim() ? 'La línea 2 es requerida' : undefined) }}
      >
        {(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">Línea 2 *</label>
            <input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Piso, depto, referencia"
              className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
            />
            {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field
          name="ciudad"
          validators={{ onChange: ({ value }) => (!value.trim() ? 'La ciudad es requerida' : undefined) }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">Ciudad *</label>
              <input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
              />
              {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
            </div>
          )}
        </form.Field>

        <form.Field
          name="provincia"
          validators={{ onChange: ({ value }) => (!value.trim() ? 'La provincia es requerida' : undefined) }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">Provincia *</label>
              <input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
              />
              {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
            </div>
          )}
        </form.Field>
      </div>

      <form.Field
        name="notas"
        validators={{ onChange: ({ value }) => (!value.trim() ? 'Las notas son requeridas' : undefined) }}
      >
        {(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">Notas *</label>
            <textarea
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={3}
              className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
            />
            {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
          </div>
        )}
      </form.Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
