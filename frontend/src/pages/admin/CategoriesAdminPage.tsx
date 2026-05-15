import { useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import {
  useCategoriasList,
  useCategoriasTree,
  useCreateCategoria,
  useDeleteCategoria,
  useUpdateCategoria,
} from '@/shared/hooks/useCategorias'
import { useUiStore } from '@/shared/stores/uiStore'
import type { CategoriaRead } from '@/entities/categorias/types'

interface CategoryOption {
  id: number
  nombre: string
  parent_id: number | null
  label: string
  depth: number
  updated_at: string
}

interface CategoryFormValues {
  nombre: string
  parent_id: number | null
}

interface CategoryFormModalProps {
  open: boolean
  categoria: CategoriaRead | null
  options: CategoryOption[]
  isPending: boolean
  onSubmit: (values: CategoryFormValues) => void
  onCancel: () => void
}

interface DeleteModalProps {
  categoria: CategoriaRead | null
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

const EMPTY_CATEGORIES: CategoriaRead[] = []

function flattenCategories(categories: CategoriaRead[], depth = 0): CategoryOption[] {
  return categories.flatMap((categoria) => [
    {
      id: categoria.id,
      nombre: categoria.nombre,
      parent_id: categoria.parent_id,
      label: `${'  '.repeat(depth)}${categoria.nombre}`,
      depth,
      updated_at: categoria.updated_at,
    },
    ...flattenCategories(categoria.children, depth + 1),
  ])
}

function collectDescendantIds(categoria: CategoriaRead | null): Set<number> {
  const ids = new Set<number>()
  const visit = (node: CategoriaRead) => {
    node.children.forEach((child) => {
      ids.add(child.id)
      visit(child)
    })
  }
  if (categoria) visit(categoria)
  return ids
}

function findCategory(categories: CategoriaRead[], id: number): CategoriaRead | null {
  for (const categoria of categories) {
    if (categoria.id === id) return categoria
    const child = findCategory(categoria.children, id)
    if (child) return child
  }
  return null
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function FieldError({ errors }: { errors: unknown[] }) {
  const message = errors.find((error): error is string => typeof error === 'string')
  if (!message) return null
  return <p className="mt-1 text-xs text-danger">{message}</p>
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 w-40 rounded bg-surface-higher" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 rounded bg-surface-higher" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 rounded bg-surface-higher" />
          </td>
          <td className="px-4 py-3">
            <div className="ml-auto h-8 w-20 rounded bg-surface-higher" />
          </td>
        </tr>
      ))}
    </>
  )
}

function CategoryFormModal({
  open,
  categoria,
  options,
  isPending,
  onSubmit,
  onCancel,
}: CategoryFormModalProps) {
  const descendantIds = useMemo(() => collectDescendantIds(categoria), [categoria])
  const parentOptions = options.filter(
    (option) => option.id !== categoria?.id && !descendantIds.has(option.id),
  )
  const form = useForm({
    defaultValues: {
      nombre: categoria?.nombre ?? '',
      parent_id: categoria?.parent_id ?? null,
    },
    onSubmit: async ({ value }) => {
      onSubmit({
        nombre: value.nombre.trim(),
        parent_id: value.parent_id,
      })
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-lg border border-line-subtle bg-surface-base p-6 shadow-dropdown">
        <h2 className="text-lg font-semibold text-ink">
          {categoria ? 'Editar categoria' : 'Nueva categoria'}
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            form.handleSubmit()
          }}
          className="mt-5 space-y-5"
          noValidate
        >
          <form.Field
            name="nombre"
            validators={{
              onChange: ({ value }) => {
                const trimmed = value.trim()
                if (!trimmed) return 'El nombre es requerido'
                if (trimmed.length > 100) return 'Maximo 100 caracteres'
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium text-ink-muted">
                  Nombre
                </label>
                <input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-line-subtle bg-surface-low px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="Ej: Bebidas"
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="parent_id">
            {(field) => (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium text-ink-muted">
                  Categoria padre
                </label>
                <select
                  id={field.name}
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value ? Number(event.target.value) : null)
                  }
                  className="mt-1 w-full rounded-lg border border-line-subtle bg-surface-low px-4 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">Sin padre</option>
                  {parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-lg border border-line-subtle px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-high disabled:opacity-50"
            >
              Cancelar
            </button>
            <form.Subscribe
              selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
            >
              {({ canSubmit, isSubmitting }) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isPending}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-dim disabled:opacity-50"
                >
                  {isPending ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteModal({ categoria, isPending, onConfirm, onCancel }: DeleteModalProps) {
  if (!categoria) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg border border-line-subtle bg-surface-base p-6 shadow-dropdown">
        <h2 className="text-lg font-semibold text-ink">Confirmar eliminacion</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Se eliminara <strong className="text-ink">{categoria.nombre}</strong>. Si tiene productos o subcategorias
          activas, el backend rechazara la operacion.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-line-subtle px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-high disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-danger-container px-4 py-2 text-sm font-semibold text-danger transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CategoriesAdminPage() {
  const addToast = useUiStore((state) => state.addToast)
  const [editingCategory, setEditingCategory] = useState<CategoriaRead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoriaRead | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const listQuery = useCategoriasList({ page: 1, size: 100 })
  const treeQuery = useCategoriasTree()
  const createCategoria = useCreateCategoria()
  const updateCategoria = useUpdateCategoria()
  const deleteCategoria = useDeleteCategoria()

  const tree = treeQuery.data ?? EMPTY_CATEGORIES
  const options = useMemo(() => flattenCategories(tree), [tree])
  const listOptions = useMemo(
    () =>
      (listQuery.data?.items ?? []).map((categoria) => ({
        id: categoria.id,
        nombre: categoria.nombre,
        parent_id: categoria.parent_id,
        label: categoria.nombre,
        depth: 0,
        updated_at: categoria.updated_at,
      })),
    [listQuery.data?.items],
  )
  const parentNames = useMemo(
    () => new Map(options.map((option) => [option.id, option.nombre])),
    [options],
  )
  const isLoading = listQuery.isLoading || treeQuery.isLoading
  const isError = listQuery.isError || treeQuery.isError
  const flatCategories = options.length > 0 ? options : listOptions

  const openCreateForm = () => {
    setEditingCategory(null)
    setFormOpen(true)
  }

  const openEditForm = (id: number) => {
    const category = findCategory(tree, id) ?? listQuery.data?.items.find((item) => item.id === id)
    if (!category) return
    setEditingCategory(category)
    setFormOpen(true)
  }

  const handleSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateCategoria.mutate(
        { id: editingCategory.id, data: values },
        {
          onSuccess: () => {
            addToast({ type: 'success', message: 'Categoria actualizada correctamente' })
            setFormOpen(false)
            setEditingCategory(null)
          },
          onError: () => addToast({ type: 'error', message: 'No se pudo actualizar la categoria' }),
        },
      )
      return
    }

    createCategoria.mutate(values, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Categoria creada correctamente' })
        setFormOpen(false)
      },
      onError: () => addToast({ type: 'error', message: 'No se pudo crear la categoria' }),
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteCategoria.mutate(deleteTarget.id, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Categoria eliminada correctamente' })
        setDeleteTarget(null)
      },
      onError: () => addToast({ type: 'error', message: 'No se pudo eliminar la categoria' }),
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Categorias</h1>
          <p className="mt-1 text-sm text-ink-muted">Gestion de categorias del catalogo</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-dim"
        >
          Nueva categoria
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line-subtle bg-surface-base px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Activas</p>
          <p className="mt-1 text-2xl font-bold text-ink">{listQuery.data?.total ?? 0}</p>
        </div>
        <div className="rounded-lg border border-line-subtle bg-surface-base px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Raiz</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {options.filter((option) => option.parent_id === null).length}
          </p>
        </div>
        <div className="rounded-lg border border-line-subtle bg-surface-base px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Subcategorias</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {options.filter((option) => option.parent_id !== null).length}
          </p>
        </div>
      </div>

      {isError && (
        <div className="mt-6 rounded-lg border border-danger/30 bg-danger/10 p-6 text-center">
          <p className="font-medium text-danger">Error al cargar categorias</p>
          <button
            type="button"
            onClick={() => {
              listQuery.refetch()
              treeQuery.refetch()
            }}
            className="mt-3 rounded-lg bg-danger-container px-4 py-2 text-sm font-medium text-danger transition-colors hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-line-subtle bg-surface-base">
        <table className="min-w-full divide-y divide-line-subtle">
          <thead className="bg-surface-low">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Padre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Actualizada
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {isLoading ? (
              <SkeletonRows />
            ) : flatCategories.length > 0 ? (
              flatCategories.map((categoria) => (
                <tr key={categoria.id} className="transition-colors hover:bg-surface-high">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${categoria.depth * 16}px` }}>
                      {categoria.depth > 0 && <span className="text-ink-muted/30">-</span>}
                      <span className="text-sm font-medium text-ink">{categoria.nombre}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                    {categoria.parent_id ? parentNames.get(categoria.parent_id) ?? `#${categoria.parent_id}` : 'Sin padre'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                    {formatDate(categoria.updated_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(categoria.id)}
                        className="rounded-lg border border-line-subtle px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-high"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget(
                            findCategory(tree, categoria.id) ??
                              listQuery.data?.items.find((item) => item.id === categoria.id) ??
                              null,
                          )
                        }
                        className="rounded-lg border border-danger/30 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center">
                  <p className="text-sm font-medium text-ink-muted">No hay categorias cargadas</p>
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-on transition-colors hover:bg-brand-dim"
                  >
                    Crear primera categoria
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CategoryFormModal
        key={editingCategory?.id ?? 'new'}
        open={formOpen}
        categoria={editingCategory}
        options={options}
        isPending={createCategoria.isPending || updateCategoria.isPending}
        onSubmit={handleSubmit}
        onCancel={() => {
          setFormOpen(false)
          setEditingCategory(null)
        }}
      />
      <DeleteModal
        categoria={deleteTarget}
        isPending={deleteCategoria.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
