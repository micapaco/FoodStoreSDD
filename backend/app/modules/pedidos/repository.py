from datetime import date, datetime, time
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.db.models.identidad import Usuario
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

    async def list_by_usuario_paginated(
        self,
        usuario_id: int,
        *,
        page: int,
        size: int,
        estado: str | None,
    ) -> tuple[list[tuple[Pedido, int]], int]:
        count_query = select(func.count(Pedido.id)).where(
            Pedido.usuario_id == usuario_id,
            Pedido.deleted_at.is_(None),
        )
        if estado:
            count_query = count_query.where(Pedido.estado_codigo == estado)
        total = (await self.session.execute(count_query)).scalar_one()

        item_count_subquery = self._item_count_subquery()
        query = (
            select(
                Pedido,
                func.coalesce(item_count_subquery.c.cantidad_items, 0).label("cantidad_items"),
            )
            .outerjoin(item_count_subquery, item_count_subquery.c.pedido_id == Pedido.id)
            .where(
                Pedido.usuario_id == usuario_id,
                Pedido.deleted_at.is_(None),
            )
            .order_by(Pedido.created_at.desc(), Pedido.id.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        if estado:
            query = query.where(Pedido.estado_codigo == estado)
        rows = (await self.session.execute(query)).all()
        return [(pedido, int(cantidad_items)) for pedido, cantidad_items in rows], total

    async def list_admin_paginated(
        self,
        *,
        page: int,
        size: int,
        estado: str | None,
        desde: date | None,
        hasta: date | None,
        q: str | None,
    ) -> tuple[list[tuple[Pedido, Usuario, int]], int]:
        item_count_subquery = self._item_count_subquery()
        filters = [Pedido.deleted_at.is_(None)]
        filters.extend(self._build_admin_filters(estado=estado, desde=desde, hasta=hasta, q=q))

        count_query = (
            select(func.count(Pedido.id.distinct()))
            .select_from(Pedido)
            .join(Usuario, Usuario.id == Pedido.usuario_id)
            .where(*filters)
        )
        total = (await self.session.execute(count_query)).scalar_one()

        query = (
            select(
                Pedido,
                Usuario,
                func.coalesce(item_count_subquery.c.cantidad_items, 0).label("cantidad_items"),
            )
            .join(Usuario, Usuario.id == Pedido.usuario_id)
            .outerjoin(item_count_subquery, item_count_subquery.c.pedido_id == Pedido.id)
            .where(*filters)
            .order_by(Pedido.created_at.desc(), Pedido.id.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        rows = (await self.session.execute(query)).all()
        return [
            (pedido, usuario, int(cantidad_items))
            for pedido, usuario, cantidad_items in rows
        ], total

    async def get_admin_pedido_with_usuario(
        self,
        pedido_id: int,
    ) -> tuple[Pedido, Usuario] | None:
        result = await self.session.execute(
            select(Pedido, Usuario)
            .join(Usuario, Usuario.id == Pedido.usuario_id)
            .where(
                Pedido.id == pedido_id,
                Pedido.deleted_at.is_(None),
            )
        )
        row = result.one_or_none()
        if row is None:
            return None
        pedido, usuario = row
        return pedido, usuario

    async def list_historial_by_pedido_id(
        self, pedido_id: int
    ) -> list[HistorialEstadoPedido]:
        result = await self.session.execute(
            select(HistorialEstadoPedido)
            .where(HistorialEstadoPedido.pedido_id == pedido_id)
            .order_by(HistorialEstadoPedido.created_at.asc(), HistorialEstadoPedido.id.asc())
        )
        return list(result.scalars().all())

    async def save_productos(self, productos: list[Producto]) -> None:
        for producto in productos:
            self.session.add(producto)
        await self.session.flush()

    @staticmethod
    def _item_count_subquery():
        return (
            select(
                DetallePedido.pedido_id.label("pedido_id"),
                func.count(DetallePedido.id).label("cantidad_items"),
            )
            .group_by(DetallePedido.pedido_id)
            .subquery()
        )

    @staticmethod
    def _build_admin_filters(
        *,
        estado: str | None,
        desde: date | None,
        hasta: date | None,
        q: str | None,
    ) -> list:
        filters: list = []
        if estado:
            filters.append(Pedido.estado_codigo == estado)
        if desde:
            filters.append(Pedido.created_at >= datetime.combine(desde, time.min))
        if hasta:
            filters.append(Pedido.created_at <= datetime.combine(hasta, time.max))
        if q:
            value = q.strip()
            search_filters = [
                Usuario.nombre.ilike(f"%{value}%"),
                Usuario.apellido.ilike(f"%{value}%"),
                Usuario.email.ilike(f"%{value}%"),
            ]
            if value.isdigit():
                search_filters.append(Pedido.id == int(value))
            filters.append(or_(*search_filters))
        return filters
