import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from '@tanstack/react-form'
import { useProfile, useUpdateProfile, useChangePassword } from '@/shared/hooks/useProfile'

// ─── Field helpers ───────────────────────────────────────────────────────────

function inputCls(error: boolean) {
  return [
    'w-full rounded-lg border px-3 py-2 text-ink placeholder-ink-muted bg-surface-low transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-brand/50',
    error
      ? 'border-danger focus:ring-danger/30'
      : 'border-line-subtle focus:border-brand',
  ].join(' ')
}

function labelCls() {
  return 'block text-sm font-medium text-ink-muted'
}

function errorMsg(msg: string | undefined) {
  return msg ? <p className="mt-1 text-sm text-danger">{msg}</p> : null
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-surface-higher" style={{ width: `${70 + i * 15}%` }} />
      ))}
    </div>
  )
}

// ─── ProfilePage ─────────────────────────────────────────────────────────────

export function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const [editing, setEditing] = useState(false)
  const formInitialized = useRef(false)

  // ── Profile edit form ──────────────────────────────────────────────────
  const profileForm = useForm({
    defaultValues: {
      nombre: profile?.nombre ?? '',
      apellido: profile?.apellido ?? '',
      email: profile?.email ?? '',
      telefono: profile?.telefono ?? '',
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProfile.mutateAsync({
          nombre: value.nombre,
          apellido: value.apellido,
          email: value.email,
          telefono: value.telefono || null,
        })
        setEditing(false)
      } catch {
        // Toast already handled by onError in the mutation hook
      }
    },
  })

  // ── Change password form ───────────────────────────────────────────────
  const passwordForm = useForm({
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    validators: {
      onChange: ({ value }) => {
        if (value.confirm_password && value.new_password !== value.confirm_password) {
          return 'Las contraseñas nuevas no coinciden.'
        }
        if (value.new_password && value.current_password === value.new_password) {
          return 'La nueva contraseña debe ser diferente a la actual.'
        }
        if (
          profile?.email &&
          value.new_password &&
          value.new_password.toLowerCase().includes(profile.email.toLowerCase())
        ) {
          return 'La contraseña no puede contener tu email.'
        }
        return undefined
      },
    },
    onSubmit: async ({ value }) => {
      try {
        await changePassword.mutateAsync({
          current_password: value.current_password,
          new_password: value.new_password,
          confirm_password: value.confirm_password,
        })
        passwordForm.reset()
      } catch {
        // Toast already handled by onError in the mutation hook
      }
    },
  })

  // ── Reset form defaults when entering edit mode with real data ───────
  useEffect(() => {
    if (editing && profile && !formInitialized.current) {
      profileForm.reset({
        nombre: profile.nombre,
        apellido: profile.apellido,
        email: profile.email,
        telefono: profile.telefono ?? '',
      })
      formInitialized.current = true
    }
    if (!editing) {
      formInitialized.current = false
    }
  }, [editing, profile, profileForm])

  // ── Loading state ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-line-subtle bg-surface-base p-8 shadow-card-sm">
          <div className="mb-6 h-7 w-40 rounded bg-surface-higher" />
          <SkeletonBlock lines={4} />
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-line-subtle bg-surface-base p-8 text-center shadow-card-sm">
          <p className="text-ink-muted">No se pudieron cargar los datos del perfil.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-on hover:bg-brand-dim"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ── View mode ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        {/* Datos personales */}
        <div className="rounded-xl border border-line-subtle bg-surface-base p-8 shadow-card-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">Datos personales</h2>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-on hover:bg-brand-dim"
            >
              Editar
            </button>
          </div>

          <dl className="mt-6 space-y-4">
            <div>
              <dt className={labelCls()}>Nombre</dt>
              <dd className="mt-1 text-ink">{profile?.nombre} {profile?.apellido}</dd>
            </div>
            <div>
              <dt className={labelCls()}>Email</dt>
              <dd className="mt-1 text-ink">{profile?.email}</dd>
            </div>
            <div>
              <dt className={labelCls()}>Teléfono</dt>
              <dd className="mt-1 text-ink">{profile?.telefono ?? <span className="text-ink-muted">—</span>}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 rounded-xl border border-line-subtle bg-surface-base p-8 shadow-card-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">Direcciones de entrega</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Administra tus direcciones guardadas y elegi cual usar como principal para el checkout.
              </p>
            </div>
            <Link
              to="/direcciones"
              className="inline-flex items-center justify-center rounded-lg border border-line-subtle px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-high"
            >
              Administrar direcciones
            </Link>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="mt-8 rounded-xl border border-line-subtle bg-surface-base p-8 shadow-card-sm">
          <h2 className="text-xl font-semibold text-ink">Cambiar contraseña</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              passwordForm.handleSubmit()
            }}
            className="mt-6 space-y-4"
          >
            <passwordForm.Field
              name="current_password"
              validators={{
                onChange: ({ value }) => (value.length === 0 ? 'La contraseña actual es requerida.' : undefined),
              }}
            >
              {(field) => (
                <div>
                  <label htmlFor={field.name} className={labelCls()}>Contraseña actual</label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
                    autoComplete="current-password"
                  />
                  {field.state.meta.isTouched && errorMsg(field.state.meta.errors.join(', '))}
                </div>
              )}
            </passwordForm.Field>

            <passwordForm.Field
              name="new_password"
              validators={{
                onChange: ({ value }) => {
                  if (value.length < 8) return 'Mínimo 8 caracteres.'
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label htmlFor={field.name} className={labelCls()}>Nueva contraseña</label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
                    autoComplete="new-password"
                  />
                  {field.state.meta.isTouched && errorMsg(field.state.meta.errors.join(', '))}
                </div>
              )}
            </passwordForm.Field>

            <passwordForm.Field
              name="confirm_password"
              validators={{
                onChange: ({ value }) => {
                  if (value.length === 0) return 'Confirmá la nueva contraseña.'
                  return undefined
                },
                onSubmit: ({ value }) => {
                  if (value.length === 0) return 'Confirmá la nueva contraseña.'
                  return undefined
                },
              }}
            >
              {(field) => (
                <div>
                  <label htmlFor={field.name} className={labelCls()}>Confirmar nueva contraseña</label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
                    autoComplete="new-password"
                  />
                  {field.state.meta.isTouched && errorMsg(field.state.meta.errors.join(', '))}
                </div>
              )}
            </passwordForm.Field>

            {/* Form-level errors (passwords don't match, etc.) */}
            <passwordForm.Subscribe
              selector={(state) => ({ errors: state.errors, canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
            >
              {({ errors, canSubmit, isSubmitting }) => (
                <>
                  {errors.length > 0 && (
                    <p className="text-sm text-danger">{errors.join(', ')}</p>
                  )}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-on hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando…' : 'Cambiar contraseña'}
                  </button>
                </>
              )}
            </passwordForm.Subscribe>
          </form>
        </div>
      </div>
    )
  }

  // ── Edit mode ───────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="mb-6 flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al perfil
      </button>
      <div className="rounded-xl border border-line-subtle bg-surface-base p-8 shadow-card-sm">
        <h2 className="text-xl font-semibold text-ink">Editar perfil</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            profileForm.handleSubmit()
          }}
          className="mt-6 space-y-4"
        >
          <profileForm.Field
            name="nombre"
            validators={{
              onChange: ({ value }) => (value.length < 1 ? 'El nombre es requerido.' : undefined),
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className={labelCls()}>Nombre</label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
                />
                {field.state.meta.isTouched && errorMsg(field.state.meta.errors.join(', '))}
              </div>
            )}
          </profileForm.Field>

          <profileForm.Field
            name="apellido"
            validators={{
              onChange: ({ value }) => (value.length < 1 ? 'El apellido es requerido.' : undefined),
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className={labelCls()}>Apellido</label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
                />
                {field.state.meta.isTouched && errorMsg(field.state.meta.errors.join(', '))}
              </div>
            )}
          </profileForm.Field>

          <profileForm.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'El email es requerido.'
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido.'
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className={labelCls()}>Email</label>
                <input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
                  autoComplete="email"
                />
                {field.state.meta.isTouched && errorMsg(field.state.meta.errors.join(', '))}
              </div>
            )}
          </profileForm.Field>

          <profileForm.Field
            name="telefono"
            validators={{
              onChange: ({ value }) => {
                if (value && value.length > 20) return 'Máximo 20 caracteres.'
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className={labelCls()}>Teléfono</label>
                <input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className={inputCls(!!field.state.meta.errors.length && field.state.meta.isTouched)}
                  autoComplete="tel"
                />
                {field.state.meta.isTouched && errorMsg(field.state.meta.errors.join(', '))}
              </div>
            )}
          </profileForm.Field>

          <profileForm.Subscribe
            selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
          >
            {({ canSubmit, isSubmitting }) => (
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-on hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-line-subtle px-4 py-2 text-sm font-medium text-ink hover:bg-surface-high"
                >
                  Cancelar
                </button>
              </div>
            )}
          </profileForm.Subscribe>
        </form>
      </div>
    </div>
  )
}
