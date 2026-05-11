from decimal import Decimal
from typing import Literal

from pydantic import Field

from app.core.schemas import BaseSchema


class ItemValidar(BaseSchema):
    producto_id: int = Field(alias="productoId", gt=0)
    cantidad: int = Field(gt=0)
    precio_esperado: Decimal = Field(alias="precioEsperado", ge=0)
    exclusiones: list[int] = Field(default_factory=list)


class ValidarCarritoRequest(BaseSchema):
    items: list[ItemValidar] = Field(min_length=1)


class ErrorValidacion(BaseSchema):
    producto_id: int = Field(alias="productoId")
    tipo: Literal["STOCK_INSUFICIENTE", "PRECIO_CAMBIADO", "NO_DISPONIBLE"]
    mensaje: str


class PrecioActualizado(BaseSchema):
    producto_id: int = Field(alias="productoId")
    precio_viejo: Decimal = Field(alias="precioViejo")
    precio_nuevo: Decimal = Field(alias="precioNuevo")


class ValidarCarritoResponse(BaseSchema):
    valido: bool
    errores: list[ErrorValidacion] = Field(default_factory=list)
    precios_actualizados: list[PrecioActualizado] = Field(
        default_factory=list,
        alias="preciosActualizados",
    )
