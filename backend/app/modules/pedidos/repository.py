from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.db.models.catalogo import FormaPago, Producto, ProductoIngrediente
from app.db.models.ventas import DetallePedido, HistorialEstadoPedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    """Repositorio de Pedido y escrituras atomicas asociadas."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Pedido)

    async def get_forma_pago_habilitada(self, codigo: str) -> FormaPago | None:
        result = await self.session.execute(
            select(FormaPago).where(
                FormaPago.codigo == codigo,
                FormaPago.habilitado.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def get_productos_for_update(self, producto_ids: list[int]) -> list[Producto]:
        if not producto_ids:
            return []
        result = await self.session.execute(
            select(Producto)
            .where(Producto.id.in_(producto_ids))
            .with_for_update()
        )
        return list(result.scalars().all())

    async def get_removable_ingredientes(
        self, producto_ids: list[int]
    ) -> dict[int, set[int]]:
        if not producto_ids:
            return {}
        result = await self.session.execute(
            select(
                ProductoIngrediente.producto_id,
                ProductoIngrediente.ingrediente_id,
            )
            .where(
                ProductoIngrediente.producto_id.in_(producto_ids),
                ProductoIngrediente.es_removible.is_(True),
            )
        )
        removable: dict[int, set[int]] = {}
        for producto_id, ingrediente_id in result.all():
            removable.setdefault(producto_id, set()).add(ingrediente_id)
        return removable

    async def create_detalles(self, detalles: list[DetallePedido]) -> None:
        self.session.add_all(detalles)
        await self.session.flush()

    async def create_historial(self, historial: HistorialEstadoPedido) -> None:
        self.session.add(historial)
        await self.session.flush()

    async def get_detalles_by_pedido_id(self, pedido_id: int) -> list[DetallePedido]:
        result = await self.session.execute(
            select(DetallePedido).where(DetallePedido.pedido_id == pedido_id)
        )
        return list(result.scalars().all())

    async def save_productos(self, productos: list[Producto]) -> None:
        for producto in productos:
            self.session.add(producto)
        await self.session.flush()
