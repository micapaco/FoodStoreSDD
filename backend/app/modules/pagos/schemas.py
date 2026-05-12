from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import Field, field_validator

from app.core.schemas import BaseSchema

PagoStatus = Literal["pending", "approved", "rejected", "in_process", "cancelled"]


class CrearPagoRequest(BaseSchema):
    pedido_id: int = Field(alias="pedidoId", gt=0)
    card_token: str = Field(alias="cardToken", min_length=1)
    payment_method_id: str = Field(alias="paymentMethodId", min_length=1, max_length=50)
    issuer_id: str | None = Field(default=None, alias="issuerId", max_length=50)
    installments: int = Field(ge=1, le=24)
    payer_email: str | None = Field(default=None, alias="payerEmail", max_length=254)
    payer_identification_type: str | None = Field(
        default=None,
        alias="payerIdentificationType",
        max_length=20,
    )
    payer_identification_number: str | None = Field(
        default=None,
        alias="payerIdentificationNumber",
        max_length=30,
    )

    @field_validator("payer_email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip().lower()
        return value or None

    @field_validator("payer_identification_type")
    @classmethod
    def normalize_identification_type(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip().upper()
        return value or None

    @field_validator("payer_identification_number")
    @classmethod
    def normalize_identification_number(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class PagoRead(BaseSchema):
    id: int
    pedido_id: int = Field(alias="pedidoId")
    mp_order_id: str | None = Field(alias="mpOrderId")
    mp_payment_id: int | None = Field(alias="mpPaymentId")
    mp_status: str | None = Field(alias="mpStatus")
    status_detail: str | None = Field(alias="statusDetail")
    external_reference: str = Field(alias="externalReference")
    idempotency_key: str = Field(alias="idempotencyKey")
    monto: Decimal | None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class PagoStatusResponse(BaseSchema):
    pedido_id: int = Field(alias="pedidoId")
    estado_pedido: str = Field(alias="estadoPedido")
    intentos: list[PagoRead]
    ultimo_intento: PagoRead | None = Field(alias="ultimoIntento")


class WebhookResponse(BaseSchema):
    status: str
