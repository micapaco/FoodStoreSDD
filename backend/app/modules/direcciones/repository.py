"""Módulo direcciones — repositorio.

Queries:
- Filtrado estricto por usuario_id
- Exclusión de soft-deleted por defecto
- Orden: es_principal desc, id desc
- Paginación
"""

from sqlalchemy import desc, func, update, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.db.models.identidad import DireccionEntrega


class DireccionRepository(BaseRepository[DireccionEntrega]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, DireccionEntrega)

    async def list_by_usuario(
        self,
        usuario_id: int,
        *,
        skip: int = 0,
        limit: int = 10,
    ) -> list[DireccionEntrega]:
        result = await self.session.execute(
            select(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
            )
            .order_by(desc(DireccionEntrega.es_principal), desc(DireccionEntrega.id))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_usuario(self, usuario_id: int) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
            )
        )
        return result.scalar_one()

    async def get_owned_active(self, usuario_id: int, direccion_id: int) -> DireccionEntrega | None:
        result = await self.session.execute(
            select(DireccionEntrega).where(
                DireccionEntrega.id == direccion_id,
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def has_any_active(self, usuario_id: int) -> bool:
        result = await self.session.execute(
            select(DireccionEntrega.id)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def unset_principal_others(self, usuario_id: int, keep_id: int) -> None:
        # UPDATE masivo para evitar N+1; queda dentro de la misma transacción del UoW.
        await self.session.execute(
            update(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
                DireccionEntrega.id != keep_id,
                DireccionEntrega.es_principal.is_(True),
            )
            .values(es_principal=False)
        )
