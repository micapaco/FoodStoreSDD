"""
Módulo categorías — schemas Pydantic v2.

Create/Update/Read separados para Categoria.
Las validaciones de negocio (parent activo, anti-ciclos) se aplican en service layer.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CategoriaCreate(BaseModel):
    """Schema para crear una categoría.

    nombre: 1-100 caracteres, único (validado en service).
    parent_id: opcional, debe referenciar una categoría activa (validado en service).
    """

    nombre: str = Field(
        min_length=1,
        max_length=100,
        examples=["Bebidas"],
    )
    parent_id: Optional[int] = Field(
        default=None,
        description="ID de la categoría padre. Null para categoría raíz.",
    )


class CategoriaUpdate(BaseModel):
    """Schema para actualizar una categoría. Todos los campos son opcionales."""

    nombre: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    parent_id: Optional[int] = Field(
        default=None,
        description="Nuevo padre. Null para convertir en raíz. None = no cambiar.",
    )


class CategoriaRead(BaseModel):
    """Schema de respuesta para Categoria.

    Incluye id, nombre, parent_id, lista de hijos (ids) y metadatos.
    El armado del árbol completo se hace via el endpoint /arbol.
    """

    id: int
    nombre: str
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    children: list["CategoriaRead"] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class CategoriaList(BaseModel):
    """Schema para listado paginado de categorías."""

    items: list[CategoriaRead]
    total: int
    page: int
    size: int
    pages: int
