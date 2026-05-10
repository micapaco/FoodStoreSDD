import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useProducto, useUpdateProducto, useCategorias, useIngredientes } from '@/features/productos/hooks/useProductos'
import { ProductoForm, type ProductoFormValues } from '@/features/productos/components/ProductoForm'
import { useAuthStore } from '@/shared/stores/authStore'
import { useUiStore } from '@/shared/stores/uiStore'
import type { ProductoUpdate } from '@/entities/productos/types'

export function ProductosEditPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roles.includes('ADMIN') ?? false

  // Only ADMIN can edit products
  if (!isAdmin) {
    return <Navigate to="/403" replace />
  }

  const { data: producto, isLoading: prodLoading, isError } = useProducto(productId)
  const { data: categorias, isLoading: catLoading } = useCategorias()
  const { data: ingredientes, isLoading: ingLoading } = useIngredientes()
  const { mutate: updateProducto, isPending } = useUpdateProducto()

  const handleSubmit = (values: ProductoFormValues) => {
    const payload: ProductoUpdate = {
      nombre: values.nombre,
      descripcion: values.descripcion || undefined,
      precio_base: values.precio_base,
      stock_cantidad: values.stock_cantidad,
      disponible: values.disponible,
      categoria_ids: values.categoria_ids,
      ingredientes: values.ingredientes,
    }

    updateProducto(
      { id: productId, data: payload },
      {
        onSuccess: () => {
          addToast({ type: 'success', message: 'Producto actualizado correctamente' })
          navigate('/admin/productos')
        },
        onError: () => {
          addToast({ type: 'error', message: 'Error al actualizar el producto' })
        },
      },
    )
  }

  const isLoading = prodLoading || catLoading || ingLoading

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-200" />
          <div className="mt-8 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !producto) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-lg font-medium text-red-700">Producto no encontrado</p>
          <p className="mt-1 text-sm text-red-500">El producto que buscás no existe o fue eliminado.</p>
          <button
            type="button"
            onClick={() => navigate('/admin/productos')}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Volver al listado
          </button>
        </div>
      </div>
    )
  }

  const initialValues: ProductoFormValues = {
    nombre: producto.nombre,
    descripcion: producto.descripcion ?? '',
    precio_base: Number(producto.precio_base),
    stock_cantidad: producto.stock_cantidad,
    disponible: producto.disponible,
    categoria_ids: producto.categoria_ids,
    ingredientes: producto.ingredientes.map((i) => ({
      ingrediente_id: i.id,
      es_removible: i.es_removible,
    })),
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar producto</h1>
        <p className="mt-1 text-sm text-gray-500">Modificá los datos del producto</p>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <ProductoForm
          initialValues={initialValues}
          categorias={categorias ?? []}
          ingredientes={ingredientes ?? []}
          isPending={isPending}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/productos')}
          isEdit
        />
      </div>
    </div>
  )
}
