import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel


class Rol(SQLModel, table=True):
    __tablename__ = "rol"

    codigo: str = Field(sa_column=Column(String(20), primary_key=True))


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    nombre: str = Field(sa_column=Column(String(100), nullable=False))
    apellido: str = Field(sa_column=Column(String(100), nullable=False))
    telefono: Optional[str] = Field(
        default=None, sa_column=Column(String(20), nullable=True)
    )
    email: str = Field(unique=True, max_length=254)
    password_hash: str = Field(sa_column=Column(String(60), nullable=False))
    activo: bool = Field(default=True, nullable=False)
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )


class UsuarioRol(SQLModel, table=True):
    __tablename__ = "usuario_rol"

    usuario_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("usuario.id"), primary_key=True),
    )
    rol_codigo: str = Field(
        sa_column=Column(String(20), ForeignKey("rol.codigo"), primary_key=True),
    )


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    token_hash: str = Field(sa_column=Column(String(64), nullable=False, unique=True))
    usuario_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("usuario.id"), nullable=False),
    )
    # family_id groups tokens in the same refresh chain; used for replay attack detection.
    family_id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), nullable=False),
    )
    expires_at: datetime = Field(nullable=False)
    revoked_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )


class DireccionEntrega(SQLModel, table=True):
    __tablename__ = "direccion_entrega"

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    usuario_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("usuario.id"), nullable=False),
    )
    alias: Optional[str] = Field(default=None, max_length=50, nullable=True)
    linea1: str = Field(nullable=False)
    linea2: str = Field(sa_column=Column(Text(), nullable=False))
    ciudad: str = Field(sa_column=Column(String(100), nullable=False))
    provincia: str = Field(sa_column=Column(String(100), nullable=False))
    codigo_postal: str = Field(sa_column=Column(String(20), nullable=False))
    notas: str = Field(sa_column=Column(Text(), nullable=False))
    es_principal: bool = Field(default=False, nullable=False)
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
