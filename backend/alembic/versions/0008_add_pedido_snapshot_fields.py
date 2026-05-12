"""add_pedido_snapshot_fields

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-11

Agrega campos necesarios para que la creacion de pedidos preserve datos
historicos independientes de cambios posteriores en direcciones.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "pedido",
        sa.Column("direccion_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("pedido", sa.Column("notas", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("pedido", "notas")
    op.drop_column("pedido", "direccion_snapshot")
