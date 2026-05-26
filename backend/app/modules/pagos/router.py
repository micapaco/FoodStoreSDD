import json
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.core.config import get_settings
from app.core.deps import get_current_user, require_role
from app.core.exceptions import ValidationAppError
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.db.models.ventas import Pedido
from app.modules.cocina.manager import emit_cocina_event
from app.modules.cocina.router import build_pedido_cocina_read
from app.modules.pagos.mercadopago_client import MercadoPagoGateway
from app.modules.pagos.schemas import (
    CrearPagoRequest,
    CrearPedidoMercadoPagoRequest,
    PagoRead,
    PagoStatusResponse,
    PedidoMercadoPagoResponse,
    WebhookResponse,
)
from app.modules.pagos.service import PagosService


async def _broadcast_pedido_confirmado(pedido_id: int) -> None:
    """Construye PedidoCocinaRead y emite PEDIDO_CONFIRMADO al KDS. Best-effort."""
    try:
        async with UnitOfWork() as uow:
            pedido = await uow.session.get(Pedido, pedido_id)
            if pedido is not None and pedido.estado_codigo == "CONFIRMADO":
                cocina_read = await build_pedido_cocina_read(uow, pedido)
                await emit_cocina_event(
                    "PEDIDO_CONFIRMADO", pedido_id, cocina_read.model_dump(mode="json", by_alias=True)
                )
    except Exception:
        pass

router = APIRouter(prefix="/pagos", tags=["Pagos"])


@router.post(
    "/crear",
    response_model=PagoRead,
    status_code=status.HTTP_201_CREATED,
)
async def crear_pago(
    request: CrearPagoRequest,
    current_user: Annotated[Usuario, Depends(require_role(["CLIENT"]))],
) -> PagoRead:
    gateway = MercadoPagoGateway(get_settings())
    async with UnitOfWork() as uow:
        service = PagosService()
        result = await service.crear_pago(uow, request, current_user, gateway)

    if result.mp_status == "approved":
        await _broadcast_pedido_confirmado(result.pedido_id)

    return result


@router.post(
    "/checkout",
    response_model=PedidoMercadoPagoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_pedido_con_pago(
    request: CrearPedidoMercadoPagoRequest,
    current_user: Annotated[Usuario, Depends(require_role(["CLIENT"]))],
) -> PedidoMercadoPagoResponse:
    gateway = MercadoPagoGateway(get_settings())
    async with UnitOfWork() as uow:
        service = PagosService()
        return await service.crear_pedido_con_pago(uow, request, current_user, gateway)


@router.get(
    "/{pedido_id}",
    response_model=PagoStatusResponse,
    status_code=status.HTTP_200_OK,
)
async def obtener_estado_pago(
    pedido_id: int,
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> PagoStatusResponse:
    async with UnitOfWork() as uow:
        service = PagosService()
        return await service.obtener_estado_por_pedido(uow, pedido_id, current_user)


@router.post(
    "/webhook",
    response_model=WebhookResponse,
    status_code=status.HTTP_200_OK,
)
async def mercado_pago_webhook(request: Request) -> WebhookResponse:
    body = await request.body()
    payload = _parse_payload(body)
    payment_id = _extract_payment_id(payload, request)
    gateway = MercadoPagoGateway(get_settings())

    if not gateway.validate_webhook_signature(
        headers=request.headers,
        data_id=payment_id,
    ):
        raise ValidationAppError("Firma de MercadoPago invalida.")

    confirmed_pedido_id: int | None = None
    async with UnitOfWork() as uow:
        service = PagosService()
        confirmed_pedido_id = await service.procesar_webhook(
            uow, payment_id=payment_id, gateway=gateway
        )

    if confirmed_pedido_id is not None:
        await _broadcast_pedido_confirmado(confirmed_pedido_id)

    return WebhookResponse(status="ok")


def _parse_payload(body: bytes) -> dict:
    if not body:
        return {}
    try:
        payload = json.loads(body.decode())
    except json.JSONDecodeError as exc:
        raise ValidationAppError("Payload de webhook invalido.") from exc
    if not isinstance(payload, dict):
        raise ValidationAppError("Payload de webhook invalido.")
    return payload


def _extract_payment_id(payload: dict, request: Request) -> str:
    query_id = request.query_params.get("data.id") or request.query_params.get("id")
    data = payload.get("data")
    body_id = data.get("id") if isinstance(data, dict) else None
    payment_id = query_id or body_id
    if payment_id is None:
        raise ValidationAppError("Webhook sin identificador de pago.")
    return str(payment_id)
