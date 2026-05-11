"""add_nombre_apellido_to_usuario_and_family_id_to_refresh_token

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-09

Cambios requeridos por el change auth:
1. usuario: agrega columnas nombre VARCHAR(100) y apellido VARCHAR(100).
   El seed existente (usuario admin) usa DEFAULT temporario para no fallar;
   debe actualizarse manualmente si ya corrió.
2. refresh_token: agrega columna family_id UUID NOT NULL para detección
   de replay attack (D-03 en design.md del change auth).
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── usuario: nombre y apellido ───────────────────────────────────────────
    # server_default vacío permite la migración en tablas con filas existentes.
    # Quitar server_default inmediatamente después para forzar NOT NULL en nuevas filas.
    op.add_column(
        "usuario",
        sa.Column("nombre", sa.String(100), nullable=False, server_default=""),
    )
    op.add_column(
        "usuario",
        sa.Column("apellido", sa.String(100), nullable=False, server_default=""),
    )
    op.alter_column("usuario", "nombre", server_default=None)
    op.alter_column("usuario", "apellido", server_default=None)

    # ── refresh_token: family_id ─────────────────────────────────────────────
    op.add_column(
        "refresh_token",
        sa.Column(
            "family_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
    )
    op.alter_column("refresh_token", "family_id", server_default=None)


def downgrade() -> None:
    op.drop_column("refresh_token", "family_id")
    op.drop_column("usuario", "apellido")
    op.drop_column("usuario", "nombre")
