"""
Módulo categorías — repositorio.

Extiende BaseRepository[Categoria] con queries para jerarquía:
- get_tree: CTE recursiva que retorna todas las categorías activas ordenadas jerárquicamente
- get_children: hijos directos de una categoría
- validate_parent_exists: verifica que el padre exista y esté activo
- check_circular_ref: detecta ciclos antes de reasignar parent_id
"""

from typing import Optional

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.db.models.catalogo import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    """Repositorio de Categoria con soporte para árbol jerárquico."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Categoria)

    async def get_tree(self) -> list[Categoria]:
        """Obtiene todas las categorías activas ordenadas por profundidad (DFS).

        Usa WITH RECURSIVE para construir el orden jerárquico desde raíces
        hasta hojas. Útil para construir el árbol en el service layer.
        """
        query = text("""
            WITH RECURSIVE cat_tree AS (
                SELECT id, nombre, parent_id, created_at, updated_at, 0 AS depth
                FROM categoria
                WHERE parent_id IS NULL AND deleted_at IS NULL
                UNION ALL
                SELECT c.id, c.nombre, c.parent_id, c.created_at, c.updated_at, t.depth + 1
                FROM categoria c
                INNER JOIN cat_tree t ON t.id = c.parent_id
                WHERE c.deleted_at IS NULL
            )
            SELECT id, nombre, parent_id, created_at, updated_at
            FROM cat_tree
            ORDER BY depth, created_at
        """)
        result = await self.session.execute(query)
        rows = result.fetchall()
        return [
            Categoria(
                id=row.id,
                nombre=row.nombre,
                parent_id=row.parent_id,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )
            for row in rows
        ]

    async def get_children(self, parent_id: int) -> list[Categoria]:
        """Retorna los hijos directos activos de una categoría."""
        result = await self.session.execute(
            select(Categoria).where(
                Categoria.parent_id == parent_id,
                Categoria.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def validate_parent_exists(self, parent_id: int) -> bool:
        """Verifica que exista una categoría activa con el id dado."""
        result = await self.session.execute(
            select(Categoria).where(
                Categoria.id == parent_id,
                Categoria.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none() is not None

    async def list_active(self, skip: int = 0, limit: int = 100) -> list[Categoria]:
        """Lista categorías activas (excluye soft-deleted)."""
        result = await self.session.execute(
            select(Categoria)
            .where(Categoria.deleted_at.is_(None))
            .order_by(Categoria.id)
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count_active(self) -> int:
        """Cuenta categorías activas."""
        result = await self.session.execute(
            select(func.count()).select_from(Categoria).where(
                Categoria.deleted_at.is_(None)
            )
        )
        return result.scalar_one()

    async def get_by_nombre(self, nombre: str) -> Optional[Categoria]:
        """Retorna una categoría por nombre (incluyendo eliminadas lógicamente).

        Útil para validar unique constraint antes de crear/actualizar.
        """
        result = await self.session.execute(
            select(Categoria).where(Categoria.nombre == nombre)
        )
        return result.scalar_one_or_none()

    async def check_circular_ref(self, categoria_id: int, new_parent_id: int) -> bool:
        """Verifica si asignar new_parent_id como padre crearía un ciclo.

        Evalúa si new_parent_id es descendiente (directo o indirecto) de
        categoria_id. Si lo es, retorna True (hay ciclo).

        Args:
            categoria_id: ID de la categoría que se está actualizando.
            new_parent_id: ID propuesto como nuevo padre.

        Returns:
            True si new_parent_id es descendiente de categoria_id (ciclo).
        """
        if categoria_id == new_parent_id:
            return True

        query = text("""
            WITH RECURSIVE descendants AS (
                SELECT id FROM categoria WHERE parent_id = :cat_id AND deleted_at IS NULL
                UNION ALL
                SELECT c.id FROM categoria c
                INNER JOIN descendants d ON d.id = c.parent_id
                WHERE c.deleted_at IS NULL
            )
            SELECT id FROM descendants WHERE id = :new_parent
        """)
        result = await self.session.execute(
            query,
            {"cat_id": categoria_id, "new_parent": new_parent_id},
        )
        return result.scalar_one_or_none() is not None
