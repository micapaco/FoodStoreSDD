from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.deps import get_current_user, require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.pedidos.schemas import (
    AvanzarEstadoRequest,
    CancelarPedidoRequest,
    CrearPedidoRequest,
    HistorialEstadoRead,
    PedidoRead,
    ValidarCarritoRequest,
    ValidarCarritoResponse,
)
from app.modules.pedidos.service import PedidosService

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


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
