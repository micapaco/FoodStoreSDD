"""
Módulo auth — schemas de entrada y salida (DTOs).

Regla: nunca exponer el modelo SQLModel directamente como response.
Cada schema tiene una responsabilidad única: Create, Read, Token.
"""

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Request schemas ──────────────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=100)]
    apellido: Annotated[str, Field(min_length=1, max_length=100)]
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=128)]

    @field_validator("password")
    @classmethod
    def password_no_espacios(cls, v: str) -> str:
        if v != v.strip():
            raise ValueError("La contraseña no puede empezar o terminar con espacios.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


# ── Response schemas ─────────────────────────────────────────────────────────


class UserResponse(BaseModel):
    """Datos públicos del usuario. Nunca incluye password_hash."""

    id: int
    nombre: str
    apellido: str
    telefono: str | None = None
    email: str
    roles: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800  # 30 min en segundos


# ── Profile schemas ───────────────────────────────────────────────────────────


class UpdateProfileRequest(BaseModel):
    """Actualización de datos personales del perfil."""

    nombre: Annotated[str, Field(min_length=1, max_length=100)]
    apellido: Annotated[str, Field(min_length=1, max_length=100)]
    email: EmailStr
    telefono: Annotated[str | None, Field(max_length=20)] = None


class ChangePasswordRequest(BaseModel):
    """Cambio de contraseña."""

    current_password: Annotated[str, Field(min_length=1)]
    new_password: Annotated[str, Field(min_length=8, max_length=128)]
    confirm_password: Annotated[str, Field(min_length=1)]

    @field_validator("new_password")
    @classmethod
    def new_password_no_espacios(cls, v: str) -> str:
        if v != v.strip():
            raise ValueError("La contraseña no puede empezar o terminar con espacios.")
        return v

    @field_validator("confirm_password")
    @classmethod
    def confirm_no_espacios(cls, v: str) -> str:
        if v != v.strip():
            raise ValueError("La confirmación no puede empezar o terminar con espacios.")
        return v
