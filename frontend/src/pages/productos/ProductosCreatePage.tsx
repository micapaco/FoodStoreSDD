import { useNavigate, Navigate } from 'react-router-dom'
import { useCreateProducto, useCategorias, useIngredientes } from '@/features/productos/hooks/useProductos'
import { ProductoForm, type ProductoFormValues } from '@/features/productos/components/ProductoForm'
import { getSafeUserRoles, useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'
import type { ProductoCreate } from '@/entities/productos/types'

export function ProductosCreatePage() {
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const isAdmin = getSafeUserRoles(user).includes('ADMIN')
  const { mutate: createProducto, isPending } = useCreateProducto()
  const { data: categorias, isLoading: catLoading } = useCategorias()
  const { data: ingredientes, isLoading: ingLoading } = useIngredientes()

  // Only ADMIN can create products
  if (!isAdmin) {
    return <Navigate to="/403" replace />
  }

  const handleSubmit = (values: ProductoFormValues) => {
    const payload: ProductoCreate = {
      nombre: values.nombre,
      descripcion: values.descripcion || undefined,
      precio_base: values.precio_base,
      stock_cantidad: values.stock_cantidad,
      disponible: values.disponible,
      imagen_url: values.imagen_url || null,
      categoria_ids: values.categoria_ids,
      ingredientes: values.ingredientes,
    }

    createProducto(payload, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Producto creado correctamente' })
        navigate('/admin/productos')
      },
      onError: () => {
        addToast({ type: 'error', message: 'Error al crear el producto' })
      },
    })
  }

  if (catLoading || ingLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-surface-higher" />
          <div className="h-4 w-64 rounded bg-surface-higher" />
          <div className="mt-8 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-surface-high" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Nuevo producto</h1>
        <p className="mt-1 text-sm text-ink-muted">Completá los datos para crear un nuevo producto</p>
      </div>

      <div className="mt-8 rounded-lg border border-line-subtle bg-surface-base p-6 shadow-card-sm">
        <ProductoForm
          categorias={categorias ?? []}
          ingredientes={ingredientes ?? []}
          isPending={isPending}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/productos')}
        />
      </div>
    </div>
  )
}
