import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '@/shared/hooks/useAuth'
import { useUiStore } from '@/shared/stores/uiStore'

function FieldError({ errors }: { errors: unknown[] }) {
  if (!errors.length) return null
  return <p className="text-danger text-xs mt-1">{String(errors[0])}</p>
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all'

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const addToast = useUiStore((s) => s.addToast)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
        if (!axiosErr.response) return
        const detail = axiosErr.response?.data?.detail
        addToast({ message: detail ?? 'No se pudo crear la cuenta.', type: 'error' })
      }
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
          <Link
            to="/login"
            className="flex-1 pb-3 text-center text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Iniciar sesión
          </Link>
          <div className="flex-1 border-b-2 border-brand pb-3 text-center text-sm font-semibold text-brand">
            Registrarse
          </div>
        </div>

        {/* Form body */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-4 p-8"
        >
          {/* Nombre + Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="nombre"
              validators={{ onChange: ({ value }) => (!value.trim() ? 'Requerido' : undefined) }}
            >
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-ink-muted mb-1.5">Nombre</label>
                  <input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Ej: María"
                    className={inputCls}
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
                  <label className="block text-sm font-medium text-ink-muted mb-1.5">Apellido</label>
                  <input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Ej: García"
                    className={inputCls}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>
          </div>

          {/* Email */}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value.includes('@') ? 'Email inválido' : undefined,
            }}
          >
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1.5">Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-muted/50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
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
              onChange: ({ value }) =>
                value.length < 8 ? 'Mínimo 8 caracteres' : undefined,
            }}
          >
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1.5">Contraseña</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-muted/50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Mínimo 8 caracteres"
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute inset-y-0 right-3.5 flex items-center text-ink-muted/50 hover:text-ink-muted transition-colors"
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <EyeIcon open={showPass} />
                  </button>
                </div>
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Confirmar */}
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
                <label className="block text-sm font-medium text-ink-muted mb-1.5">
                  Confirmá la contraseña
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-muted/50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Repetí tu contraseña"
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3.5 flex items-center text-ink-muted/50 hover:text-ink-muted transition-colors"
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          {/* Submit */}
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="mt-2 w-full rounded-lg bg-brand py-3.5 text-sm font-semibold text-brand-on tracking-wide hover:bg-brand-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-surface-base"
              >
                {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  )
}
