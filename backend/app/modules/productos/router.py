"""
Módulo productos — router HTTP.

Responsabilidad: parsear request, abrir UoW, delegar al servicio, serializar respuesta.
Sin lógica de negocio — eso pertenece a ProductoService.

Los endpoints GET / y GET /{id} son híbridos: funcionan sin auth (modo público)
pero si el usuario es ADMIN ven datos extendidos (productos no disponibles, etc).
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_user, get_optional_current_user, require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoDetail,
    ProductoDisponibilidadUpdate,
    ProductoList,
    ProductoRead,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import ProductoService

router = APIRouter(prefix="/productos", tags=["productos"])


# ── Helpers ────────────────────────────────────────────────────────────────


async def _is_admin(uow: UnitOfWork, usuario: Optional[Usuario]) -> bool:
    """Verifica si un usuario tiene rol ADMIN (sin lanzar excepción)."""
    if usuario is None:
        return False
    result = await uow.usuarios.get_with_roles(usuario.id)  # type: ignore[arg-type]
    if result is None:
        return False
    _, roles = result
    return "ADMIN" in roles


# ── Endpoints híbridos (público + admin extendido) ─────────────────────────


@router.get("", response_model=ProductoList)
async def list_productos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None, description="Búsqueda por nombre"),
    categoria_id: Optional[int] = Query(
        None, description="Filtrar por categoría"
    ),
    ingrediente_id: Optional[int] = Query(
        None, description="Filtrar por ingrediente"
    ),
    precio_min: Optional[float] = Query(
        None, ge=0, description="Precio mínimo"
    ),
    precio_max: Optional[float] = Query(
        None, ge=0, description="Precio máximo"
    ),
    disponible: Optional[bool] = Query(
        None, description="Filtrar por disponibilidad (solo admin)"
    ),
    sort: str = Query(
        "created_at",
        description="Campo de ordenamiento: nombre, precio_base, created_at",
    ),
    order: str = Query(
        "desc", description="Dirección: asc o desc"
    ),
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
) -> ProductoList:
    """Lista productos.

    Sin autenticación: solo productos disponibles (disponible=true).
    Con auth ADMIN: todos los productos, permite filtrar por disponible.
    """
    async with UnitOfWork() as uow:
        is_admin = await _is_admin(uow, current_user)
        return await ProductoService.listar_productos(
            uow,
            page=page,
            size=size,
            q=q,
            categoria_id=categoria_id,
            ingrediente_id=ingrediente_id,
            precio_min=precio_min,
            precio_max=precio_max,
            disponible=disponible if is_admin else None,
            sort=sort,
            order=order,
            admin=is_admin,
        )


@router.get("/{producto_id}", response_model=ProductoDetail)
async def get_producto(
    producto_id: int,
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
) -> ProductoDetail:
    """Detalle de un producto.

    Sin autenticación: solo si disponible=true.
    Con auth ADMIN: cualquier producto (incluyendo no disponibles).
    """
    async with UnitOfWork() as uow:
        is_admin = await _is_admin(uow, current_user)
        return await ProductoService.obtener_producto(
            uow, producto_id, admin=is_admin
        )


# ── Endpoints protegidos (ADMIN) ──────────────────────────────────────────


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ProductoDetail,
)
async def create_producto(
    data: ProductoCreate,
    _admin: Usuario = Depends(require_role(["ADMIN"])),
) -> ProductoDetail:
    """Crea un producto con categorías e ingredientes. Requiere rol ADMIN."""
    async with UnitOfWork() as uow:
        return await ProductoService.crear_producto(uow, data)


@router.put("/{producto_id}", response_model=ProductoDetail)
async def update_producto(
    producto_id: int,
    data: ProductoUpdate,
    _admin: Usuario = Depends(require_role(["ADMIN"])),
) -> ProductoDetail:
    """Actualiza un producto. Requiere rol ADMIN."""
    async with UnitOfWork() as uow:
        return await ProductoService.actualizar_producto(
            uow, producto_id, data
        )


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_producto(
    producto_id: int,
    _admin: Usuario = Depends(require_role(["ADMIN"])),
) -> None:
    """Elimina (soft delete) un producto. Requiere rol ADMIN."""
    async with UnitOfWork() as uow:
        await ProductoService.eliminar_producto(uow, producto_id)


# ── Endpoints protegidos (ADMIN / STOCK) ──────────────────────────────────


@router.patch("/{producto_id}/stock", response_model=ProductoDetail)
async def update_producto_stock(
    producto_id: int,
    data: ProductoStockUpdate,
    _user: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> ProductoDetail:
    """Actualiza el stock de un producto. Requiere rol ADMIN o STOCK."""
    async with UnitOfWork() as uow:
        return await ProductoService.actualizar_stock(
            uow, producto_id, data.stock_cantidad
        )


@router.patch(
    "/{producto_id}/disponibilidad",
    response_model=ProductoDetail,
)
async def update_producto_disponibilidad(
    producto_id: int,
    data: ProductoDisponibilidadUpdate,
    _user: Usuario = Depends(require_role(["ADMIN", "STOCK"])),
) -> ProductoDetail:
    """Cambia la disponibilidad de un producto. Requiere rol ADMIN o STOCK."""
    async with UnitOfWork() as uow:
        return await ProductoService.actualizar_disponibilidad(
            uow, producto_id, data.disponible
        )
