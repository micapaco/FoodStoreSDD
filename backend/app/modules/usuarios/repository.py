"""
Módulo usuarios — repositorio.

Extiende BaseRepository[Usuario] con queries específicas de dominio:
- get_by_email: buscar usuario por email (excluye soft-deleted)
- get_with_roles: cargar usuario + sus roles via UsuarioRol
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.db.models.identidad import Rol, Usuario, UsuarioRol


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Usuario)

    async def get_by_email(self, email: str) -> Optional[Usuario]:
        """Busca un usuario activo por email. Retorna None si no existe o está soft-deleted."""
        result = await self.session.execute(
            select(Usuario).where(
                Usuario.email == email,
                Usuario.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_with_roles(self, user_id: int) -> Optional[tuple[Usuario, list[str]]]:
        """Carga un usuario activo junto con la lista de códigos de rol asignados.

        Retorna una tupla (Usuario, list[str]) o None si no existe o está soft-deleted.
        """
        # Cargar el usuario
        result = await self.session.execute(
            select(Usuario).where(
                Usuario.id == user_id,
                Usuario.deleted_at.is_(None),
            )
        )
        usuario = result.scalar_one_or_none()
        if usuario is None:
            return None

        # Cargar los roles via join con UsuarioRol
        roles_result = await self.session.execute(
            select(Rol.codigo).join(
                UsuarioRol, UsuarioRol.rol_codigo == Rol.codigo
            ).where(UsuarioRol.usuario_id == user_id)
        )
        roles = list(roles_result.scalars().all())

        return (usuario, roles)
