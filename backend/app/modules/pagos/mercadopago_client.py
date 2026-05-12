import hmac
from dataclasses import dataclass
from decimal import Decimal
from hashlib import sha256
from typing import Mapping, Any

from app.core.config import Settings
from app.core.exceptions import BadGatewayError, ValidationAppError
from app.modules.pagos.schemas import CrearPagoRequest


@dataclass(frozen=True)
class MercadoPagoPaymentResult:
    mp_payment_id: int | None
    mp_order_id: str | None
    mp_status: str | None
    status_detail: str | None
    transaction_amount: Decimal | None
    external_reference: str | None
    raw_payload: dict[str, Any]


class MercadoPagoGateway:
    """Adaptador aislado para MercadoPago."""

    def __init__(self, settings: Settings) -> None:
        if not settings.MERCADOPAGO_ACCESS_TOKEN:
            raise ValidationAppError("MercadoPago no esta configurado.")
        self._settings = settings
        self._sdk = self._build_sdk(settings.MERCADOPAGO_ACCESS_TOKEN)

    @staticmethod
    def _build_sdk(access_token: str) -> object:
        try:
            import mercadopago  # type: ignore[import-untyped]
        except ImportError as exc:
            raise BadGatewayError("SDK de MercadoPago no instalado.") from exc
        return mercadopago.SDK(access_token)

    def create_card_payment(
        self,
        request: CrearPagoRequest,
        *,
        amount: Decimal,
        payer_email: str,
        external_reference: str,
        idempotency_key: str,
    ) -> MercadoPagoPaymentResult:
        payer: dict[str, Any] = {"email": payer_email}
        if request.payer_identification_type and request.payer_identification_number:
            payer["identification"] = {
                "type": request.payer_identification_type,
                "number": request.payer_identification_number,
            }

        payload: dict[str, Any] = {
            "transaction_amount": float(amount),
            "token": request.card_token,
            "description": f"Pedido #{request.pedido_id}",
            "installments": request.installments,
            "payment_method_id": request.payment_method_id,
            "payer": payer,
            "external_reference": external_reference,
        }
        if request.issuer_id:
            payload["issuer_id"] = (
                int(request.issuer_id) if request.issuer_id.isdigit() else request.issuer_id
            )

        request_options = self._build_request_options(idempotency_key)
        response = self._sdk.payment().create(payload, request_options)  # type: ignore[attr-defined]
        return self._parse_sdk_response(response)

    def get_payment(self, payment_id: str) -> MercadoPagoPaymentResult:
        response = self._sdk.payment().get(payment_id)  # type: ignore[attr-defined]
        return self._parse_sdk_response(response)

    def validate_webhook_signature(
        self,
        *,
        headers: Mapping[str, str],
        data_id: str | None,
    ) -> bool:
        secret = self._settings.MERCADOPAGO_WEBHOOK_SECRET
        if not secret:
            raise ValidationAppError("Webhook secret de MercadoPago no configurado.")

        signature = headers.get("x-signature")
        request_id = headers.get("x-request-id")
        if not signature or not request_id or not data_id:
            return False

        parts = self._parse_signature(signature)
        timestamp = parts.get("ts")
        received = parts.get("v1")
        if not timestamp or not received:
            return False

        manifest = f"id:{data_id};request-id:{request_id};ts:{timestamp};"
        expected = hmac.new(secret.encode(), manifest.encode(), sha256).hexdigest()
        return hmac.compare_digest(expected, received)

    @staticmethod
    def _parse_signature(signature: str) -> dict[str, str]:
        parts: dict[str, str] = {}
        for item in signature.split(","):
            key, _, value = item.partition("=")
            if key and value:
                parts[key.strip()] = value.strip()
        return parts

    @staticmethod
    def _build_request_options(idempotency_key: str) -> object:
        try:
            from mercadopago.config.request_options import RequestOptions  # type: ignore[import-untyped]
        except ImportError as exc:
            raise BadGatewayError("SDK de MercadoPago no instalado.") from exc
        return RequestOptions(custom_headers={"x-idempotency-key": idempotency_key})

    @staticmethod
    def _parse_sdk_response(response: dict[str, Any]) -> MercadoPagoPaymentResult:
        status = response.get("status")
        if isinstance(status, int) and status >= 400:
            raise BadGatewayError(MercadoPagoGateway._error_message(response))

        payload = response.get("response")
        if not isinstance(payload, dict):
            raise BadGatewayError("Respuesta invalida de MercadoPago.")

        order = payload.get("order")
        order_id = order.get("id") if isinstance(order, dict) else None
        return MercadoPagoPaymentResult(
            mp_payment_id=MercadoPagoGateway._int_or_none(payload.get("id")),
            mp_order_id=MercadoPagoGateway._str_or_none(order_id),
            mp_status=MercadoPagoGateway._str_or_none(payload.get("status")),
            status_detail=MercadoPagoGateway._str_or_none(payload.get("status_detail")),
            transaction_amount=MercadoPagoGateway._decimal_or_none(
                payload.get("transaction_amount")
            ),
            external_reference=MercadoPagoGateway._str_or_none(
                payload.get("external_reference")
            ),
            raw_payload=payload,
        )

    @staticmethod
    def _error_message(response: dict[str, Any]) -> str:
        payload = response.get("response")
        if not isinstance(payload, dict):
            message = response.get("message")
            return str(message or "MercadoPago rechazo la operacion.")

        message = payload.get("message") or response.get("message")
        causes = payload.get("cause")
        if isinstance(causes, list):
            cause_messages = [
                str(cause.get("description") or cause.get("message") or cause.get("code"))
                for cause in causes
                if isinstance(cause, dict)
            ]
            cause_messages = [item for item in cause_messages if item]
            if cause_messages:
                return f"MercadoPago rechazo la operacion: {'; '.join(cause_messages)}"

        return str(message or "MercadoPago rechazo la operacion.")

    @staticmethod
    def _int_or_none(value: object) -> int | None:
        try:
            return int(value) if value is not None else None
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _str_or_none(value: object) -> str | None:
        if value is None:
            return None
        return str(value)

    @staticmethod
    def _decimal_or_none(value: object) -> Decimal | None:
        if value is None:
            return None
        return Decimal(str(value))
