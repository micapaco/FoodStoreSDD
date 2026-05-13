export interface ConfigParametro {
  clave: string
  valor: string
  updated_by_id: number | null
  updated_at: string
}

export interface ConfigListResponse {
  parametros: ConfigParametro[]
}

export interface ConfigUpdateRequest {
  valor: string
}

export interface ConfigPublicaResponse {
  costo_envio_base: number
  pedidos_habilitados: boolean
  mensaje_sistema: string
}
