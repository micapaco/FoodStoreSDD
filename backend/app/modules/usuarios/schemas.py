"""Módulo usuarios — schemas Pydantic v2."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class UsuarioListItem(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: str
    roles: list[str]
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UsuarioDetailRead(UsuarioListItem):
    telefono: Optional[str] = None
    updated_at: datetime


class UsuarioListResponse(BaseModel):
    items: list[UsuarioListItem]
    total: int
    page: int
    size: int
    pages: int


class UsuarioUpdateRequest(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    telefono: Optional[str] = None


class CambiarRolesRequest(BaseModel):
    roles: list[str]

    @field_validator("roles")
    @classmethod
    def roles_no_vacios(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("La lista de roles no puede estar vacía.")
        return v


class CambiarEstadoRequest(BaseModel):
    activo: bool
