from datetime import datetime
from typing import Generic, List, Optional, Type, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    """Repositorio genérico con CRUD básico.

    Recibe la sesión por inyección desde UnitOfWork — nunca la abre internamente.
    Los módulos heredan esta clase y agregan queries específicas de dominio.
    """

    def __init__(self, session: AsyncSession, model: Type[T]) -> None:
        self.session = session
        self.model = model

    async def get_by_id(self, entity_id: int) -> Optional[T]:
        return await self.session.get(self.model, entity_id)

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        result = await self.session.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar_one()

    async def create(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def soft_delete(self, entity: T) -> None:
        """Marca el registro como eliminado sin borrarlo físicamente."""
        entity.deleted_at = datetime.now(datetime.timezone.utc)  # type: ignore[attr-defined]
        self.session.add(entity)
        await self.session.flush()

    async def hard_delete(self, entity: T) -> None:
        """Elimina el registro físicamente. Solo para entidades sin soft-delete."""
        await self.session.delete(entity)
        await self.session.flush()
