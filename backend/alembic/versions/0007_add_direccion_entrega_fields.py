"""add_direccion_entrega_fields

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-11

Agrega campos faltantes a direccion_entrega para cumplir el contrato API
del change `addresses`.

Notas:
- La tabla ya existia desde 0001 con registros potenciales.
- Para poder agregar columnas NOT NULL sin romper filas existentes,
  se agregan con server_default y luego se remueve el default.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── DireccionEntrega ───────────────────────────────────────────────────
    op.add_column(
        "direccion_entrega",
        sa.Column("linea2", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column(
        "direccion_entrega",
        sa.Column("ciudad", sa.String(100), nullable=False, server_default=""),
    )
    op.add_column(
        "direccion_entrega",
        sa.Column("provincia", sa.String(100), nullable=False, server_default=""),
    )
    op.add_column(
        "direccion_entrega",
        sa.Column("codigo_postal", sa.String(20), nullable=False, server_default=""),
    )
    op.add_column(
        "direccion_entrega",
        sa.Column("notas", sa.Text(), nullable=False, server_default=""),
    )

    # Remover defaults para que la app sea la que exija valores via payload.
    op.alter_column("direccion_entrega", "linea2", server_default=None)
    op.alter_column("direccion_entrega", "ciudad", server_default=None)
    op.alter_column("direccion_entrega", "provincia", server_default=None)
    op.alter_column("direccion_entrega", "codigo_postal", server_default=None)
    op.alter_column("direccion_entrega", "notas", server_default=None)


def downgrade() -> None:
    op.drop_column("direccion_entrega", "notas")
    op.drop_column("direccion_entrega", "codigo_postal")
    op.drop_column("direccion_entrega", "provincia")
    op.drop_column("direccion_entrega", "ciudad")
    op.drop_column("direccion_entrega", "linea2")
