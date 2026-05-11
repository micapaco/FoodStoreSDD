"""
Módulo ingredientes — schemas Pydantic v2.

Create/Update/Read separados para Ingrediente.
Validaciones de unicidad de nombre en service layer.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class IngredienteCreate(BaseModel):
    """Schema para crear un ingrediente.

    nombre: 1-100 caracteres, único (validado en service).
    es_alergeno: flag opcional, default false.
    """

    nombre: str = Field(
        min_length=1,
        max_length=100,
        examples=["Queso"],
    )
    es_alergeno: bool = Field(default=False)


class IngredienteUpdate(BaseModel):
    """Schema para actualizar un ingrediente. Todos los campos son opcionales."""

    nombre: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    es_alergeno: Optional[bool] = None


class IngredienteRead(BaseModel):
    """Schema de respuesta para Ingrediente."""

    id: int
    nombre: str
    es_alergeno: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IngredienteList(BaseModel):
    """Schema para listado paginado de ingredientes."""

    items: list[IngredienteRead]
    total: int
    page: int
    size: int
    pages: int
