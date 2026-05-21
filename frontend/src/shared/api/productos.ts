import api from '@/shared/api/axios'
import type {
  ProductoRead,
  ProductoDetail,
  ProductoCreate,
  ProductoUpdate,
  ProductoFilters,
  ProductoImagenUploadResponse,
  PaginatedResponse,
} from '@/entities/productos/types'
import type { CategoriaRead } from '@/entities/categorias/types'

export async function getProductos(
  filters: ProductoFilters,
  admin?: boolean,
): Promise<PaginatedResponse<ProductoRead>> {
  const params: Record<string, unknown> = { ...filters }
  if (admin) params.admin = true
  const res = await api.get<PaginatedResponse<ProductoRead>>('/productos', { params })
  return res.data
}

export async function getProducto(id: number, admin?: boolean): Promise<ProductoDetail> {
  const params = admin ? { admin: true } : {}
  const res = await api.get<ProductoDetail>(`/productos/${id}`, { params })
  return res.data
}

export async function createProducto(data: ProductoCreate): Promise<ProductoDetail> {
  const res = await api.post<ProductoDetail>('/productos', data)
  return res.data
}

export async function updateProducto(id: number, data: ProductoUpdate): Promise<ProductoDetail> {
  const res = await api.put<ProductoDetail>(`/productos/${id}`, data)
  return res.data
}

export async function deleteProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`)
}

export async function uploadProductoImagen(file: File): Promise<ProductoImagenUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post<ProductoImagenUploadResponse>('/productos/imagenes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function updateStock(
  id: number,
  stock_cantidad: number,
): Promise<ProductoDetail> {
  const res = await api.patch<ProductoDetail>(`/productos/${id}/stock`, {
    stock_cantidad,
  })
  return res.data
}

export async function updateDisponibilidad(
  id: number,
  disponible: boolean,
): Promise<ProductoDetail> {
  const res = await api.patch<ProductoDetail>(`/productos/${id}/disponibilidad`, {
    disponible,
  })
  return res.data
}

export async function getCategoriasList(): Promise<CategoriaRead[]> {
  const res = await api.get<{
    items: CategoriaRead[]
    total: number
    page: number
    size: number
    pages: number
  }>('/categorias')
  return res.data.items
}
