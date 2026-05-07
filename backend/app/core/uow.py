from types import TracebackType
from typing import Optional, Type

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal


class UnitOfWork:
    """Context manager transaccional.

    Abre una sesión de BD al entrar, hace commit automático al salir sin
    excepción, o rollback si ocurre una. Los servicios NUNCA llaman a
    session.commit() directamente — esa responsabilidad es exclusiva del UoW.

    Uso en routers (único lugar donde se abre el contexto):
        async with UnitOfWork() as uow:
            result = await service.crear_pedido(uow, ...)
        return result

    Los repositorios se agregan como atributos en cada módulo que los necesite.
    """

    def __init__(self) -> None:
        self._session: Optional[AsyncSession] = None

    async def __aenter__(self) -> "UnitOfWork":
        self._session = AsyncSessionLocal()
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        if self._session is None:
            return
        try:
            if exc_type is None:
                await self._session.commit()
            else:
                await self._session.rollback()
        finally:
            await self._session.close()
            self._session = None

    @property
    def session(self) -> AsyncSession:
        if self._session is None:
            raise RuntimeError("UnitOfWork no está activo. Usalo dentro de 'async with UnitOfWork()'.")
        return self._session
