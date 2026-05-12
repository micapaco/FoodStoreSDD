"""add_motivo_to_historial_estado_pedido

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-12

Agrega motivo opcional al historial append-only de estados de pedido.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("historial_estado_pedido", sa.Column("motivo", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("historial_estado_pedido", "motivo")
