from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_user, require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.pedidos.schemas import (
    AvanzarEstadoRequest,
    CancelarPedidoRequest,
    ConfirmarPagoOfflineRequest,
    CrearPedidoRequest,
    HistorialEstadoRead,
    PedidoAdminDetailRead,
    PedidoAdminListResponse,
    PedidoDetailRead,
    PedidoListResponse,
    PedidoRead,
    ValidarCarritoRequest,
    ValidarCarritoResponse,
)
from app.modules.pedidos.service import PedidosService

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])
admin_router = APIRouter(prefix="/admin/pedidos", tags=["Pedidos Admin"])


@router.post(
    "/validar",
    response_model=ValidarCarritoResponse,
    status_code=status.HTTP_200_OK,
)
async def validar_carrito(
    request: ValidarCarritoRequest,
    _current_user: Annotated[Usuario, Depends(require_role(["CLIENT"]))],
) -> ValidarCarritoResponse:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.validar_carrito(uow, request)


@router.post(
    "",
    response_model=PedidoRead,
    status_code=status.HTTP_201_CREATED,
)
async def crear_pedido(
    request: CrearPedidoRequest,
    current_user: Annotated[Usuario, Depends(require_role(["CLIENT"]))],
) -> PedidoRead:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.crear_pedido(uow, request, current_user)


@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoRead,
    status_code=status.HTTP_200_OK,
)
async def avanzar_estado(
    pedido_id: int,
    request: AvanzarEstadoRequest,
    current_user: Annotated[Usuario, Depends(require_role(["ADMIN", "PEDIDOS"]))],
) -> PedidoRead:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.avanzar_estado(uow, pedido_id, request, current_user)


@router.delete(
    "/{pedido_id}",
    response_model=PedidoRead,
    status_code=status.HTTP_200_OK,
)
async def cancelar_pedido(
    pedido_id: int,
    request: CancelarPedidoRequest,
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> PedidoRead:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.cancelar_pedido(uow, pedido_id, request, current_user)


@router.post(
    "/{pedido_id}/confirmar-pago-offline",
    response_model=PedidoRead,
    status_code=status.HTTP_200_OK,
)
async def confirmar_pago_offline(
    pedido_id: int,
    request: ConfirmarPagoOfflineRequest,
    current_user: Annotated[Usuario, Depends(require_role(["ADMIN", "PEDIDOS"]))],
) -> PedidoRead:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.confirmar_pago_offline(uow, pedido_id, request, current_user)


@router.get(
    "",
    response_model=PedidoListResponse,
    status_code=status.HTTP_200_OK,
)
async def listar_pedidos_propios(
    current_user: Annotated[Usuario, Depends(require_role(["CLIENT"]))],
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 10,
    estado: Annotated[str | None, Query(max_length=20)] = None,
) -> PedidoListResponse:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.listar_propios(
            uow,
            current_user=current_user,
            page=page,
            size=size,
            estado=estado.strip().upper() if estado else None,
        )


@router.get(
    "/{pedido_id}",
    response_model=PedidoDetailRead,
    status_code=status.HTTP_200_OK,
)
async def obtener_detalle_pedido_propio(
    pedido_id: int,
    current_user: Annotated[Usuario, Depends(require_role(["CLIENT"]))],
) -> PedidoDetailRead:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.obtener_detalle_propio(
            uow,
            pedido_id=pedido_id,
            current_user=current_user,
        )


@router.get(
    "/{pedido_id}/historial",
    response_model=list[HistorialEstadoRead],
    status_code=status.HTTP_200_OK,
)
async def obtener_historial(
    pedido_id: int,
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> list[HistorialEstadoRead]:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.obtener_historial(uow, pedido_id, current_user)


@admin_router.get(
    "",
    response_model=PedidoAdminListResponse,
    status_code=status.HTTP_200_OK,
)
async def listar_pedidos_operativos(
    current_user: Annotated[Usuario, Depends(require_role(["ADMIN", "PEDIDOS"]))],
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: Annotated[str | None, Query(max_length=20)] = None,
    desde: Annotated[date | None, Query()] = None,
    hasta: Annotated[date | None, Query()] = None,
    q: Annotated[str | None, Query(max_length=120)] = None,
) -> PedidoAdminListResponse:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.listar_operativos(
            uow,
            current_user=current_user,
            page=page,
            size=size,
            estado=estado.strip().upper() if estado else None,
            desde=desde,
            hasta=hasta,
            q=q.strip() if q else None,
        )


@admin_router.get(
    "/{pedido_id}",
    response_model=PedidoAdminDetailRead,
    status_code=status.HTTP_200_OK,
)
async def obtener_detalle_pedido_operativo(
    pedido_id: int,
    current_user: Annotated[Usuario, Depends(require_role(["ADMIN", "PEDIDOS"]))],
) -> PedidoAdminDetailRead:
    async with UnitOfWork() as uow:
        service = PedidosService()
        return await service.obtener_detalle_operativo(
            uow,
            pedido_id=pedido_id,
            current_user=current_user,
        )
