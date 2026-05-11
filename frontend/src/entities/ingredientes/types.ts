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
