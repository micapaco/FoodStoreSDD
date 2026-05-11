"""
Módulo productos — repositorio.

Extiende BaseRepository[Producto] con queries específicas del dominio:
- list_paginated: búsqueda con filtros combinados (texto, categoría, ingrediente, precio, disponibilidad, sort)
- get_with_relations: carga producto con categorías e ingredientes expandidos
- sync_categorias/ingredientes: sincronización de tablas pivote
- update_stock/disponibilidad: actualización directa de campos
"""

from decimal import Decimal
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.db.models.catalogo import (
    Producto,
    ProductoCategoria,
    ProductoIngrediente,
)
from app.modules.productos.schemas import IngredienteAsignacion


class ProductoRepository(BaseRepository[Producto]):
    """Repositorio de Producto con filtros, relaciones y sync de tablas pivote."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Producto)

    async def list_paginated(
        self,
        page: int = 1,
        size: int = 20,
        q: Optional[str] = None,
        categoria_id: Optional[int] = None,
        ingrediente_id: Optional[int] = None,
        precio_min: Optional[Decimal] = None,
        precio_max: Optional[Decimal] = None,
        disponible: Optional[bool] = None,
        sort: str = "created_at",
        order: str = "desc",
        admin: bool = False,
    ) -> tuple[list[Producto], int]:
        """Lista productos con filtros combinados y paginación.

        En modo admin incluye productos no disponibles (disponible=False).
        En modo público solo productos disponibles.
        Siempre excluye soft-deleted excepto en admin.
        """
        # Build base query
        query = select(Producto)
        count_query = select(func.count(Producto.id.distinct())).select_from(Producto)

        # ── Filters ───────────────────────────────────────────────────────
        if not admin:
            query = query.where(Producto.deleted_at.is_(None))
            query = query.where(Producto.disponible == True)
            count_query = count_query.where(Producto.deleted_at.is_(None))
            count_query = count_query.where(Producto.disponible == True)

        if q:
            like_pattern = f"%{q}%"
            query = query.where(Producto.nombre.ilike(like_pattern))
            count_query = count_query.where(Producto.nombre.ilike(like_pattern))

        if categoria_id is not None:
            query = query.join(
                ProductoCategoria, Producto.id == ProductoCategoria.producto_id
            ).where(ProductoCategoria.categoria_id == categoria_id)
            count_query = count_query.join(
                ProductoCategoria, Producto.id == ProductoCategoria.producto_id
            ).where(ProductoCategoria.categoria_id == categoria_id)

        if ingrediente_id is not None:
            query = query.join(
                ProductoIngrediente, Producto.id == ProductoIngrediente.producto_id
            ).where(ProductoIngrediente.ingrediente_id == ingrediente_id)
            count_query = count_query.join(
                ProductoIngrediente, Producto.id == ProductoIngrediente.producto_id
            ).where(ProductoIngrediente.ingrediente_id == ingrediente_id)

        if precio_min is not None:
            query = query.where(Producto.precio_base >= precio_min)
            count_query = count_query.where(Producto.precio_base >= precio_min)

        if precio_max is not None:
            query = query.where(Producto.precio_base <= precio_max)
            count_query = count_query.where(Producto.precio_base <= precio_max)

        if disponible is not None and admin:
            query = query.where(Producto.disponible == disponible)
            count_query = count_query.where(Producto.disponible == disponible)

        # ── Count ─────────────────────────────────────────────────────────
        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        # ── Sort ───────────────────────────────────────────────────────────
        sort_column = getattr(Producto, sort, Producto.created_at)
        order_func = sort_column.desc() if order == "desc" else sort_column.asc()

        # ── Paginate ──────────────────────────────────────────────────────
        skip = (page - 1) * size
        query = (
            query.distinct()
            .order_by(order_func)
            .offset(skip)
            .limit(size)
            .options(
                selectinload(Producto.categorias),
                selectinload(Producto.ingredientes),
            )
        )

        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def get_with_relations(self, producto_id: int) -> Optional[Producto]:
        """Obtiene un producto con sus categorías e ingredientes expandidos."""
        query = (
            select(Producto)
            .where(Producto.id == producto_id, Producto.deleted_at.is_(None))
            .options(
                selectinload(Producto.categorias),
                selectinload(Producto.ingredientes),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_id_admin(self, producto_id: int) -> Optional[Producto]:
        """Obtiene un producto incluyendo soft-deleted (solo para admin)."""
        query = (
            select(Producto)
            .where(Producto.id == producto_id)
            .options(
                selectinload(Producto.categorias),
                selectinload(Producto.ingredientes),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_nombre(self, nombre: str) -> Optional[Producto]:
        """Busca un producto por nombre exacto (incluye eliminados)."""
        result = await self.session.execute(
            select(Producto).where(Producto.nombre == nombre)
        )
        return result.scalar_one_or_none()

    async def get_ingrediente_associations(
        self, producto_id: int
    ) -> dict[int, bool]:
        """Retorna un dict {ingrediente_id: es_removible} para un producto."""
        result = await self.session.execute(
            select(ProductoIngrediente).where(
                ProductoIngrediente.producto_id == producto_id
            )
        )
        return {
            row.ingrediente_id: row.es_removible
            for row in result.scalars().all()
        }

    async def sync_categorias(
        self, producto_id: int, categoria_ids: list[int]
    ) -> None:
        """Reemplaza las categorías de un producto.

        Elimina las asociaciones existentes e inserta las nuevas.
        Opera dentro de la transacción del UoW.
        """
        await self.session.execute(
            delete(ProductoCategoria).where(
                ProductoCategoria.producto_id == producto_id
            )
        )
        for cat_id in categoria_ids:
            self.session.add(
                ProductoCategoria(producto_id=producto_id, categoria_id=cat_id)
            )
        await self.session.flush()

    async def sync_ingredientes(
        self, producto_id: int, ingredientes: list[IngredienteAsignacion]
    ) -> None:
        """Reemplaza los ingredientes de un producto con sus flags.

        Cada ingrediente lleva es_removible. Elimina los existentes e inserta.
        """
        await self.session.execute(
            delete(ProductoIngrediente).where(
                ProductoIngrediente.producto_id == producto_id
            )
        )
        for ing in ingredientes:
            self.session.add(
                ProductoIngrediente(
                    producto_id=producto_id,
                    ingrediente_id=ing.ingrediente_id,
                    es_removible=ing.es_removible,
                )
            )
        await self.session.flush()

    async def update_stock(self, producto_id: int, stock_cantidad: int) -> None:
        """Actualiza el stock de un producto. No valida — la validación es del service."""
        producto = await self.get_by_id(producto_id)
        if producto is None:
            return
        producto.stock_cantidad = stock_cantidad
        self.session.add(producto)
        await self.session.flush()

    async def update_disponibilidad(
        self, producto_id: int, disponible: bool
    ) -> None:
        """Actualiza la disponibilidad de un producto."""
        producto = await self.get_by_id(producto_id)
        if producto is None:
            return
        producto.disponible = disponible
        self.session.add(producto)
        await self.session.flush()
