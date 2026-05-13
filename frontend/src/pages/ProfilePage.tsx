import { useEffect, useRef, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useProfile, useUpdateProfile, useChangePassword } from '@/shared/hooks/useProfile'

// ─── Field helpers ───────────────────────────────────────────────────────────

function inputCls(error: boolean) {
  return [
    'w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-400 transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500',
    error
      ? 'border-red-400 focus:ring-red-400'
      : 'border-gray-300',
  ].join(' ')
}

function labelCls() {
  return 'block text-sm font-medium text-gray-700'
}

function errorMsg(msg: string | undefined) {
  return msg ? <p className="mt-1 text-sm text-red-500">{msg}</p> : null
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-gray-200" style={{ width: `${70 + i * 15}%` }} />
      ))}
    </div>
  )
}

// ─── ProfilePage ─────────────────────────────────────────────────────────────

export function ProfilePage() {
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
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="mb-6 h-7 w-40 rounded bg-gray-200" />
          <SkeletonBlock lines={4} />
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">No se pudieron cargar los datos del perfil.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
        {/* Datos personales */}
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Datos personales</h2>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Editar
            </button>
          </div>

          <dl className="mt-6 space-y-4">
            <div>
              <dt className={labelCls()}>Nombre</dt>
              <dd className="mt-1 text-gray-900">{profile?.nombre} {profile?.apellido}</dd>
            </div>
            <div>
              <dt className={labelCls()}>Email</dt>
              <dd className="mt-1 text-gray-900">{profile?.email}</dd>
            </div>
            <div>
              <dt className={labelCls()}>Teléfono</dt>
              <dd className="mt-1 text-gray-900">{profile?.telefono ?? <span className="text-gray-400">—</span>}</dd>
            </div>
          </dl>
        </div>

        {/* Cambiar contraseña */}
        <div className="mt-8 rounded-xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">Cambiar contraseña</h2>

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
                    <p className="text-sm text-red-500">{errors.join(', ')}</p>
                  )}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">Editar perfil</h2>

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
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
