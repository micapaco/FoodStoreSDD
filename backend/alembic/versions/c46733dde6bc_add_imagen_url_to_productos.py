"""add_imagen_url_to_productos

Revision ID: c46733dde6bc
Revises: 0012
Create Date: 2026-05-15 09:36:56.759109

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c46733dde6bc'
down_revision: Union[str, None] = '0012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('producto', sa.Column('imagen_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('producto', 'imagen_url')
