"""initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-05-07

Crea el schema completo del ERD v5: identidad/acceso, catálogo y ventas/pagos.
"""

from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Catálogos base (sin FKs) ─────────────────────────────────────────────
    op.create_table(
        "rol",
        sa.Column("codigo", sa.String(20), primary_key=True),
    )

    op.create_table(
        "forma_pago",
        sa.Column("codigo", sa.String(20), primary_key=True),
        sa.Column("habilitado", sa.Boolean(), nullable=False, server_default="true"),
    )

    op.create_table(
        "estado_pedido",
        sa.Column("codigo", sa.String(20), primary_key=True),
        sa.Column("orden", sa.Integer(), nullable=False),
        sa.Column("es_terminal", sa.Boolean(), nullable=False),
    )

    # ── Identidad ────────────────────────────────────────────────────────────
    op.create_table(
        "usuario",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(60), nullable=False),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_usuario_email", "usuario", ["email"], unique=True)

    op.create_table(
        "usuario_rol",
        sa.Column(
            "usuario_id",
            sa.BigInteger(),
            sa.ForeignKey("usuario.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "rol_codigo",
            sa.String(20),
            sa.ForeignKey("rol.codigo", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    op.create_table(
        "refresh_token",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column(
            "usuario_id",
            sa.BigInteger(),
            sa.ForeignKey("usuario.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_refresh_token_token_hash", "refresh_token", ["token_hash"], unique=True)

    op.create_table(
        "direccion_entrega",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "usuario_id",
            sa.BigInteger(),
            sa.ForeignKey("usuario.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("alias", sa.String(50), nullable=True),
        sa.Column("linea1", sa.Text(), nullable=False),
        sa.Column("es_principal", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )

    # ── Catálogo ─────────────────────────────────────────────────────────────
    op.create_table(
        "categoria",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column(
            "parent_id",
            sa.BigInteger(),
            sa.ForeignKey("categoria.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )

    op.create_table(
        "ingrediente",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(100), nullable=False, unique=True),
        sa.Column("es_alergeno", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )

    op.create_table(
        "producto",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("precio_base", sa.Numeric(10, 2), nullable=False),
        sa.Column("stock_cantidad", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("disponible", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("precio_base >= 0", name="ck_producto_precio_base_non_negative"),
    )

    op.create_table(
        "producto_categoria",
        sa.Column(
            "producto_id",
            sa.BigInteger(),
            sa.ForeignKey("producto.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "categoria_id",
            sa.BigInteger(),
            sa.ForeignKey("categoria.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("es_principal", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_table(
        "producto_ingrediente",
        sa.Column(
            "producto_id",
            sa.BigInteger(),
            sa.ForeignKey("producto.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "ingrediente_id",
            sa.BigInteger(),
            sa.ForeignKey("ingrediente.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("es_removible", sa.Boolean(), nullable=False),
    )

    # ── Ventas y Pagos ────────────────────────────────────────────────────────
    op.create_table(
        "pedido",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "usuario_id",
            sa.BigInteger(),
            sa.ForeignKey("usuario.id"),
            nullable=False,
        ),
        sa.Column(
            "estado_codigo",
            sa.String(20),
            sa.ForeignKey("estado_pedido.codigo"),
            nullable=False,
        ),
        sa.Column(
            "forma_pago_codigo",
            sa.String(20),
            sa.ForeignKey("forma_pago.codigo"),
            nullable=False,
        ),
        sa.Column(
            "direccion_id",
            sa.BigInteger(),
            sa.ForeignKey("direccion_entrega.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("total", sa.Numeric(10, 2), nullable=False),
        sa.Column("costo_envio", sa.Numeric(10, 2), nullable=False, server_default="50.00"),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("total >= 0", name="ck_pedido_total_non_negative"),
    )

    op.create_table(
        "detalle_pedido",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "pedido_id",
            sa.BigInteger(),
            sa.ForeignKey("pedido.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "producto_id",
            sa.BigInteger(),
            sa.ForeignKey("producto.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("cantidad", sa.Integer(), nullable=False),
        sa.Column("nombre_snapshot", sa.String(200), nullable=False),
        sa.Column("precio_snapshot", sa.Numeric(10, 2), nullable=False),
        sa.Column("personalizacion", sa.ARRAY(sa.Integer()), nullable=True),
    )

    op.create_table(
        "historial_estado_pedido",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "pedido_id",
            sa.BigInteger(),
            sa.ForeignKey("pedido.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "estado_desde",
            sa.String(20),
            sa.ForeignKey("estado_pedido.codigo"),
            nullable=True,
        ),
        sa.Column(
            "estado_hasta",
            sa.String(20),
            sa.ForeignKey("estado_pedido.codigo"),
            nullable=False,
        ),
        sa.Column(
            "cambiado_por_id",
            sa.BigInteger(),
            sa.ForeignKey("usuario.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    op.create_table(
        "pago",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "pedido_id",
            sa.BigInteger(),
            sa.ForeignKey("pedido.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("mp_payment_id", sa.BigInteger(), nullable=True, unique=True),
        sa.Column("mp_status", sa.String(30), nullable=True),
        sa.Column("external_reference", sa.String(100), nullable=False, unique=True),
        sa.Column("idempotency_key", sa.String(100), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("pago")
    op.drop_table("historial_estado_pedido")
    op.drop_table("detalle_pedido")
    op.drop_table("pedido")
    op.drop_table("producto_ingrediente")
    op.drop_table("producto_categoria")
    op.drop_table("producto")
    op.drop_table("ingrediente")
    op.drop_table("categoria")
    op.drop_table("direccion_entrega")
    op.drop_index("ix_refresh_token_token_hash", table_name="refresh_token")
    op.drop_table("refresh_token")
    op.drop_table("usuario_rol")
    op.drop_index("ix_usuario_email", table_name="usuario")
    op.drop_table("usuario")
    op.drop_table("estado_pedido")
    op.drop_table("forma_pago")
    op.drop_table("rol")
