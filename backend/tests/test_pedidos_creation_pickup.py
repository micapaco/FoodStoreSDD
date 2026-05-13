from decimal import Decimal
from unittest import IsolatedAsyncioTestCase

from app.db.models.catalogo import Producto
from app.db.models.identidad import Usuario
from app.db.models.ventas import DetallePedido, HistorialEstadoPedido, Pedido
from app.modules.pedidos.schemas import CrearPedidoRequest
from app.modules.pedidos.service import PedidosService


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
                precio_base=Decimal("100.00"),
                stock_cantidad=5,
                disponible=True,
            )
        ]

    async def get_forma_pago_habilitada(self, codigo: str) -> FakeFormaPago | None:
        return FakeFormaPago(codigo) if codigo == "EFECTIVO" else None

    async def get_productos_for_update(self, producto_ids: list[int]) -> list[Producto]:
        return [producto for producto in self.productos if producto.id in producto_ids]

    async def get_removable_ingredientes(self, _producto_ids: list[int]) -> dict[int, set[int]]:
        return {}

    async def create(self, pedido: Pedido) -> Pedido:
        pedido.id = 1
        self.pedido = pedido
        return pedido

    async def create_detalles(self, detalles: list[DetallePedido]) -> None:
        self.detalles = detalles

    async def create_historial(self, historial: HistorialEstadoPedido) -> HistorialEstadoPedido:
        historial.id = len(self.historial) + 1
        self.historial.append(historial)
        return historial


class FakeUnitOfWork:
    def __init__(self) -> None:
        self.pedidos = FakePedidoRepository()


class PedidosPickupCreationTests(IsolatedAsyncioTestCase):
    async def test_retiro_local_persiste_envio_cero_y_total_subtotal(self) -> None:
        uow = FakeUnitOfWork()
        request = CrearPedidoRequest.model_validate(
            {
                "items": [{"productoId": 100, "cantidad": 2, "personalizacion": []}],
                "formaPagoCodigo": "EFECTIVO",
                "direccionId": None,
                "notas": None,
            }
        )
        current_user = Usuario(
            id=10,
            nombre="Cliente",
            apellido="Food",
            email="cliente@example.com",
            password_hash="x" * 60,
        )

        result = await PedidosService().crear_pedido(uow, request, current_user)

        self.assertEqual(Decimal("0.00"), result.costo_envio)
        self.assertEqual(Decimal("200.00"), result.total)
        self.assertIsNotNone(uow.pedidos.pedido)
        self.assertEqual(Decimal("0.00"), uow.pedidos.pedido.costo_envio)
        self.assertEqual(Decimal("200.00"), uow.pedidos.pedido.total)
