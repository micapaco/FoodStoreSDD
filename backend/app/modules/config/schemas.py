"""Schemas del módulo config."""

from datetime import datetime

from pydantic import BaseModel


class ConfigParametro(BaseModel):
    """Representación de un parámetro de configuración."""

    clave: str
    valor: str
    updated_by_id: int | None
    updated_at: datetime


class ConfigListResponse(BaseModel):
    """Respuesta con todos los parámetros de configuración."""

    parametros: list[ConfigParametro]


class ConfigUpdateRequest(BaseModel):
    """Request para actualizar el valor de un parámetro."""

    valor: str


class ConfigPublicaResponse(BaseModel):
    """Respuesta pública con parámetros relevantes para clientes."""

    costo_envio_base: float
    pedidos_habilitados: bool
    mensaje_sistema: str
