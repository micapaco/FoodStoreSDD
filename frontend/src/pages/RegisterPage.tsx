import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from 'react-router-dom'

import { useRegister } from '@/shared/hooks/useAuth'
import { useUiStore } from '@/shared/stores/uiStore'

function FieldError({ errors }: { errors: unknown[] }) {
  if (!errors.length) return null
  return <p className="text-red-500 text-xs mt-1">{String(errors[0])}</p>
}

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const addToast = useUiStore((s) => s.addToast)

  const form = useForm({
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      confirmar: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await registerMutation.mutateAsync({
          nombre: value.nombre,
          apellido: value.apellido,
          email: value.email,
          password: value.password,
        })
        addToast({ message: 'Cuenta creada. Iniciá sesión.', type: 'success' })
        navigate('/login')
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        // Network errors are already handled globally — skip to avoid double toast
        if (!axiosErr.response) return
        const detail = axiosErr.response?.data?.detail
        addToast({ message: detail ?? 'No se pudo crear la cuenta.', type: 'error' })
      }
    },
  })

  return (
    <div className="flex min-h-screen">
      {/* Left panel — forest green brand */}
      <div className="hidden lg:flex lg:w-2/5 bg-forest-900 flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute top-[-60px] right-[-60px] w-72 h-72 rounded-full border border-cream-400/10" />
        <div className="absolute bottom-[-40px] left-[-40px] w-52 h-52 rounded-full border border-cream-400/10" />
        <div className="relative z-10 text-center">
          <h1 className="font-display text-cream-100 text-4xl font-bold mb-4 leading-tight">
            Food Store
          </h1>
          <p className="text-cream-300 text-lg font-light italic leading-relaxed">
            "El buen comer empieza<br />con elegir bien."
          </p>
        </div>
      </div>

      {/* Right panel — cream form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-cream-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-display text-forest-800 text-3xl font-bold">Food Store</h1>
          </div>

          <h2 className="font-display text-forest-800 text-3xl font-bold mb-2">Crear cuenta</h2>
          <p className="text-forest-600 mb-8 text-sm">Completá tus datos para registrarte.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="nombre"
                validators={{ onChange: ({ value }) => (!value.trim() ? 'Requerido' : undefined) }}
              >
                {(field) => (
                  <div>
                    <label className="block text-forest-700 text-sm font-medium mb-1">
                      Nombre
                    </label>
                    <input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Ej: María"
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg bg-white text-forest-800 placeholder-forest-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="apellido"
                validators={{ onChange: ({ value }) => (!value.trim() ? 'Requerido' : undefined) }}
              >
                {(field) => (
                  <div>
                    <label className="block text-forest-700 text-sm font-medium mb-1">
                      Apellido
                    </label>
                    <input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Ej: García"
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg bg-white text-forest-800 placeholder-forest-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  !value.includes('@') ? 'Email inválido' : undefined,
              }}
            >
              {(field) => (
                <div>
                  <label className="block text-forest-700 text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg bg-white text-forest-800 placeholder-forest-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  value.length < 8 ? 'Mínimo 8 caracteres' : undefined,
              }}
            >
              {(field) => (
                <div>
                  <label className="block text-forest-700 text-sm font-medium mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg bg-white text-forest-800 placeholder-forest-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field
              name="confirmar"
              validators={{
                onChangeListenTo: ['password'],
                onChange: ({ value, fieldApi }) =>
                  value !== fieldApi.form.state.values.password
                    ? 'Las contraseñas no coinciden'
                    : undefined,
              }}
            >
              {(field) => (
                <div>
                  <label className="block text-forest-700 text-sm font-medium mb-1">
                    Confirmá la contraseña
                  </label>
                  <input
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Repetí tu contraseña"
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg bg-white text-forest-800 placeholder-forest-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
                </button>
              )}
            </form.Subscribe>
          </form>

          <p className="mt-6 text-center text-forest-600 text-sm">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
