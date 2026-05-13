"""Módulo usuarios — router admin."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from app.core.deps import require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.usuarios import service
from app.modules.usuarios.schemas import (
    CambiarEstadoRequest,
    CambiarRolesRequest,
    UsuarioDetailRead,
    UsuarioListResponse,
    UsuarioUpdateRequest,
)

router = APIRouter(prefix="/admin/usuarios", tags=["admin-usuarios"])


@router.get("", response_model=UsuarioListResponse)
async def listar_usuarios(
    q: Annotated[Optional[str], Query(description="Búsqueda por nombre o email")] = None,
    rol: Annotated[Optional[str], Query(description="Filtro por código de rol")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    _current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> UsuarioListResponse:
    async with UnitOfWork() as uow:
        return await service.listar_usuarios(uow, q, rol, page, size)


@router.get("/{usuario_id}", response_model=UsuarioDetailRead)
async def obtener_usuario(
    usuario_id: int,
    _current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> UsuarioDetailRead:
    async with UnitOfWork() as uow:
        return await service.obtener_usuario(usuario_id, uow)


@router.put("/{usuario_id}", response_model=UsuarioDetailRead)
async def editar_usuario(
    usuario_id: int,
    data: UsuarioUpdateRequest,
    _current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> UsuarioDetailRead:
    async with UnitOfWork() as uow:
        return await service.editar_usuario(usuario_id, data, uow)


@router.patch("/{usuario_id}/roles", response_model=UsuarioDetailRead)
async def cambiar_roles(
    usuario_id: int,
    data: CambiarRolesRequest,
    _current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> UsuarioDetailRead:
    async with UnitOfWork() as uow:
        return await service.cambiar_roles(usuario_id, data, uow)


@router.patch("/{usuario_id}/estado", response_model=UsuarioDetailRead)
async def cambiar_estado(
    usuario_id: int,
    data: CambiarEstadoRequest,
    _current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> UsuarioDetailRead:
    async with UnitOfWork() as uow:
        return await service.cambiar_estado(usuario_id, data, uow)
