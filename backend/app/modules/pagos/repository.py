from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.db.models.ventas import Pago


class PagoRepository(BaseRepository[Pago]):
    """Repositorio de intentos de pago MercadoPago."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Pago)

    async def list_by_pedido_id(self, pedido_id: int) -> list[Pago]:
        result = await self.session.execute(
            select(Pago)
            .where(Pago.pedido_id == pedido_id)
            .order_by(Pago.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_by_mp_payment_id(self, mp_payment_id: int) -> Pago | None:
        result = await self.session.execute(
            select(Pago).where(Pago.mp_payment_id == mp_payment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_mp_order_id(self, mp_order_id: str) -> Pago | None:
        result = await self.session.execute(
            select(Pago).where(Pago.mp_order_id == mp_order_id)
        )
        return result.scalar_one_or_none()

    async def get_by_external_reference(self, external_reference: str) -> Pago | None:
        result = await self.session.execute(
            select(Pago).where(Pago.external_reference == external_reference)
        )
        return result.scalar_one_or_none()
