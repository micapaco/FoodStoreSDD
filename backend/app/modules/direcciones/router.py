"""Módulo direcciones — router HTTP.

Responsabilidad: parsear request, abrir UoW, delegar al servicio, serializar respuesta.
Sin lógica de negocio.
"""

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.direcciones.schemas import (
    DireccionCreate,
    DireccionList,
    DireccionRead,
    DireccionUpdate,
)
from app.modules.direcciones.service import DireccionService

router = APIRouter(prefix="/direcciones", tags=["direcciones"])


@router.get("", response_model=DireccionList)
async def list_direcciones(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: Usuario = Depends(require_role(["CLIENT"])),
) -> DireccionList:
    async with UnitOfWork() as uow:
        return await DireccionService.list(
            uow,
            usuario_id=current_user.id,  # type: ignore[arg-type]
            page=page,
            page_size=page_size,
        )


@router.get("/{direccion_id}", response_model=DireccionRead)
async def get_direccion(
    direccion_id: int,
    current_user: Usuario = Depends(require_role(["CLIENT"])),
) -> DireccionRead:
    async with UnitOfWork() as uow:
        return await DireccionService.get_by_id(
            uow,
            usuario_id=current_user.id,  # type: ignore[arg-type]
            direccion_id=direccion_id,
        )


@router.post("", status_code=status.HTTP_201_CREATED, response_model=DireccionRead)
async def create_direccion(
    data: DireccionCreate,
    current_user: Usuario = Depends(require_role(["CLIENT"])),
) -> DireccionRead:
    async with UnitOfWork() as uow:
        return await DireccionService.create(
            uow,
            usuario_id=current_user.id,  # type: ignore[arg-type]
            data=data,
        )


@router.put("/{direccion_id}", response_model=DireccionRead)
async def update_direccion(
    direccion_id: int,
    data: DireccionUpdate,
    current_user: Usuario = Depends(require_role(["CLIENT"])),
) -> DireccionRead:
    async with UnitOfWork() as uow:
        return await DireccionService.update(
            uow,
            usuario_id=current_user.id,  # type: ignore[arg-type]
            direccion_id=direccion_id,
            data=data,
        )


@router.delete("/{direccion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_direccion(
    direccion_id: int,
    current_user: Usuario = Depends(require_role(["CLIENT"])),
) -> None:
    async with UnitOfWork() as uow:
        await DireccionService.soft_delete(
            uow,
            usuario_id=current_user.id,  # type: ignore[arg-type]
            direccion_id=direccion_id,
        )


@router.patch("/{direccion_id}/principal", response_model=DireccionRead)
async def set_direccion_principal(
    direccion_id: int,
    current_user: Usuario = Depends(require_role(["CLIENT"])),
) -> DireccionRead:
    async with UnitOfWork() as uow:
        return await DireccionService.set_principal(
            uow,
            usuario_id=current_user.id,  # type: ignore[arg-type]
            direccion_id=direccion_id,
        )
