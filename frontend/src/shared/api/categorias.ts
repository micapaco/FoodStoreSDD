import api from '@/shared/api/axios'
import type {
  CategoriaCreate,
  CategoriaListResponse,
  CategoriaRead,
  CategoriaUpdate,
} from '@/entities/categorias/types'

export interface CategoriaListParams {
  page?: number
  size?: number
}

export async function getCategorias(
  params: CategoriaListParams = {},
): Promise<CategoriaListResponse> {
  const res = await api.get<CategoriaListResponse>('/categorias', { params })
  return res.data
}

export async function getCategoriasTree(): Promise<CategoriaRead[]> {
  const res = await api.get<CategoriaRead[]>('/categorias/arbol')
  return res.data
}

export async function createCategoria(data: CategoriaCreate): Promise<CategoriaRead> {
  const res = await api.post<CategoriaRead>('/categorias', data)
  return res.data
}

export async function updateCategoria(
  id: number,
  data: CategoriaUpdate,
): Promise<CategoriaRead> {
  const res = await api.put<CategoriaRead>(`/categorias/${id}`, data)
  return res.data
}

export async function deleteCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`)
}
