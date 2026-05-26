from datetime import datetime
from uuid import uuid4

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationAppError
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.db.models.ventas import Pago, Pedido
from app.modules.pagos.mercadopago_client import MercadoPagoGateway, MercadoPagoPaymentResult
from app.modules.pagos.schemas import (
    CrearPagoRequest,
    CrearPedidoMercadoPagoRequest,
    PagoRead,
    PagoStatusResponse,
    PedidoMercadoPagoResponse,
)
from app.modules.pedidos.schemas import CancelarPedidoRequest
from app.modules.pedidos.service import PedidosService

ESTADO_PENDIENTE = "PENDIENTE"
FORMA_MERCADOPAGO = "MERCADOPAGO"
BLOCKING_STATUSES = {"pending", "in_process"}
RETRYABLE_STATUSES = {"rejected", "cancelled"}
AUTO_CANCEL_STATUSES = {"rejected", "cancelled"}


class PagosService:
    """Casos de uso de pagos MercadoPago."""

    async def crear_pedido_con_pago(
        self,
        uow: UnitOfWork,
        request: CrearPedidoMercadoPagoRequest,
        current_user: Usuario,
        gateway: MercadoPagoGateway,
    ) -> PedidoMercadoPagoResponse:
        if request.pedido.forma_pago_codigo != FORMA_MERCADOPAGO:
            raise ValidationAppError("El checkout MercadoPago requiere forma de pago MercadoPago.")

        pedidos_service = PedidosService()
        pedido_read = await pedidos_service.crear_pedido(uow, request.pedido, current_user)
        pago_request = CrearPagoRequest.model_validate(
            {
                "pedidoId": pedido_read.id,
                "cardToken": request.card_token,
                "paymentMethodId": request.payment_method_id,
                "issuerId": request.issuer_id,
                "installments": request.installments,
                "payerEmail": request.payer_email,
                "payerIdentificationType": request.payer_identification_type,
                "payerIdentificationNumber": request.payer_identification_number,
            }
        )
        pago = await self.crear_pago(uow, pago_request, current_user, gateway)
        if pago.mp_status in AUTO_CANCEL_STATUSES:
            pedido_read = await pedidos_service.cancelar_pedido(
                uow,
                pedido_read.id,
                CancelarPedidoRequest(motivo=self._auto_cancel_motivo(pago.mp_status, pago.status_detail)),
                current_user,
            )
        else:
            pedido = await uow.pedidos.get_by_id(pedido_read.id)
            if pedido is not None:
                pedido_read = pedidos_service._to_read(pedido)
        return PedidoMercadoPagoResponse(pedido=pedido_read, pago=pago)

    async def crear_pago(
        self,
        uow: UnitOfWork,
        request: CrearPagoRequest,
        current_user: Usuario,
        gateway: MercadoPagoGateway,
    ) -> PagoRead:
        usuario_id = self._require_usuario_id(current_user)
        pedido = await self._get_payable_pedido(uow, request.pedido_id, usuario_id)
        await self._validate_new_attempt(uow, pedido.id)

        idempotency_key = str(uuid4())
        external_reference = f"pedido-{pedido.id}-intento-{uuid4().hex[:12]}"
        result = gateway.create_card_payment(
            request,
            amount=pedido.total,
            payer_email=request.payer_email or current_user.email,
            external_reference=external_reference,
            idempotency_key=idempotency_key,
        )
        pago = await self._persist_pago(
            uow,
            pedido=pedido,
            result=result,
            idempotency_key=idempotency_key,
            external_reference=external_reference,
        )
        if result.mp_status == "approved":
            await PedidosService().confirmar_por_pago(uow, pago.pedido_id)
        return self._to_read(pago)

    async def obtener_estado_por_pedido(
        self,
        uow: UnitOfWork,
        pedido_id: int,
        current_user: Usuario,
    ) -> PagoStatusResponse:
        pedido = await uow.pedidos.get_by_id(pedido_id)
        if pedido is None or pedido.deleted_at is not None:
            raise NotFoundError("Pedido no encontrado.")
        await self._ensure_can_view_pedido(uow, pedido, current_user)
        intentos = await uow.pagos.list_by_pedido_id(pedido_id)
        reads = [self._to_read(pago) for pago in intentos]
        return PagoStatusResponse(
            pedido_id=pedido.id,
            estado_pedido=pedido.estado_codigo,
            intentos=reads,
            ultimo_intento=reads[-1] if reads else None,
        )

    async def procesar_webhook(
        self,
        uow: UnitOfWork,
        *,
        payment_id: str,
        gateway: MercadoPagoGateway,
    ) -> int | None:
        """Procesa webhook de MercadoPago. Retorna pedido_id si fue confirmado, None otherwise."""
        result = gateway.get_payment(payment_id)
        pago = await self._find_pago_for_result(uow, result)
        if pago is None:
            return None

        self._apply_payment_result(pago, result)
        await uow.pagos.update(pago)

        if result.mp_status == "approved":
            await PedidosService().confirmar_por_pago(uow, pago.pedido_id)
            return pago.pedido_id
        return None

    @staticmethod
    def _require_usuario_id(current_user: Usuario) -> int:
        if current_user.id is None:
            raise ValidationAppError("Usuario invalido.")
        return current_user.id

    @staticmethod
    async def _get_payable_pedido(
        uow: UnitOfWork,
        pedido_id: int,
        usuario_id: int,
    ) -> Pedido:
        pedido = await uow.pedidos.get_by_id(pedido_id)
        if pedido is None or pedido.deleted_at is not None:
            raise NotFoundError("Pedido no encontrado.")
        if pedido.usuario_id != usuario_id:
            raise ForbiddenError("El pedido no pertenece al usuario autenticado.")
        if pedido.estado_codigo != ESTADO_PENDIENTE:
            raise ConflictError("Solo se pueden pagar pedidos pendientes.")
        if pedido.forma_pago_codigo != FORMA_MERCADOPAGO:
            raise ValidationAppError("El pedido no usa MercadoPago como forma de pago.")
        return pedido

    @staticmethod
    async def _validate_new_attempt(uow: UnitOfWork, pedido_id: int | None) -> None:
        if pedido_id is None:
            raise ValidationAppError("Pedido invalido.")
        intentos = await uow.pagos.list_by_pedido_id(pedido_id)
        if not intentos:
            return
        ultimo = intentos[-1]
        if ultimo.mp_status == "approved":
            raise ConflictError("El pedido ya tiene un pago aprobado.")
        if ultimo.mp_status in BLOCKING_STATUSES:
            raise ConflictError("El pedido ya tiene un intento de pago en proceso.")
        if ultimo.mp_status not in RETRYABLE_STATUSES:
            raise ConflictError("El ultimo intento de pago aun no admite reintento.")

    @staticmethod
    async def _persist_pago(
        uow: UnitOfWork,
        *,
        pedido: Pedido,
        result: MercadoPagoPaymentResult,
        idempotency_key: str,
        external_reference: str,
    ) -> Pago:
        if pedido.id is None:
            raise ValidationAppError("Pedido invalido.")
        pago = Pago(
            pedido_id=pedido.id,
            mp_payment_id=result.mp_payment_id,
            mp_order_id=result.mp_order_id,
            mp_status=result.mp_status,
            status_detail=result.status_detail,
            monto=result.transaction_amount or pedido.total,
            external_reference=result.external_reference or external_reference,
            idempotency_key=idempotency_key,
            raw_payload=result.raw_payload,
        )
        return await uow.pagos.create(pago)

    async def _ensure_can_view_pedido(
        self,
        uow: UnitOfWork,
        pedido: Pedido,
        current_user: Usuario,
    ) -> None:
        usuario_id = self._require_usuario_id(current_user)
        result = await uow.usuarios.get_with_roles(usuario_id)
        roles = result[1] if result else []
        if pedido.usuario_id != usuario_id and "ADMIN" not in roles:
            raise ForbiddenError("No tenes permiso para ver los pagos de este pedido.")

    @staticmethod
    async def _find_pago_for_result(
        uow: UnitOfWork,
        result: MercadoPagoPaymentResult,
    ) -> Pago | None:
        if result.mp_payment_id is not None:
            pago = await uow.pagos.get_by_mp_payment_id(result.mp_payment_id)
            if pago is not None:
                return pago
        if result.mp_order_id:
            pago = await uow.pagos.get_by_mp_order_id(result.mp_order_id)
            if pago is not None:
                return pago
        if result.external_reference:
            return await uow.pagos.get_by_external_reference(result.external_reference)
        return None

    @staticmethod
    def _apply_payment_result(pago: Pago, result: MercadoPagoPaymentResult) -> None:
        pago.mp_payment_id = result.mp_payment_id or pago.mp_payment_id
        pago.mp_order_id = result.mp_order_id or pago.mp_order_id
        pago.mp_status = result.mp_status
        pago.status_detail = result.status_detail
        pago.monto = result.transaction_amount or pago.monto
        pago.raw_payload = result.raw_payload
        pago.updated_at = datetime.utcnow()

    @staticmethod
    def _auto_cancel_motivo(status: str | None, status_detail: str | None) -> str:
        detail = f" ({status_detail})" if status_detail else ""
        return f"Pago MercadoPago {status or 'rechazado'}{detail}."

    @staticmethod
    def _to_read(pago: Pago) -> PagoRead:
        if pago.id is None:
            raise ValidationAppError("Pago invalido.")
        return PagoRead(
            id=pago.id,
            pedido_id=pago.pedido_id,
            mp_order_id=pago.mp_order_id,
            mp_payment_id=pago.mp_payment_id,
            mp_status=pago.mp_status,
            status_detail=pago.status_detail,
            external_reference=pago.external_reference,
            idempotency_key=pago.idempotency_key,
            monto=pago.monto,
            created_at=pago.created_at,
            updated_at=pago.updated_at,
        )
