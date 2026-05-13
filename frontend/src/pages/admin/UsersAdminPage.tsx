import { useState } from 'react'
import type { UsuarioListItem, UsuarioUpdateRequest } from '@/entities/usuarios/types'
import { parseHttpError } from '@/shared/lib/http/parseHttpError'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'
import { useCambiarEstadoUsuario, useCambiarRoles, useEditarUsuario, useUsuariosList } from '@/shared/hooks/useUsuarios'

const ALL_ROLES = ['ADMIN', 'STOCK', 'PEDIDOS', 'CLIENT']

function RoleBadge({ rol }: { rol: string }) {
  const colors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    STOCK: 'bg-blue-100 text-blue-700',
    PEDIDOS: 'bg-orange-100 text-orange-700',
    CLIENT: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[rol] ?? 'bg-gray-100 text-gray-600'}`}>
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
  const [selectedRole, setSelectedRole] = useState(usuario.roles[0] ?? 'CLIENT')
  const [error, setError] = useState<string | null>(null)

  const isPending = editarUsuario.isPending || cambiarRoles.isPending

  const handleSave = async () => {
    setError(null)
    try {
      const data: UsuarioUpdateRequest = { nombre, apellido, email }
      await editarUsuario.mutateAsync({ id: usuario.id, data })
      if (selectedRole !== (usuario.roles[0] ?? '')) {
        await cambiarRoles.mutateAsync({ id: usuario.id, data: { roles: [selectedRole] } })
      }
      addToast({ type: 'success', message: 'Usuario actualizado.' })
      onClose()
    } catch (err) {
      setError(parseHttpError(err).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Editar usuario</h2>

        <div className="mt-4 space-y-3">
          {[
            { label: 'Nombre', value: nombre, set: setNombre },
            { label: 'Apellido', value: apellido, set: setApellido },
            { label: 'Email', value: email, set: setEmail },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="text-xs font-medium text-gray-600">{label}</label>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          ))}

          <div>
            <label htmlFor="usuario-rol" className="text-xs font-medium text-gray-600">
              Rol
            </label>
            <select
              id="usuario-rol"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              {ALL_ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !selectedRole}
            className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:bg-gray-300"
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
      <h1 className="text-2xl font-bold text-gray-900">Gestión de usuarios</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={rol}
          onChange={(e) => { setRol(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los roles</option>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading && (
          <p className="px-6 py-8 text-center text-sm text-gray-500">Cargando usuarios...</p>
        )}
        {isError && (
          <p className="px-6 py-8 text-center text-sm text-red-600">Error al cargar usuarios.</p>
        )}
        {!isLoading && !isError && data && (
          <>
            {data.items.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">No se encontraron usuarios.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Nombre', 'Email', 'Roles', 'Estado', 'Registro', 'Acciones'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.items.map((u) => (
                    <tr key={u.id} className={u.activo ? '' : 'bg-gray-50 opacity-70'}>
                      <td className="px-4 py-3 font-medium text-gray-900">{u.nombre} {u.apellido}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => <RoleBadge key={r} rol={r} />)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleEstado(u)}
                            disabled={u.id === currentUserId}
                            className="rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500">{data.total} usuarios · página {data.page} de {data.pages}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="rounded border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {editingUser && <EditModal usuario={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  )
}
