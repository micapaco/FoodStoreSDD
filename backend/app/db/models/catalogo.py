from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, CheckConstraint, Column, ForeignKey, Numeric, String
from sqlmodel import Field, SQLModel


class Categoria(SQLModel, table=True):
    __tablename__ = "categoria"

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    nombre: str = Field(max_length=100, nullable=False)
    parent_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), ForeignKey("categoria.id"), nullable=True),
    )
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)


class Ingrediente(SQLModel, table=True):
    __tablename__ = "ingrediente"

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    nombre: str = Field(unique=True, max_length=100, nullable=False)
    es_alergeno: bool = Field(default=False, nullable=False)
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)


class Producto(SQLModel, table=True):
    __tablename__ = "producto"
    __table_args__ = (
        CheckConstraint("precio_base >= 0", name="ck_producto_precio_base_non_negative"),
    )

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    nombre: str = Field(max_length=200, nullable=False)
    descripcion: Optional[str] = Field(default=None, nullable=True)
    precio_base: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
    )
    stock_cantidad: int = Field(default=0, nullable=False)
    disponible: bool = Field(default=True, nullable=False)
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ProductoCategoria(SQLModel, table=True):
    __tablename__ = "producto_categoria"

    producto_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("producto.id"), primary_key=True),
    )
    categoria_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("categoria.id"), primary_key=True),
    )
    es_principal: bool = Field(default=False, nullable=False)


class ProductoIngrediente(SQLModel, table=True):
    __tablename__ = "producto_ingrediente"

    producto_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("producto.id"), primary_key=True),
    )
    ingrediente_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("ingrediente.id"), primary_key=True),
    )
    es_removible: bool = Field(nullable=False)


class FormaPago(SQLModel, table=True):
    __tablename__ = "forma_pago"

    codigo: str = Field(sa_column=Column(String(20), primary_key=True))
    habilitado: bool = Field(default=True, nullable=False)
