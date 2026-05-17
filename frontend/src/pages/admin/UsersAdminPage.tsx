import { useState } from 'react'
import type { UsuarioListItem, UsuarioUpdateRequest } from '@/entities/usuarios/types'
import { parseHttpError } from '@/shared/lib/http/parseHttpError'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'
import { useCambiarEstadoUsuario, useCambiarRoles, useEditarUsuario, useUsuariosList } from '@/shared/hooks/useUsuarios'

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STOCK', label: 'Stock' },
  { value: 'PEDIDOS', label: 'Pedidos' },
  { value: 'STOCK+PEDIDOS', label: 'Stock + Pedidos' },
  { value: 'CLIENT', label: 'Cliente' },
]

function getInitialRoleValue(roles: string[]): string {
  if (roles.includes('STOCK') && roles.includes('PEDIDOS')) return 'STOCK+PEDIDOS'
  return roles[0] ?? 'CLIENT'
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-4 py-3"><div className="h-4 w-36 rounded bg-surface-higher" /></td>
          <td className="px-4 py-3"><div className="h-4 w-48 rounded bg-surface-higher" /></td>
          <td className="px-4 py-3"><div className="h-5 w-16 rounded bg-surface-higher" /></td>
          <td className="px-4 py-3"><div className="h-5 w-14 rounded bg-surface-higher" /></td>
          <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-surface-higher" /></td>
          <td className="px-4 py-3"><div className="h-7 w-28 rounded bg-surface-higher" /></td>
        </tr>
      ))}
    </>
  )
}

function RoleBadge({ rol }: { rol: string }) {
  const colors: Record<string, string> = {
    ADMIN: 'bg-violet-500/20 text-violet-300',
    STOCK: 'bg-success/20 text-success',
    PEDIDOS: 'bg-warning/20 text-warning',
    CLIENT: 'bg-surface-high text-ink-muted',
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[rol] ?? 'bg-surface-high text-ink-muted'}`}>
      {rol}
    </span>
  )
}

interface EditModalProps {
  usuario: UsuarioListItem
  onClose: () => void
}

function EditModal({ usuario, onClose }: EditModalProps) {
  const addToast = useUiStore((s) => s.addToast)
  const editarUsuario = useEditarUsuario()
  const cambiarRoles = useCambiarRoles()

  const [nombre, setNombre] = useState(usuario.nombre)
  const [apellido, setApellido] = useState(usuario.apellido)
  const [email, setEmail] = useState(usuario.email)
  const [selectedRole, setSelectedRole] = useState(getInitialRoleValue(usuario.roles))
  const [error, setError] = useState<string | null>(null)

  const isPending = editarUsuario.isPending || cambiarRoles.isPending

  const handleSave = async () => {
    setError(null)
    try {
      const data: UsuarioUpdateRequest = { nombre, apellido, email }
      await editarUsuario.mutateAsync({ id: usuario.id, data })
      const rolesPayload = selectedRole === 'STOCK+PEDIDOS' ? ['STOCK', 'PEDIDOS'] : [selectedRole]
      const currentValue = getInitialRoleValue(usuario.roles)
      if (selectedRole !== currentValue) {
        await cambiarRoles.mutateAsync({ id: usuario.id, data: { roles: rolesPayload } })
      }
      addToast({ type: 'success', message: 'Usuario actualizado.' })
      onClose()
    } catch (err) {
      setError(parseHttpError(err).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-line-subtle bg-surface-base p-6 shadow-dropdown">
        <h2 className="text-lg font-semibold text-ink">Editar usuario</h2>

        <div className="mt-4 space-y-3">
          {[
            { label: 'Nombre', value: nombre, set: setNombre },
            { label: 'Apellido', value: apellido, set: setApellido },
            { label: 'Email', value: email, set: setEmail },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-xs font-medium text-ink-muted">{label}</label>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                className="mt-1 w-full rounded border border-line-subtle bg-surface-low px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50"
              />
            </div>
          ))}

          <div>
            <label htmlFor="usuario-rol" className="text-xs font-medium text-ink-muted">
              Rol
            </label>
            <select
              id="usuario-rol"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mt-1 w-full rounded border border-line-subtle bg-surface-low px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line-subtle px-4 py-2 text-sm text-ink hover:bg-surface-high"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !selectedRole}
            className="rounded bg-brand px-4 py-2 text-sm font-semibold text-brand-on hover:bg-brand-dim disabled:bg-surface-higher disabled:text-ink-muted"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function UsersAdminPage() {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const addToast = useUiStore((s) => s.addToast)
  const cambiarEstado = useCambiarEstadoUsuario()

  const [q, setQ] = useState('')
  const [rol, setRol] = useState('')
  const [page, setPage] = useState(1)
  const [editingUser, setEditingUser] = useState<UsuarioListItem | null>(null)

  const { data, isLoading, isError } = useUsuariosList({ q: q || undefined, rol: rol || undefined, page, size: 20 })

  const handleToggleEstado = async (usuario: UsuarioListItem) => {
    const accion = usuario.activo ? 'desactivar' : 'activar'
    if (usuario.activo && !window.confirm(`¿Desactivar a ${usuario.nombre} ${usuario.apellido}?`)) return
    try {
      await cambiarEstado.mutateAsync({ id: usuario.id, data: { activo: !usuario.activo } })
      addToast({ type: 'success', message: `Usuario ${accion === 'activar' ? 'activado' : 'desactivado'}.` })
    } catch (err) {
      addToast({ type: 'error', message: parseHttpError(err).message })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-ink">Gestión de usuarios</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          className="w-64 rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        <select
          value={rol}
          onChange={(e) => { setRol(e.target.value); setPage(1) }}
          className="rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink"
        >
          <option value="">Todos los roles</option>
          {ROLE_OPTIONS.filter((o) => o.value !== 'STOCK+PEDIDOS').map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isError && (
        <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Error al cargar usuarios.
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-line-subtle bg-surface-base shadow-card-sm">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line-subtle text-sm">
          <thead className="bg-surface-low">
            <tr>
              {['Nombre', 'Email', 'Roles', 'Estado', 'Registro', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {isLoading ? (
              <SkeletonRows />
            ) : !isError && (data?.items.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-ink-muted">
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              data?.items.map((u) => (
                <tr key={u.id} className={u.activo ? 'hover:bg-surface-high' : 'bg-surface-low opacity-70'}>
                  <td className="px-4 py-3 font-medium text-ink">{u.nombre} {u.apellido}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => <RoleBadge key={r} rol={r} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${u.activo ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(u.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="rounded border border-line-subtle px-2 py-1 text-xs text-ink hover:bg-surface-high"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleEstado(u)}
                        disabled={u.id === currentUserId}
                        className="rounded border border-line-subtle px-2 py-1 text-xs text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:bg-surface-high"
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-line-subtle px-4 py-3">
            <p className="text-xs text-ink-muted">{data.total} usuarios · página {data.page} de {data.pages}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-line-subtle px-3 py-1 text-xs text-ink disabled:opacity-40 hover:bg-surface-high"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="rounded border border-line-subtle px-3 py-1 text-xs text-ink disabled:opacity-40 hover:bg-surface-high"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {editingUser && <EditModal usuario={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  )
}
