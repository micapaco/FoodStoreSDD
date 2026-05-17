/**
 * Tipos para el módulo de ingredientes.
 * Refleja el schema backend IngredienteRead (Pydantic).
 */
export interface IngredienteRead {
  id: number
  nombre: string
  es_alergeno: boolean
  created_at: string
  updated_at: string
}

export interface IngredienteCreate {
  nombre: string
  es_alergeno: boolean
}

export interface IngredienteUpdate {
  nombre?: string
  es_alergeno?: boolean
}

export interface IngredienteListResponse {
  items: IngredienteRead[]
  total: number
  page: number
  size: number
  pages: number
}
