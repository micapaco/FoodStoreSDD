from datetime import datetime

from pydantic import BaseModel, Field


class ItemCocinaRead(BaseModel):
    nombre_snapshot: str = Field(alias="nombreSnapshot")
    cantidad: int
    personalizacion: list[str] | None = None
    notas: str | None = None

    model_config = {"populate_by_name": True}


class PedidoCocinaRead(BaseModel):
    id: int
    estado_codigo: str = Field(alias="estadoCodigo")
    notas: str | None = None
    created_at: datetime = Field(alias="createdAt")
    timestamp_entrada_cocina: datetime | None = Field(None, alias="timestampEntradaCocina")
    es_retiro: bool = Field(alias="esRetiro")
    items: list[ItemCocinaRead]

    model_config = {"populate_by_name": True}
