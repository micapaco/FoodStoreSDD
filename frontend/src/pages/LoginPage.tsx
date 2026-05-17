import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useLogin } from '@/shared/hooks/useAuth'
import { resolvePostLoginPath } from '@/shared/lib/auth/roles'
import { getSafeUserRoles } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'

function FieldError({ errors }: { errors: unknown[] }) {
  const msgs = errors.filter(Boolean) as string[]
  if (!msgs.length) return null
  return <p className="mt-1 text-xs text-danger">{msgs[0]}</p>
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const addToast = useUiStore((s) => s.addToast)
  const { mutate: login, isPending } = useLogin()
  const [showPass, setShowPass] = useState(false)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      login(value, {
        onSuccess: ({ user }) => {
          const from = searchParams.get('from')
          const roles = getSafeUserRoles(user)
          navigate(resolvePostLoginPath(roles, from), { replace: true })
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { detail?: string } } }
          if (!axiosErr.response) return
          const detail = axiosErr.response.data?.detail
          addToast({ type: 'error', message: detail ?? 'Credenciales incorrectas. Revisá tus datos.' })
        },
      })
    },
  })

  return (
    <div
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12"
      style={{ backgroundImage: 'url(/auth-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-surface-base/75 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-surface-base/80 backdrop-blur-xl shadow-2xl overflow-hidden">

        {/* Logo strip */}
        <div className="flex flex-col items-center pt-8 pb-6 px-8">
          <p className="text-xs tracking-[0.35em] uppercase text-ink-muted/60 mb-1">Food Store</p>
          <span className="font-display text-2xl font-bold tracking-widest text-brand uppercase">
            Food Store
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-8">
          <div className="flex-1 border-b-2 border-brand pb-3 text-center text-sm font-semibold text-brand">
            Iniciar sesión
          </div>
          <Link
            to="/register"
            className="flex-1 pb-3 text-center text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Registrarse
          </Link>
        </div>

        {/* Form body */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4 p-8"
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
                <label htmlFor={field.name} className="block text-sm font-medium text-ink-muted mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-muted/50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    id={field.name}
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="tu@email.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor={field.name} className="text-sm font-medium text-ink-muted">
                    Contraseña
                  </label>
                  <span className="text-xs text-brand/70 cursor-default">
                    ¿Olvidé mi contraseña?
                  </span>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-muted/50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    id={field.name}
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute inset-y-0 right-3.5 flex items-center text-ink-muted/50 hover:text-ink-muted transition-colors"
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
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
                className="mt-2 w-full rounded-lg bg-brand py-3.5 text-sm font-semibold text-brand-on tracking-wide hover:bg-brand-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-surface-base"
              >
                {isSubmitting || isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
              </button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  )
}
