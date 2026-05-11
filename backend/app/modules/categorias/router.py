"""
Módulo categorías — router HTTP.

Responsabilidad: parsear request, abrir UoW, delegar al servicio, serializar respuesta.
Sin lógica de negocio — eso pertenece a CategoriaService.
"""

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_user, require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaList,
    CategoriaRead,
    CategoriaUpdate,
)
from app.modules.categorias.service import CategoriaService

router = APIRouter(prefix="/categorias", tags=["categorias"])


# ── Endpoints públicos ─────────────────────────────────────────────────────


@router.get("/arbol", response_model=list[CategoriaRead])
async def get_arbol() -> list[CategoriaRead]:
    """Árbol completo de categorías activas. Público (no requiere auth)."""
    async with UnitOfWork() as uow:
        return await CategoriaService.get_tree(uow)


@router.get("", response_model=CategoriaList)
async def list_categorias(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> CategoriaList:
    """Lista plana de categorías activas con paginación. Público."""
    async with UnitOfWork() as uow:
        return await CategoriaService.list_all(uow, page=page, size=size)


@router.get("/{categoria_id}", response_model=CategoriaRead)
async def get_categoria(categoria_id: int) -> CategoriaRead:
    """Detalle de una categoría por ID. Público."""
    async with UnitOfWork() as uow:
        return await CategoriaService.get_by_id(uow, categoria_id)


# ── Endpoints protegidos (ADMIN / STOCK) ───────────────────────────────────


@router.post("", status_code=status.HTTP_201_CREATED, response_model=CategoriaRead)
async def create_categoria(
    data: CategoriaCreate,
    _admin: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> CategoriaRead:
    """Crea una categoría. Requiere rol ADMIN o STOCK."""
    async with UnitOfWork() as uow:
        return await CategoriaService.create(uow, data)


@router.put("/{categoria_id}", response_model=CategoriaRead)
async def update_categoria(
    categoria_id: int,
    data: CategoriaUpdate,
    _admin: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> CategoriaRead:
    """Actualiza una categoría. Requiere rol ADMIN o STOCK."""
    async with UnitOfWork() as uow:
        return await CategoriaService.update(uow, categoria_id, data)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_categoria(
    categoria_id: int,
    _admin: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> None:
    """Elimina (soft delete) una categoría. Requiere rol ADMIN o STOCK."""
    async with UnitOfWork() as uow:
        await CategoriaService.soft_delete(uow, categoria_id)
