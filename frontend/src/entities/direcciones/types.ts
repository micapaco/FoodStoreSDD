/**
 * Tipos para el módulo de direcciones.
 * Refleja el contrato backend del change `addresses`.
 */

export interface DireccionRead {
  id: number
  alias: string
  linea1: string
  linea2: string
  ciudad: string
  provincia: string
  codigo_postal: string
  notas: string
  es_principal: boolean
}

export interface DireccionCreate {
  alias: string
  linea1: string
  linea2: string
  ciudad: string
  provincia: string
  codigo_postal: string
  notas: string
}

export type DireccionUpdate = DireccionCreate

export interface DireccionesPaginatedResponse {
  items: DireccionRead[]
  page: number
  page_size: number
  total: number
}
