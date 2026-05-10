/**
 * Tipos para el módulo de productos.
 * Refleja los schemas backend: ProductoRead, ProductoDetail, Create, Update, etc.
 */

export interface CategoriaReadRef {
  id: number
  nombre: string
}

export interface IngredienteReadRef {
  id: number
  nombre: string
  es_alergeno: boolean
  es_removible: boolean
}

export interface ProductoRead {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: number
  stock_cantidad: number
  disponible: boolean
  created_at: string
  updated_at: string
  categoria_ids: number[]
  ingrediente_ids: number[]
}

export interface ProductoDetail extends ProductoRead {
  categorias: CategoriaReadRef[]
  ingredientes: IngredienteReadRef[]
}

export interface IngredienteAsignacion {
  ingrediente_id: number
  es_removible: boolean
}

export interface ProductoCreate {
  nombre: string
  descripcion?: string
  precio_base: number
  stock_cantidad: number
  disponible: boolean
  categoria_ids: number[]
  ingredientes: IngredienteAsignacion[]
}

export interface ProductoUpdate {
  nombre?: string
  descripcion?: string
  precio_base?: number
  stock_cantidad?: number
  disponible?: boolean
  categoria_ids?: number[]
  ingredientes?: IngredienteAsignacion[]
}

export interface ProductoStockUpdate {
  stock_cantidad: number
}

export interface ProductoDisponibilidadUpdate {
  disponible: boolean
}

export interface ProductoFilters {
  page: number
  size: number
  q?: string
  categoria_id?: number
  precio_min?: number
  precio_max?: number
  ingrediente_id?: number
  disponible?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}
