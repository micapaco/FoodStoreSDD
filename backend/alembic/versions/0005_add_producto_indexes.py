"""add_producto_indexes

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-10

Agrega índices de performance para el módulo productos:
- pg_trgm extension + GIN trigram en producto.nombre y producto.descripcion
  para búsquedas ILIKE eficientes
- Índice compuesto parcial en (disponible, deleted_at) para filtros comunes
- Índice en precio_base para filtros por rango de precio y ordenamiento
"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # pg_trgm extension for trigram-based ILIKE search
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # GIN trigram index on nombre (for ILIKE search)
    op.create_index(
        "ix_producto_nombre_trgm",
        "producto",
        ["nombre"],
        postgresql_using="gin",
        postgresql_ops={"nombre": "gin_trgm_ops"},
    )

    # GIN trigram index on descripcion (for ILIKE search)
    op.create_index(
        "ix_producto_descripcion_trgm",
        "producto",
        ["descripcion"],
        postgresql_using="gin",
        postgresql_ops={"descripcion": "gin_trgm_ops"},
    )

    # Composite partial index on (disponible, deleted_at) — for public listing
    op.create_index(
        "ix_producto_disponible_deleted",
        "producto",
        ["disponible", "deleted_at"],
        postgresql_where=text("deleted_at IS NULL"),
    )

    # Index on precio_base for range filtering and sorting
    op.create_index(
        "ix_producto_precio_base",
        "producto",
        ["precio_base"],
    )


def downgrade() -> None:
    op.drop_index("ix_producto_precio_base")
    op.drop_index("ix_producto_disponible_deleted")
    op.drop_index("ix_producto_descripcion_trgm")
    op.drop_index("ix_producto_nombre_trgm")
    # Note: pg_trgm extension is NOT dropped in downgrade — other tables may depend on it
