from decimal import Decimal
from unittest import IsolatedAsyncioTestCase

from app.db.models.catalogo import Producto
from app.db.models.identidad import Usuario
from app.db.models.ventas import DetallePedido, HistorialEstadoPedido, Pago, Pedido
from app.modules.pagos.mercadopago_client import MercadoPagoPaymentResult
from app.modules.pagos.schemas import CrearPedidoMercadoPagoRequest
from app.modules.pagos.service import PagosService


class FakeGateway:
    def __init__(self, status: str, status_detail: str | None = None) -> None:
        self.status = status
        self.status_detail = status_detail

    def create_card_payment(self, *_args, **_kwargs) -> MercadoPagoPaymentResult:
        return MercadoPagoPaymentResult(
            mp_payment_id=123,
            mp_order_id="mp-order-1",
            mp_status=self.status,
            status_detail=self.status_detail,
            transaction_amount=Decimal("200.00"),
            external_reference=None,
            raw_payload={"status": self.status},
        )


class FakeFormaPago:
    def __init__(self, codigo: str) -> None:
        self.codigo = codigo


class FakePedidoRepository:
    def __init__(self) -> None:
        self.pedido: Pedido | None = None
        self.detalles: list[DetallePedido] = []
        self.historial: list[HistorialEstadoPedido] = []
        self.productos = [
            Producto(
                id=100,
                nombre="Hamburguesa",
                precio_base=Decimal("200.00"),
                stock_cantidad=5,
                disponible=True,
            )
        ]

    async def get_forma_pago_habilitada(self, codigo: str) -> FakeFormaPago | None:
        return FakeFormaPago(codigo) if codigo == "MERCADOPAGO" else None

    async def get_productos_for_update(self, producto_ids: list[int]) -> list[Producto]:
        return [producto for producto in self.productos if producto.id in producto_ids]

    async def get_removable_ingredientes_detail(self, _producto_ids: list[int]) -> dict[int, dict[int, str]]:
        return {}

    async def create(self, pedido: Pedido) -> Pedido:
        pedido.id = 1
        self.pedido = pedido
        return pedido

    async def create_detalles(self, detalles: list[DetallePedido]) -> None:
        for index, detalle in enumerate(detalles, start=1):
            detalle.id = index
            detalle.pedido_id = 1
        self.detalles = detalles

    async def create_historial(self, historial: HistorialEstadoPedido) -> HistorialEstadoPedido:
        historial.id = len(self.historial) + 1
        self.historial.append(historial)
        return historial

    async def get_by_id(self, pedido_id: int) -> Pedido | None:
        return self.pedido if self.pedido and self.pedido.id == pedido_id else None

    async def update(self, pedido: Pedido) -> Pedido:
        self.pedido = pedido
        return pedido

    async def get_detalles_by_pedido_id(self, pedido_id: int) -> list[DetallePedido]:
        return [detalle for detalle in self.detalles if detalle.pedido_id == pedido_id]

    async def save_productos(self, productos: list[Producto]) -> None:
        self.productos = productos


class FakePagoRepository:
    def __init__(self) -> None:
        self.pagos: list[Pago] = []

    async def list_by_pedido_id(self, pedido_id: int) -> list[Pago]:
        return [pago for pago in self.pagos if pago.pedido_id == pedido_id]

    async def create(self, pago: Pago) -> Pago:
        pago.id = len(self.pagos) + 1
        self.pagos.append(pago)
        return pago


class FakeUsuarioRepository:
    async def get_with_roles(self, user_id: int) -> tuple[Usuario, list[str]]:
        return build_user(user_id), ["CLIENT"]


class FakeUnitOfWork:
    def __init__(self) -> None:
        self.pedidos = FakePedidoRepository()
        self.pagos = FakePagoRepository()
        self.usuarios = FakeUsuarioRepository()


def build_user(user_id: int = 10) -> Usuario:
    return Usuario(
        id=user_id,
        nombre="Cliente",
        apellido="Food",
        email="cliente@example.com",
        password_hash="x" * 60,
    )


def build_request() -> CrearPedidoMercadoPagoRequest:
    return CrearPedidoMercadoPagoRequest.model_validate(
        {
            "pedido": {
                "items": [{"productoId": 100, "cantidad": 1, "personalizacion": []}],
                "formaPagoCodigo": "MERCADOPAGO",
                "direccionId": None,
                "notas": None,
            },
            "cardToken": "card-token",
            "paymentMethodId": "visa",
            "issuerId": None,
            "installments": 1,
            "payerEmail": "cliente@example.com",
        }
    )


class PagosCheckoutTests(IsolatedAsyncioTestCase):
    async def test_checkout_mercadopago_aprobado_confirma_pedido(self) -> None:
        uow = FakeUnitOfWork()

        result = await PagosService().crear_pedido_con_pago(
            uow,
            build_request(),
            build_user(),
            FakeGateway("approved"),
        )

        self.assertEqual("CONFIRMADO", result.pedido.estado_codigo)
        self.assertEqual("approved", result.pago.mp_status)
        self.assertEqual(4, uow.pedidos.productos[0].stock_cantidad)

    async def test_checkout_mercadopago_rechazado_cancela_pedido(self) -> None:
        uow = FakeUnitOfWork()

        result = await PagosService().crear_pedido_con_pago(
            uow,
            build_request(),
            build_user(),
            FakeGateway("rejected", "cc_rejected_other_reason"),
        )

        self.assertEqual("CANCELADO", result.pedido.estado_codigo)
        self.assertEqual("rejected", result.pago.mp_status)
        self.assertEqual(5, uow.pedidos.productos[0].stock_cantidad)
        self.assertIn("MercadoPago rejected", uow.pedidos.historial[-1].motivo or "")
