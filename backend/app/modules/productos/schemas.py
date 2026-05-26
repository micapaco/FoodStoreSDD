"""
Módulo productos — schemas Pydantic v2.

Create/Update/Read/Detail separados para Producto.
Las validaciones de negocio (stock >= 0, referencias activas) se aplican en service layer.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class IngredienteAsignacion(BaseModel):
    """Asignación de un ingrediente a un producto con flag de removibilidad."""

    ingrediente_id: int
    es_removible: bool = False


class CategoriaReadRef(BaseModel):
    """Referencia liviana de categoría para respuestas de producto."""

    id: int
    nombre: str

    model_config = {"from_attributes": True}


class IngredienteReadRef(BaseModel):
    """Referencia liviana de ingrediente para respuestas de producto."""

    id: int
    nombre: str
    es_alergeno: bool
    es_removible: bool = False

    model_config = {"from_attributes": True}


class ProductoCreate(BaseModel):
    """Schema para crear un producto con sus relaciones."""

    nombre: str = Field(
        min_length=1,
        max_length=200,
        examples=["Pizza Mozzarella"],
    )
    descripcion: Optional[str] = Field(
        default=None,
        max_length=2000,
        examples=["Pizza clásica con queso mozzarella y salsa de tomate"],
    )
    precio_base: Decimal = Field(
        decimal_places=2,
        ge=0,
        examples=[1200.00],
    )
    stock_cantidad: int = Field(default=0, ge=0)
    disponible: bool = Field(default=True)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    categoria_ids: list[int] = Field(default_factory=list)
    ingredientes: list[IngredienteAsignacion] = Field(default_factory=list)


class ProductoUpdate(BaseModel):
    """Schema para actualizar un producto. Todos los campos son opcionales."""

    nombre: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    descripcion: Optional[str] = Field(
        default=None,
        max_length=2000,
    )
    precio_base: Optional[Decimal] = Field(
        default=None,
        decimal_places=2,
        ge=0,
    )
    stock_cantidad: Optional[int] = Field(default=None, ge=0)
    disponible: Optional[bool] = None
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    categoria_ids: Optional[list[int]] = None
    ingredientes: Optional[list[IngredienteAsignacion]] = None


class ProductoRead(BaseModel):
    """Schema de respuesta base para Producto (sin relaciones expandidas)."""

    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio_base: Decimal
    stock_cantidad: int
    disponible: bool
    imagen_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    categoria_ids: list[int] = Field(default_factory=list)
    ingrediente_ids: list[int] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ProductoDetail(ProductoRead):
    """Schema de respuesta detallado con relaciones expandidas."""

    categorias: list[CategoriaReadRef] = Field(default_factory=list)
    ingredientes: list[IngredienteReadRef] = Field(default_factory=list)


class ProductoStockUpdate(BaseModel):
    """Schema para actualizar solo el stock del producto."""

    stock_cantidad: int = Field(ge=0)


class ProductoDisponibilidadUpdate(BaseModel):
    """Schema para actualizar solo la disponibilidad del producto."""

    disponible: bool


class ProductoImagenUploadResponse(BaseModel):
    """Respuesta del upload de imagen de producto."""

    imagen_url: str


class ProductoList(BaseModel):
    """Schema para listado paginado de productos."""

    items: list[ProductoRead]
    total: int
    page: int
    size: int
    pages: int
