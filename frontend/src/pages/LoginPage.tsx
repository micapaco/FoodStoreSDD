import { useForm } from '@tanstack/react-form'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useLogin } from '@/shared/hooks/useAuth'
import { useUiStore } from '@/shared/stores/uiStore'

function FieldError({ errors }: { errors: unknown[] }) {
  const msgs = errors.filter(Boolean) as string[]
  if (!msgs.length) return null
  return <p className="mt-1 text-xs text-red-500">{msgs[0]}</p>
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const addToast = useUiStore((s) => s.addToast)
  const { mutate: login, isPending } = useLogin()

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      login(value, {
        onSuccess: () => {
          const from = searchParams.get('from') ?? '/'
          navigate(from, { replace: true })
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { detail?: string } } }
          // Network errors are already handled globally — skip to avoid double toast
          if (!axiosErr.response) return
          const detail = axiosErr.response.data?.detail
          addToast({ type: 'error', message: detail ?? 'Credenciales incorrectas. Revisá tus datos.' })
        },
      })
    },
  })

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* ── Left panel: brand ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-forest p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-forest-light opacity-50" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-amber-food opacity-10" />

        <div className="relative z-10">
          <span className="text-amber-food font-display text-2xl font-bold tracking-wide">
            Food Store
          </span>
        </div>

        <div className="relative z-10 space-y-6">
          <p className="font-display text-cream text-5xl font-bold leading-tight italic">
            "La mejor comida,<br />a tu puerta."
          </p>
          <p className="text-cream/60 text-sm leading-relaxed max-w-xs">
            Descubrí una experiencia gastronómica única. Pedí tus platos favoritos y recibilos frescos donde estés.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-cream/20" />
          <span className="text-cream/40 text-xs tracking-widest uppercase">Food Store · 2025</span>
          <div className="h-px flex-1 bg-cream/20" />
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-1 items-center justify-center bg-cream px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-display text-4xl font-bold text-forest">
              Bienvenido de vuelta
            </h1>
            <p className="text-forest/60 text-sm">
              ¿No tenés cuenta?{' '}
              <Link
                to="/register"
                className="text-amber-food font-medium hover:text-amber-dark transition-colors underline underline-offset-2"
              >
                Registrate acá
              </Link>
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <form.Field
              name="email"
              validators={{
                onBlur: ({ value }) =>
                  !value.trim()
                    ? 'El email es requerido'
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                      ? 'Ingresá un email válido'
                      : undefined,
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="block text-sm font-medium text-forest mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id={field.name}
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="vos@ejemplo.com"
                    className="w-full rounded-lg border border-forest/20 bg-white px-4 py-3 text-forest placeholder:text-forest/30 focus:border-amber-food focus:outline-none focus:ring-2 focus:ring-amber-food/20 transition-all"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            {/* Password */}
            <form.Field
              name="password"
              validators={{
                onBlur: ({ value }) =>
                  !value ? 'La contraseña es requerida' : undefined,
              }}
            >
              {(field) => (
                <div>
                  <label
                    htmlFor={field.name}
                    className="block text-sm font-medium text-forest mb-1.5"
                  >
                    Contraseña
                  </label>
                  <input
                    id={field.name}
                    type="password"
                    autoComplete="current-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-forest/20 bg-white px-4 py-3 text-forest placeholder:text-forest/30 focus:border-amber-food focus:outline-none focus:ring-2 focus:ring-amber-food/20 transition-all"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            {/* Submit */}
            <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
              {({ canSubmit, isSubmitting }) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isPending}
                  className="w-full rounded-lg bg-forest py-3.5 text-sm font-semibold text-cream tracking-wide hover:bg-forest-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2"
                >
                  {isSubmitting || isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
                </button>
              )}
            </form.Subscribe>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-forest/10" />
            <span className="text-xs text-forest/30 uppercase tracking-widest">o</span>
            <div className="h-px flex-1 bg-forest/10" />
          </div>

          <p className="text-center text-xs text-forest/40">
            Al iniciar sesión aceptás nuestros{' '}
            <span className="underline cursor-default">Términos de uso</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
