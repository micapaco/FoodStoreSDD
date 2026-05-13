"""add configuracion table

Revision ID: 0012
Revises: 0011
Create Date: 2026-05-12

"""

from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "configuracion",
        sa.Column("clave", sa.String(100), primary_key=True),
        sa.Column("valor", sa.Text(), nullable=False),
        sa.Column(
            "updated_by_id",
            sa.BigInteger(),
            sa.ForeignKey("usuario.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("configuracion")
