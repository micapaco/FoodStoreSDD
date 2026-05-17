from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import ARRAY, BigInteger, CheckConstraint, Column, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class EstadoPedido(SQLModel, table=True):
    __tablename__ = "estado_pedido"

    codigo: str = Field(sa_column=Column(String(20), primary_key=True))
    orden: int = Field(nullable=False)
    es_terminal: bool = Field(nullable=False)


class Pedido(SQLModel, table=True):
    __tablename__ = "pedido"
    __table_args__ = (
        CheckConstraint("total >= 0", name="ck_pedido_total_non_negative"),
    )

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    usuario_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("usuario.id"), nullable=False),
    )
    estado_codigo: str = Field(
        sa_column=Column(String(20), ForeignKey("estado_pedido.codigo"), nullable=False),
    )
    forma_pago_codigo: str = Field(
        sa_column=Column(String(20), ForeignKey("forma_pago.codigo"), nullable=False),
    )
    direccion_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), ForeignKey("direccion_entrega.id"), nullable=True),
    )
    direccion_snapshot: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )
    notas: Optional[str] = Field(
        default=None,
        sa_column=Column(Text(), nullable=True),
    )
    total: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    costo_envio: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False, server_default="50.00"),
    )
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )


class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalle_pedido"

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    pedido_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("pedido.id"), nullable=False),
    )
    producto_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), ForeignKey("producto.id"), nullable=True),
    )
    cantidad: int = Field(nullable=False)
    nombre_snapshot: str = Field(max_length=200, nullable=False)
    precio_snapshot: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
    )
    # IDs de ingredientes removidos por el cliente al momento del pedido
    personalizacion: Optional[List[int]] = Field(
        default=None,
        sa_column=Column(ARRAY(Integer), nullable=True),
    )
    personalizacion_snapshot: Optional[list[dict]] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )


class HistorialEstadoPedido(SQLModel, table=True):
    __tablename__ = "historial_estado_pedido"

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    pedido_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("pedido.id"), nullable=False),
    )
    # NULL indica transición inicial (pedido recién creado)
    estado_desde: Optional[str] = Field(
        default=None,
        sa_column=Column(String(20), ForeignKey("estado_pedido.codigo"), nullable=True),
    )
    estado_hasta: str = Field(
        sa_column=Column(String(20), ForeignKey("estado_pedido.codigo"), nullable=False),
    )
    cambiado_por_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), ForeignKey("usuario.id"), nullable=True),
    )
    motivo: Optional[str] = Field(
        default=None,
        sa_column=Column(Text(), nullable=True),
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )


class Pago(SQLModel, table=True):
    __tablename__ = "pago"

    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), primary_key=True, autoincrement=True),
    )
    pedido_id: int = Field(
        sa_column=Column(BigInteger(), ForeignKey("pedido.id"), nullable=False),
    )
    mp_payment_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BigInteger(), unique=True, nullable=True),
    )
    mp_order_id: Optional[str] = Field(
        default=None,
        sa_column=Column(String(100), unique=True, nullable=True),
    )
    mp_status: Optional[str] = Field(default=None, max_length=30, nullable=True)
    status_detail: Optional[str] = Field(default=None, max_length=100, nullable=True)
    monto: Optional[Decimal] = Field(
        default=None,
        sa_column=Column(Numeric(10, 2), nullable=True),
    )
    external_reference: str = Field(
        sa_column=Column(String(100), unique=True, nullable=False),
    )
    idempotency_key: str = Field(
        sa_column=Column(String(100), unique=True, nullable=False),
    )
    raw_payload: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )
