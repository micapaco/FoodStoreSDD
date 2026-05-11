import { useMemo, useState } from 'react'
import { useUiStore } from '@/shared/stores/uiStore'
import type { DireccionRead } from '@/entities/direcciones/types'
import {
  useAddressesQuery,
  useCreateAddress,
  useDeleteAddress,
  useSetPrincipalAddress,
  useUpdateAddress,
} from '@/features/direcciones/hooks/useDirecciones'
import { DireccionForm } from '@/features/direcciones/components/DireccionForm'

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
      </div>
      <div className="mt-4 h-8 w-40 rounded bg-gray-200" />
    </div>
  )
}

function formatDireccion(d: DireccionRead) {
  return `${d.linea1} — ${d.linea2}`
}

export function DireccionesPage() {
  const addToast = useUiStore((s) => s.addToast)
  const [page, setPage] = useState(1)
  const page_size = 10

  const { data, isLoading, isError, refetch, isFetching } = useAddressesQuery({ page, page_size })
  const createMut = useCreateAddress()
  const updateMut = useUpdateAddress()
  const deleteMut = useDeleteAddress()
  const principalMut = useSetPrincipalAddress()

  const [mode, setMode] = useState<'closed' | 'create' | 'edit'>('closed')
  const [editTarget, setEditTarget] = useState<DireccionRead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DireccionRead | null>(null)

  const total = data?.total ?? 0
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / page_size)), [total, page_size])
  const items = data?.items ?? []

  const canPrev = page > 1
  const canNext = page < totalPages

  const closeForm = () => {
    setMode('closed')
    setEditTarget(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis direcciones</h1>
          <p className="mt-1 text-sm text-gray-500">Gestioná tus direcciones de entrega</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode('create')
            setEditTarget(null)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Nueva dirección
        </button>
      </div>

      {/* Create / Edit panel */}
      {mode !== 'closed' && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'Crear dirección' : 'Editar dirección'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
          <DireccionForm
            initialValues={editTarget ?? undefined}
            isPending={createMut.isPending || updateMut.isPending}
            onCancel={closeForm}
            onSubmit={(values) => {
              if (mode === 'create') {
                createMut.mutate(values, {
                  onSuccess: () => {
                    addToast({ type: 'success', message: 'Dirección creada correctamente.' })
                    closeForm()
                  },
                  onError: () => addToast({ type: 'error', message: 'Error al crear la dirección.' }),
                })
              } else if (mode === 'edit' && editTarget) {
                updateMut.mutate(
                  { id: editTarget.id, data: values },
                  {
                    onSuccess: () => {
                      addToast({ type: 'success', message: 'Dirección actualizada correctamente.' })
                      closeForm()
                    },
                    onError: () => addToast({ type: 'error', message: 'Error al actualizar la dirección.' }),
                  },
                )
              }
            }}
          />
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
            <p className="mt-2 text-sm text-gray-600">
              ¿Eliminar <strong>{deleteTarget.alias}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMut.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMut.mutate(deleteTarget.id, {
                    onSuccess: () => {
                      addToast({ type: 'success', message: 'Dirección eliminada.' })
                      setDeleteTarget(null)
                    },
                    onError: () => addToast({ type: 'error', message: 'Error al eliminar la dirección.' }),
                  })
                }}
                disabled={deleteMut.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteMut.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mt-6">
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">No se pudieron cargar tus direcciones.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Todavía no tenés direcciones</h3>
            <p className="mt-2 text-sm text-gray-600">Creá una para poder usarla en el checkout.</p>
            <button
              type="button"
              onClick={() => setMode('create')}
              className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Crear mi primera dirección
            </button>
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((d) => (
              <div key={d.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{d.alias}</h3>
                      {d.es_principal && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{formatDireccion(d)}</p>
                    <p className="mt-1 text-sm text-gray-700">{d.ciudad}, {d.provincia} ({d.codigo_postal})</p>
                    <p className="mt-1 text-sm text-gray-500">{d.notas}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {!d.es_principal && (
                    <button
                      type="button"
                      onClick={() => {
                        principalMut.mutate(d.id, {
                          onSuccess: () => addToast({ type: 'success', message: 'Dirección principal actualizada.' }),
                          onError: () => addToast({ type: 'error', message: 'Error al marcar como principal.' }),
                        })
                      }}
                      disabled={principalMut.isPending}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Marcar como principal
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditTarget(d)
                      setMode('edit')
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(d)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && total > page_size && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Página {page} de {totalPages}{isFetching ? ' (actualizando...)' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => canPrev && setPage((p) => p - 1)}
                disabled={!canPrev}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => canNext && setPage((p) => p + 1)}
                disabled={!canNext}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
