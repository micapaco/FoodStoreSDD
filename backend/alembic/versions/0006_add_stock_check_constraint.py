"""add_stock_check_constraint

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-10

Agrega CHECK constraint stock_cantidad >= 0 en la tabla producto
para asegurar RN-04 a nivel de base de datos.
"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import text as sa_text

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_producto_stock_non_negative",
        "producto",
        sa_text("stock_cantidad >= 0"),
    )


def downgrade() -> None:
    op.drop_constraint("ck_producto_stock_non_negative", "producto", type_="check")
