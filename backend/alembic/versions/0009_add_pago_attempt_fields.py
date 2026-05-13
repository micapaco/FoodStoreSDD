"""add_pago_attempt_fields

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-12

Agrega datos operativos a Pago para registrar intentos MercadoPago completos.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pago", sa.Column("mp_order_id", sa.String(length=100), nullable=True))
    op.add_column("pago", sa.Column("status_detail", sa.String(length=100), nullable=True))
    op.add_column("pago", sa.Column("monto", sa.Numeric(10, 2), nullable=True))
    op.add_column(
        "pago",
        sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.create_unique_constraint("uq_pago_mp_order_id", "pago", ["mp_order_id"])


def downgrade() -> None:
    op.drop_constraint("uq_pago_mp_order_id", "pago", type_="unique")
    op.drop_column("pago", "raw_payload")
    op.drop_column("pago", "monto")
    op.drop_column("pago", "status_detail")
    op.drop_column("pago", "mp_order_id")
