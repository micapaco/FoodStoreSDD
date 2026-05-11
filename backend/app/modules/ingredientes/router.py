"""
Módulo ingredientes — router HTTP.

Responsabilidad: parsear request, abrir UoW, delegar al servicio, serializar respuesta.
Sin lógica de negocio — eso pertenece a IngredienteService.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_user, require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteList,
    IngredienteRead,
    IngredienteUpdate,
)
from app.modules.ingredientes.service import IngredienteService

router = APIRouter(prefix="/ingredientes", tags=["ingredientes"])


# ── Endpoints públicos ─────────────────────────────────────────────────────


@router.get("", response_model=IngredienteList)
async def list_ingredientes(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    alergeno: Optional[bool] = Query(None, description="Filtrar solo alérgenos"),
) -> IngredienteList:
    """Lista ingredientes activos con paginación y filtro opcional de alérgenos. Público."""
    async with UnitOfWork() as uow:
        return await IngredienteService.list_all(uow, page=page, size=size, alergeno=alergeno)


@router.get("/{ingrediente_id}", response_model=IngredienteRead)
async def get_ingrediente(ingrediente_id: int) -> IngredienteRead:
    """Detalle de un ingrediente por ID. Público."""
    async with UnitOfWork() as uow:
        return await IngredienteService.get_by_id(uow, ingrediente_id)


# ── Endpoints protegidos (ADMIN / STOCK) ───────────────────────────────────


@router.post("", status_code=status.HTTP_201_CREATED, response_model=IngredienteRead)
async def create_ingrediente(
    data: IngredienteCreate,
    _admin: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> IngredienteRead:
    """Crea un ingrediente. Requiere rol ADMIN o STOCK."""
    async with UnitOfWork() as uow:
        return await IngredienteService.create(uow, data)


@router.put("/{ingrediente_id}", response_model=IngredienteRead)
async def update_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    _admin: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> IngredienteRead:
    """Actualiza un ingrediente. Requiere rol ADMIN o STOCK."""
    async with UnitOfWork() as uow:
        return await IngredienteService.update(uow, ingrediente_id, data)


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingrediente(
    ingrediente_id: int,
    _admin: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> None:
    """Elimina (soft delete) un ingrediente. Requiere rol ADMIN o STOCK."""
    async with UnitOfWork() as uow:
        await IngredienteService.soft_delete(uow, ingrediente_id)
