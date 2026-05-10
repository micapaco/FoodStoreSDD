"""add_categoria_ingrediente_fields

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-10

Agrega campos faltantes a las tablas Categoria e Ingrediente:
- created_at / updated_at en ambas (usando server_default=now() para
  populación automática de filas existentes)
- Unique constraint en categoria.nombre
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Categoria ─────────────────────────────────────────────────────────
    op.add_column(
        "categoria",
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.add_column(
        "categoria",
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    # Unique constraint on nombre (no unique index exists yet)
    op.create_unique_constraint(
        "uq_categoria_nombre",
        "categoria",
        ["nombre"],
    )

    # ── Ingrediente ───────────────────────────────────────────────────────
    op.add_column(
        "ingrediente",
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.add_column(
        "ingrediente",
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    # Unique index on nombre already exists via unique=True constraint


def downgrade() -> None:
    op.drop_constraint("uq_categoria_nombre", "categoria", type_="unique")
    op.drop_column("ingrediente", "updated_at")
    op.drop_column("ingrediente", "created_at")
    op.drop_column("categoria", "updated_at")
    op.drop_column("categoria", "created_at")
