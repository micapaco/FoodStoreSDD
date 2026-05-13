"""Módulo usuarios — repositorio."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.db.models.identidad import RefreshToken, Rol, Usuario, UsuarioRol


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
        """Carga un usuario activo junto con la lista de códigos de rol asignados."""
        result = await self.session.execute(
            select(Usuario).where(
                Usuario.id == user_id,
                Usuario.deleted_at.is_(None),
            )
        )
        usuario = result.scalar_one_or_none()
        if usuario is None:
            return None

        roles_result = await self.session.execute(
            select(Rol.codigo).join(
                UsuarioRol, UsuarioRol.rol_codigo == Rol.codigo
            ).where(UsuarioRol.usuario_id == user_id)
        )
        roles = list(roles_result.scalars().all())
        return (usuario, roles)

    async def get_admin_user_by_id(self, user_id: int) -> Optional[Usuario]:
        """Busca un usuario por id sin filtrar por deleted_at (para admin)."""
        result = await self.session.execute(
            select(Usuario).where(Usuario.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_roles_for_user(self, user_id: int) -> list[str]:
        """Retorna los códigos de rol del usuario."""
        result = await self.session.execute(
            select(Rol.codigo).join(
                UsuarioRol, UsuarioRol.rol_codigo == Rol.codigo
            ).where(UsuarioRol.usuario_id == user_id)
        )
        return list(result.scalars().all())

    async def list_paginated(
        self,
        q: Optional[str],
        rol: Optional[str],
        skip: int,
        limit: int,
    ) -> tuple[list[Usuario], int]:
        """Listado paginado con búsqueda por nombre/email y filtro por rol.

        Retorna (items, total).
        """
        base_query = select(Usuario).where(Usuario.deleted_at.is_(None))

        if q:
            pattern = f"%{q}%"
            base_query = base_query.where(
                (Usuario.nombre.ilike(pattern))
                | (Usuario.apellido.ilike(pattern))
                | (Usuario.email.ilike(pattern))
            )

        if rol:
            base_query = base_query.join(
                UsuarioRol, UsuarioRol.usuario_id == Usuario.id
            ).where(UsuarioRol.rol_codigo == rol)

        count_result = await self.session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        items_result = await self.session.execute(
            base_query.order_by(Usuario.created_at.desc()).offset(skip).limit(limit)
        )
        items = list(items_result.scalars().all())
        return (items, total)

    async def count_admins(self) -> int:
        """Cuenta usuarios activos con rol ADMIN."""
        result = await self.session.execute(
            select(func.count()).select_from(
                select(Usuario.id)
                .join(UsuarioRol, UsuarioRol.usuario_id == Usuario.id)
                .where(
                    UsuarioRol.rol_codigo == "ADMIN",
                    Usuario.activo.is_(True),
                    Usuario.deleted_at.is_(None),
                )
                .subquery()
            )
        )
        return result.scalar_one()

    async def set_roles(self, usuario_id: int, roles: list[str]) -> None:
        """Reemplaza los roles del usuario de forma atómica (borra + reinserta)."""
        await self.session.execute(
            delete(UsuarioRol).where(UsuarioRol.usuario_id == usuario_id)
        )
        await self.session.flush()
        for rol_codigo in roles:
            self.session.add(UsuarioRol(usuario_id=usuario_id, rol_codigo=rol_codigo))
        await self.session.flush()

    async def revocar_todos_tokens(self, usuario_id: int) -> None:
        """Revoca todos los refresh tokens activos del usuario."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        await self.session.flush()

    async def update_usuario(self, usuario: Usuario) -> Usuario:
        """Persiste cambios en un usuario ya cargado en la sesión."""
        usuario.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        self.session.add(usuario)
        await self.session.flush()
        return usuario
