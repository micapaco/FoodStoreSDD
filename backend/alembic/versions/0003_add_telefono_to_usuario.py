"""add_telefono_to_usuario

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-09

Agrega columna telefono VARCHAR(20) nullable a la tabla usuario para el
change profile (perfil de usuario con datos de contacto).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "usuario",
        sa.Column("telefono", sa.String(20), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("usuario", "telefono")
