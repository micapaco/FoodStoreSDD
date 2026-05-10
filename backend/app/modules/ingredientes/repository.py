"""
Módulo ingredientes — repositorio.

Extiende BaseRepository[Ingrediente] con queries específicas:
- get_by_nombre: buscar por nombre exacto (para validar unicidad)
- list_alergenos: filtrar solo ingredientes marcados como alérgenos
- list_active: listar solo no eliminados
"""

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.db.models.catalogo import Ingrediente


class IngredienteRepository(BaseRepository[Ingrediente]):
    """Repositorio de Ingrediente con filtros de dominio."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Ingrediente)

    async def get_by_nombre(self, nombre: str) -> Optional[Ingrediente]:
        """Busca un ingrediente por nombre exacto (incluye eliminados)."""
        result = await self.session.execute(
            select(Ingrediente).where(Ingrediente.nombre == nombre)
        )
        return result.scalar_one_or_none()

    async def list_alergenos(self, skip: int = 0, limit: int = 100) -> list[Ingrediente]:
        """Lista ingredientes activos marcados como alérgenos."""
        result = await self.session.execute(
            select(Ingrediente).where(
                Ingrediente.es_alergeno.is_(True),
                Ingrediente.deleted_at.is_(None),
            ).order_by(Ingrediente.id).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def list_active(self, skip: int = 0, limit: int = 100) -> list[Ingrediente]:
        """Lista ingredientes activos (excluye soft-deleted)."""
        result = await self.session.execute(
            select(Ingrediente)
            .where(Ingrediente.deleted_at.is_(None))
            .order_by(Ingrediente.id).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def list_no_alergenos(self, skip: int = 0, limit: int = 100) -> list[Ingrediente]:
        """Lista ingredientes activos NO marcados como alérgenos."""
        result = await self.session.execute(
            select(Ingrediente).where(
                Ingrediente.es_alergeno.is_(False),
                Ingrediente.deleted_at.is_(None),
            ).order_by(Ingrediente.id).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count_alergenos(self) -> int:
        """Cuenta ingredientes activos marcados como alérgenos."""
        result = await self.session.execute(
            select(func.count()).select_from(Ingrediente).where(
                Ingrediente.es_alergeno.is_(True),
                Ingrediente.deleted_at.is_(None),
            )
        )
        return result.scalar_one()

    async def count_no_alergenos(self) -> int:
        """Cuenta ingredientes activos NO marcados como alérgenos."""
        result = await self.session.execute(
            select(func.count()).select_from(Ingrediente).where(
                Ingrediente.es_alergeno.is_(False),
                Ingrediente.deleted_at.is_(None),
            )
        )
        return result.scalar_one()

    async def count_active(self) -> int:
        """Cuenta ingredientes activos."""
        result = await self.session.execute(
            select(func.count()).select_from(Ingrediente).where(
                Ingrediente.deleted_at.is_(None)
            )
        )
        return result.scalar_one()
