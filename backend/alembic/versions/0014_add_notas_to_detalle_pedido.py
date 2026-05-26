"""add notas to detalle_pedido

Revision ID: 0014
Revises: 0013
Create Date: 2026-05-24

"""
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0014"
down_revision: Union[str, None] = "0013"
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.add_column(
        "detalle_pedido",
        sa.Column("notas", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("detalle_pedido", "notas")
