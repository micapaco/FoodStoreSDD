"""Modulo usuarios - schemas Pydantic v2."""

from datetime import datetime
from typing import Literal, Optional

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
    roles: list[Literal["ADMIN", "STOCK", "PEDIDOS", "CLIENT"]]

    @field_validator("roles")
    @classmethod
    def roles_no_vacios(cls, v: list[str]) -> list[str]:
        if len(v) != 1:
            raise ValueError("El usuario debe tener exactamente un rol.")
        return v


class CambiarEstadoRequest(BaseModel):
    activo: bool
