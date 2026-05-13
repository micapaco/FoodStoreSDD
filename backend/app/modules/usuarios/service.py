"""Módulo usuarios — service layer (admin)."""

import math

from app.core.exceptions import ConflictError, NotFoundError
from app.core.uow import UnitOfWork
from app.modules.usuarios.schemas import (
    CambiarEstadoRequest,
    CambiarRolesRequest,
    UsuarioDetailRead,
    UsuarioListItem,
    UsuarioListResponse,
    UsuarioUpdateRequest,
)

_LAST_ADMIN_ERROR = "No se puede modificar al único administrador del sistema."


async def listar_usuarios(
    uow: UnitOfWork,
    q: str | None,
    rol: str | None,
    page: int,
    size: int,
) -> UsuarioListResponse:
    skip = (page - 1) * size
    usuarios, total = await uow.usuarios.list_paginated(q, rol, skip, size)

    items = []
    for u in usuarios:
        roles = await uow.usuarios.get_roles_for_user(u.id)
        items.append(
            UsuarioListItem(
                id=u.id,
                nombre=u.nombre,
                apellido=u.apellido,
                email=u.email,
                roles=roles,
                activo=u.activo,
                created_at=u.created_at,
            )
        )

    return UsuarioListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=max(1, math.ceil(total / size)),
    )


async def obtener_usuario(usuario_id: int, uow: UnitOfWork) -> UsuarioDetailRead:
    usuario = await uow.usuarios.get_admin_user_by_id(usuario_id)
    if usuario is None:
        raise NotFoundError(f"Usuario {usuario_id} no encontrado.")
    roles = await uow.usuarios.get_roles_for_user(usuario_id)
    return UsuarioDetailRead(
        id=usuario.id,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        email=usuario.email,
        telefono=usuario.telefono,
        roles=roles,
        activo=usuario.activo,
        created_at=usuario.created_at,
        updated_at=usuario.updated_at,
    )


async def editar_usuario(
    usuario_id: int,
    data: UsuarioUpdateRequest,
    uow: UnitOfWork,
) -> UsuarioDetailRead:
    usuario = await uow.usuarios.get_admin_user_by_id(usuario_id)
    if usuario is None:
        raise NotFoundError(f"Usuario {usuario_id} no encontrado.")

    if data.email != usuario.email:
        existing = await uow.usuarios.get_by_email(data.email)
        if existing is not None:
            raise ConflictError("El email ya está registrado por otro usuario.")

    usuario.nombre = data.nombre
    usuario.apellido = data.apellido
    usuario.email = data.email
    usuario.telefono = data.telefono
    await uow.usuarios.update_usuario(usuario)

    roles = await uow.usuarios.get_roles_for_user(usuario_id)
    return UsuarioDetailRead(
        id=usuario.id,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        email=usuario.email,
        telefono=usuario.telefono,
        roles=roles,
        activo=usuario.activo,
        created_at=usuario.created_at,
        updated_at=usuario.updated_at,
    )


async def cambiar_roles(
    usuario_id: int,
    data: CambiarRolesRequest,
    uow: UnitOfWork,
) -> UsuarioDetailRead:
    usuario = await uow.usuarios.get_admin_user_by_id(usuario_id)
    if usuario is None:
        raise NotFoundError(f"Usuario {usuario_id} no encontrado.")

    # RN-RB04: proteger al último admin
    roles_actuales = await uow.usuarios.get_roles_for_user(usuario_id)
    if "ADMIN" in roles_actuales and "ADMIN" not in data.roles:
        total_admins = await uow.usuarios.count_admins()
        if total_admins <= 1:
            raise ConflictError(_LAST_ADMIN_ERROR)

    await uow.usuarios.set_roles(usuario_id, data.roles)
    await uow.usuarios.revocar_todos_tokens(usuario_id)

    return UsuarioDetailRead(
        id=usuario.id,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        email=usuario.email,
        telefono=usuario.telefono,
        roles=data.roles,
        activo=usuario.activo,
        created_at=usuario.created_at,
        updated_at=usuario.updated_at,
    )


async def cambiar_estado(
    usuario_id: int,
    data: CambiarEstadoRequest,
    uow: UnitOfWork,
) -> UsuarioDetailRead:
    usuario = await uow.usuarios.get_admin_user_by_id(usuario_id)
    if usuario is None:
        raise NotFoundError(f"Usuario {usuario_id} no encontrado.")

    # RN-RB04: no desactivar al último admin
    if not data.activo:
        roles_actuales = await uow.usuarios.get_roles_for_user(usuario_id)
        if "ADMIN" in roles_actuales:
            total_admins = await uow.usuarios.count_admins()
            if total_admins <= 1:
                raise ConflictError(_LAST_ADMIN_ERROR)

    usuario.activo = data.activo
    await uow.usuarios.update_usuario(usuario)

    if not data.activo:
        await uow.usuarios.revocar_todos_tokens(usuario_id)

    roles = await uow.usuarios.get_roles_for_user(usuario_id)
    return UsuarioDetailRead(
        id=usuario.id,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        email=usuario.email,
        telefono=usuario.telefono,
        roles=roles,
        activo=usuario.activo,
        created_at=usuario.created_at,
        updated_at=usuario.updated_at,
    )
