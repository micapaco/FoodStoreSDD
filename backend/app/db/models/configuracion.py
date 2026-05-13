from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, Column, ForeignKey, String, Text
from sqlmodel import Field, SQLModel


class Configuracion(SQLModel, table=True):
    """Parámetros de configuración del sistema (clave-valor)."""

    __tablename__ = "configuracion"

    clave: str = Field(sa_column=Column(String(100), primary_key=True))
    valor: str = Field(sa_column=Column(Text(), nullable=False))
    updated_by_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            BigInteger(),
            ForeignKey("usuario.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
