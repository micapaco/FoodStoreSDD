from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.deps import require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.pedidos.schemas import ValidarCarritoRequest, ValidarCarritoResponse
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
