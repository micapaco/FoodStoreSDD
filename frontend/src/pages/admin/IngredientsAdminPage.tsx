import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useCreateIngrediente,
  useDeleteIngrediente,
  useIngredientesList,
  useUpdateIngrediente,
} from '@/features/ingredientes/hooks/useIngredientes'
import type { IngredienteRead } from '@/entities/ingredientes/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Badge } from '@/shared/ui/Badge'
import { parseHttpError } from '@/shared/lib/http/parseHttpError'
import { useUiStore } from '@/shared/stores/uiStore'

const PAGE_SIZES = [10, 20, 50]

interface IngredienteFormValues {
  nombre: string
  es_alergeno: boolean
}

interface IngredienteFormModalProps {
  open: boolean
  ingrediente: IngredienteRead | null
  isPending: boolean
  onSubmit: (values: IngredienteFormValues) => void
  onCancel: () => void
}

interface DeleteModalProps {
  ingrediente: IngredienteRead | null
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 w-44 rounded bg-surface-higher" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-24 rounded-full bg-surface-higher" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 rounded bg-surface-higher" />
          </td>
          <td className="px-4 py-3">
            <div className="ml-auto h-8 w-28 rounded bg-surface-higher" />
          </td>
        </tr>
      ))}
    </>
  )
}

function IngredienteFormModal({
  open,
  ingrediente,
  isPending,
  onSubmit,
  onCancel,
}: IngredienteFormModalProps) {
  const [nombre, setNombre] = useState(ingrediente?.nombre ?? '')
  const [esAlergeno, setEsAlergeno] = useState(ingrediente?.es_alergeno ?? false)
  const trimmedName = nombre.trim()
  const nameError =
    trimmedName.length === 0
      ? 'El nombre es requerido'
      : trimmedName.length > 100
        ? 'Maximo 100 caracteres'
        : undefined

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-line-subtle bg-surface-base p-6 shadow-dropdown">
        <h2 className="text-lg font-semibold text-ink">
          {ingrediente ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        </h2>
        <form
          className="mt-5 space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (nameError) return
            onSubmit({ nombre: trimmedName, es_alergeno: esAlergeno })
          }}
        >
          <Input
            id="ingrediente-nombre"
            label="Nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            error={nameError}
            placeholder="Ej: Queso"
            maxLength={100}
          />

          <label className="flex items-center gap-3 rounded-lg border border-line-subtle bg-surface-low px-4 py-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={esAlergeno}
              onChange={(event) => setEsAlergeno(event.target.checked)}
              className="h-4 w-4 rounded border-line-subtle text-brand focus:ring-brand/20"
            />
            <span className="font-medium">Marcar como alergeno</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!!nameError || isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteModal({ ingrediente, isPending, onConfirm, onCancel }: DeleteModalProps) {
  if (!ingrediente) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg border border-line-subtle bg-surface-base p-6 shadow-dropdown">
        <h2 className="text-lg font-semibold text-ink">Confirmar eliminacion</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Se eliminara <strong className="text-ink">{ingrediente.nombre}</strong>. Dejara de aparecer para nuevas
          asociaciones, sin borrar registros historicos.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function IngredientsAdminPage() {
  const addToast = useUiStore((state) => state.addToast)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({ page: 1, size: 20 })
  const [alergenoFilter, setAlergenoFilter] = useState<'all' | 'true' | 'false'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingIngrediente, setEditingIngrediente] = useState<IngredienteRead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IngredienteRead | null>(null)

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [])

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      q: debouncedSearch.trim() || undefined,
      alergeno:
        alergenoFilter === 'all'
          ? undefined
          : alergenoFilter === 'true',
    }),
    [alergenoFilter, debouncedSearch, filters],
  )

  const listQuery = useIngredientesList(effectiveFilters)
  const createIngrediente = useCreateIngrediente()
  const updateIngrediente = useUpdateIngrediente()
  const deleteIngrediente = useDeleteIngrediente()

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setFilters((current) => ({ ...current, page: 1 }))
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  const openCreateForm = () => {
    setEditingIngrediente(null)
    setFormOpen(true)
  }

  const openEditForm = (ingrediente: IngredienteRead) => {
    setEditingIngrediente(ingrediente)
    setFormOpen(true)
  }

  const handleSubmit = (values: IngredienteFormValues) => {
    if (editingIngrediente) {
      updateIngrediente.mutate(
        { id: editingIngrediente.id, data: values },
        {
          onSuccess: () => {
            addToast({ type: 'success', message: 'Ingrediente actualizado correctamente' })
            setFormOpen(false)
            setEditingIngrediente(null)
          },
          onError: (error) => addToast({ type: 'error', message: parseHttpError(error).message }),
        },
      )
      return
    }

    createIngrediente.mutate(values, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Ingrediente creado correctamente' })
        setFormOpen(false)
      },
      onError: (error) => addToast({ type: 'error', message: parseHttpError(error).message }),
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteIngrediente.mutate(deleteTarget.id, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Ingrediente eliminado correctamente' })
        setDeleteTarget(null)
      },
      onError: (error) => addToast({ type: 'error', message: parseHttpError(error).message }),
    })
  }

  const data = listQuery.data

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Ingredientes</h1>
          <p className="mt-1 text-sm text-ink-muted">Gestion de ingredientes y alergenos del catalogo</p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          Nuevo ingrediente
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <input
            type="search"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar ingredientes..."
            className="w-full rounded-lg border border-line-subtle bg-surface-low py-2 pl-4 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <select
          value={alergenoFilter}
          onChange={(event) => {
            setAlergenoFilter(event.target.value as 'all' | 'true' | 'false')
            setFilters((current) => ({ ...current, page: 1 }))
          }}
          className="rounded-lg border border-line-subtle bg-surface-low px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="all">Todos</option>
          <option value="true">Solo alergenos</option>
          <option value="false">Sin alergeno</option>
        </select>
      </div>

      {listQuery.isError && (
        <div className="mt-6 rounded-lg border border-danger/30 bg-danger/10 p-6 text-center">
          <p className="font-medium text-danger">
            {parseHttpError(listQuery.error).message}
          </p>
          <Button
            type="button"
            variant="danger"
            className="mt-3"
            onClick={() => listQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-line-subtle bg-surface-base shadow-card-sm">
        <table className="min-w-full divide-y divide-line-subtle">
          <thead className="bg-surface-low">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Alergeno
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Actualizado
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {listQuery.isLoading ? (
              <SkeletonRows />
            ) : data && data.items.length > 0 ? (
              data.items.map((ingrediente) => (
                <tr key={ingrediente.id} className="transition-colors hover:bg-surface-high">
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="text-sm font-medium text-ink">{ingrediente.nombre}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge variant={ingrediente.es_alergeno ? 'warning' : 'info'}>
                      {ingrediente.es_alergeno ? 'Alergeno' : 'No alergeno'}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                    {formatDate(ingrediente.updated_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditForm(ingrediente)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(ingrediente)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center">
                  <p className="text-sm font-medium text-ink-muted">No se encontraron ingredientes</p>
                  <Button type="button" className="mt-4" onClick={openCreateForm}>
                    Crear ingrediente
                  </Button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.pages > 0 && (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span>Mostrar</span>
            <select
              value={filters.size}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  size: Number(event.target.value),
                  page: 1,
                }))
              }
              className="rounded border border-line-subtle bg-surface-low px-2 py-1 text-sm text-ink"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              de {data.total} resultados (pag. {data.page} de {data.pages})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(data.pages, 5) }, (_, index) => {
              const start = Math.max(1, data.page - 2)
              const pageNumber = start + index
              if (pageNumber > data.pages) return null
              return (
                <Button
                  key={pageNumber}
                  type="button"
                  variant={pageNumber === data.page ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilters((current) => ({ ...current, page: pageNumber }))}
                >
                  {pageNumber}
                </Button>
              )
            })}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={data.page >= data.pages}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <IngredienteFormModal
        key={editingIngrediente?.id ?? 'new'}
        open={formOpen}
        ingrediente={editingIngrediente}
        isPending={createIngrediente.isPending || updateIngrediente.isPending}
        onSubmit={handleSubmit}
        onCancel={() => {
          setFormOpen(false)
          setEditingIngrediente(null)
        }}
      />
      <DeleteModal
        ingrediente={deleteTarget}
        isPending={deleteIngrediente.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
