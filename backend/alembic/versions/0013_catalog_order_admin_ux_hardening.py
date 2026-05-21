"""catalog_order_admin_ux_hardening

Revision ID: 0013
Revises: c46733dde6bc
Create Date: 2026-05-15 16:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0013"
down_revision: Union[str, None] = "c46733dde6bc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE categoria DROP CONSTRAINT IF EXISTS categoria_nombre_key")
    op.execute("ALTER TABLE categoria DROP CONSTRAINT IF EXISTS uq_categoria_nombre")
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ux_categoria_nombre_activa_ci
        ON categoria (lower(btrim(nombre)))
        WHERE deleted_at IS NULL
        """
    )
    op.execute("ALTER TABLE detalle_pedido ADD COLUMN IF NOT EXISTS personalizacion_snapshot JSONB")


def downgrade() -> None:
    op.execute("ALTER TABLE detalle_pedido DROP COLUMN IF EXISTS personalizacion_snapshot")
    op.execute("DROP INDEX IF EXISTS ux_categoria_nombre_activa_ci")
    op.create_unique_constraint("uq_categoria_nombre", "categoria", ["nombre"])
