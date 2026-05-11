"""Módulo direcciones — schemas Pydantic v2.

Reglas del change:
- Campos requeridos en create/update: alias, linea1, linea2, ciudad, provincia, codigo_postal, notas.
- es_principal NO es seteable via POST/PUT (solo PATCH /{id}/principal).
"""

from pydantic import BaseModel, Field


class DireccionCreate(BaseModel):
    alias: str = Field(min_length=1, max_length=50, examples=["Casa"])
    linea1: str = Field(min_length=1, examples=["Av. Siempre Viva 742"])
    linea2: str = Field(min_length=1, examples=["Piso 3, Depto B"])
    ciudad: str = Field(min_length=1, max_length=100, examples=["Rosario"])
    provincia: str = Field(min_length=1, max_length=100, examples=["Santa Fe"])
    codigo_postal: str = Field(min_length=1, max_length=20, examples=["2000"])
    notas: str = Field(min_length=1, examples=["Timbre rojo"])


class DireccionUpdate(BaseModel):
    """Update completo via PUT: todos los campos requeridos."""

    alias: str = Field(min_length=1, max_length=50)
    linea1: str = Field(min_length=1)
    linea2: str = Field(min_length=1)
    ciudad: str = Field(min_length=1, max_length=100)
    provincia: str = Field(min_length=1, max_length=100)
    codigo_postal: str = Field(min_length=1, max_length=20)
    notas: str = Field(min_length=1)


class DireccionRead(BaseModel):
    id: int
    alias: str
    linea1: str
    linea2: str
    ciudad: str
    provincia: str
    codigo_postal: str
    notas: str
    es_principal: bool

    model_config = {"from_attributes": True}


class DireccionList(BaseModel):
    items: list[DireccionRead]
    page: int
    page_size: int
    total: int
