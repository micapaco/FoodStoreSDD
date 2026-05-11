/**
 * Tipos para el módulo de categorías.
 * Refleja el schema backend CategoriaRead (Pydantic).
 */
export interface CategoriaRead {
  id: number
  nombre: string
  parent_id: number | null
  created_at: string
  updated_at: string
  children: CategoriaRead[]
}
