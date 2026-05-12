from decimal import Decimal
from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator

from app.core.schemas import BaseSchema


class ItemValidar(BaseSchema):
    producto_id: int = Field(alias="productoId", gt=0)
    cantidad: int = Field(gt=0)
    precio_esperado: Decimal = Field(alias="precioEsperado", ge=0)
    exclusiones: list[int] = Field(default_factory=list)


class ValidarCarritoRequest(BaseSchema):
    items: list[ItemValidar] = Field(min_length=1)


class ErrorValidacion(BaseSchema):
    producto_id: int = Field(alias="productoId")
    tipo: Literal["STOCK_INSUFICIENTE", "PRECIO_CAMBIADO", "NO_DISPONIBLE"]
    mensaje: str


class PrecioActualizado(BaseSchema):
    producto_id: int = Field(alias="productoId")
    precio_viejo: Decimal = Field(alias="precioViejo")
    precio_nuevo: Decimal = Field(alias="precioNuevo")


class ValidarCarritoResponse(BaseSchema):
    valido: bool
    errores: list[ErrorValidacion] = Field(default_factory=list)
    precios_actualizados: list[PrecioActualizado] = Field(
        default_factory=list,
        alias="preciosActualizados",
    )


class ItemPedidoRequest(BaseSchema):
    producto_id: int = Field(alias="productoId", gt=0)
    cantidad: int = Field(gt=0)
    personalizacion: list[int] = Field(default_factory=list)


class CrearPedidoRequest(BaseSchema):
    items: list[ItemPedidoRequest] = Field(min_length=1)
    forma_pago_codigo: str = Field(alias="formaPagoCodigo", min_length=1, max_length=20)
    direccion_id: int | None = Field(default=None, alias="direccionId", gt=0)
    notas: str | None = Field(default=None, max_length=500)

    @field_validator("forma_pago_codigo")
    @classmethod
    def normalize_forma_pago(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("notas")
    @classmethod
    def normalize_notas(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class AvanzarEstadoRequest(BaseSchema):
    nuevo_estado: str = Field(alias="nuevoEstado", min_length=1, max_length=20)
    motivo: str | None = Field(default=None, max_length=500)

    @field_validator("nuevo_estado")
    @classmethod
    def normalize_nuevo_estado(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("motivo")
    @classmethod
    def normalize_motivo(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class CancelarPedidoRequest(BaseSchema):
    motivo: str = Field(min_length=1, max_length=500)

    @field_validator("motivo")
    @classmethod
    def normalize_motivo(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El motivo es obligatorio para cancelar.")
        return value


class ConfirmarPagoOfflineRequest(BaseSchema):
    motivo: str | None = Field(default=None, max_length=500)

    @field_validator("motivo")
    @classmethod
    def normalize_motivo(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class PedidoRead(BaseSchema):
    id: int
    estado_codigo: str = Field(alias="estadoCodigo")
    total: Decimal
    costo_envio: Decimal = Field(alias="costoEnvio")
    created_at: datetime = Field(alias="createdAt")


class PedidoListItemRead(PedidoRead):
    cantidad_items: int = Field(alias="cantidadItems", ge=0)


class PedidoListResponse(BaseSchema):
    items: list[PedidoListItemRead]
    total: int
    page: int
    size: int
    pages: int


class PedidoAdminListItemRead(PedidoListItemRead):
    cliente_nombre: str = Field(alias="clienteNombre")
    cliente_email: str = Field(alias="clienteEmail")


class PedidoAdminListResponse(BaseSchema):
    items: list[PedidoAdminListItemRead]
    total: int
    page: int
    size: int
    pages: int


class PedidoDetalleItemRead(BaseSchema):
    producto_id: int | None = Field(alias="productoId")
    nombre_snapshot: str = Field(alias="nombreSnapshot")
    precio_snapshot: Decimal = Field(alias="precioSnapshot")
    cantidad: int
    personalizacion: list[int] = Field(default_factory=list)


class DireccionSnapshotRead(BaseSchema):
    id: int | None = None
    alias: str | None = None
    linea1: str
    linea2: str | None = None
    ciudad: str
    provincia: str
    codigo_postal: str | None = Field(default=None, alias="codigoPostal")
    notas: str | None = None


class PedidoPagoResumenRead(BaseSchema):
    mp_payment_id: int | None = Field(default=None, alias="mpPaymentId")
    mp_status: str | None = Field(default=None, alias="mpStatus")
    status_detail: str | None = Field(default=None, alias="statusDetail")
    updated_at: datetime | None = Field(default=None, alias="updatedAt")


class HistorialEstadoRead(BaseSchema):
    id: int
    pedido_id: int = Field(alias="pedidoId")
    estado_desde: str | None = Field(alias="estadoDesde")
    estado_hasta: str = Field(alias="estadoHasta")
    cambiado_por_id: int | None = Field(alias="cambiadoPorId")
    motivo: str | None = None
    created_at: datetime = Field(alias="createdAt")


class PedidoDetailRead(PedidoRead):
    forma_pago_codigo: str = Field(alias="formaPagoCodigo")
    direccion_snapshot: DireccionSnapshotRead | None = Field(
        default=None,
        alias="direccionSnapshot",
    )
    notas: str | None = None
    items: list[PedidoDetalleItemRead]
    historial: list[HistorialEstadoRead]
    pago: PedidoPagoResumenRead | None = None


class PedidoClienteRead(BaseSchema):
    id: int
    nombre: str
    apellido: str
    email: str


class PedidoAdminDetailRead(PedidoDetailRead):
    cliente: PedidoClienteRead
