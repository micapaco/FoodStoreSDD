from decimal import Decimal
from unittest import IsolatedAsyncioTestCase

from app.core.exceptions import ConflictError, ForbiddenError, ValidationAppError
from app.db.models.catalogo import Producto
from app.db.models.identidad import Usuario
from app.db.models.ventas import DetallePedido, HistorialEstadoPedido, Pedido
from app.modules.pedidos.schemas import AvanzarEstadoRequest, CancelarPedidoRequest
from app.modules.pedidos.service import (
    ESTADO_CANCELADO,
    ESTADO_CONFIRMADO,
    ESTADO_EN_CAMINO,
    ESTADO_EN_PREP,
    ESTADO_ENTREGADO,
    ESTADO_PENDIENTE,
    PedidosService,
)


class FakePedidoRepository:
    def __init__(
        self,
        pedido: Pedido,
        detalles: list[DetallePedido],
        productos: list[Producto],
    ) -> None:
        self.pedido = pedido
        self.detalles = detalles
        self.productos = {producto.id: producto for producto in productos}
        self.historial: list[HistorialEstadoPedido] = []

    async def get_by_id(self, pedido_id: int) -> Pedido | None:
        return self.pedido if self.pedido.id == pedido_id else None

    async def update(self, pedido: Pedido) -> Pedido:
        self.pedido = pedido
        return pedido

    async def create_historial(self, historial: HistorialEstadoPedido) -> None:
        historial.id = len(self.historial) + 1
        self.historial.append(historial)

    async def get_detalles_by_pedido_id(self, pedido_id: int) -> list[DetallePedido]:
        return [detalle for detalle in self.detalles if detalle.pedido_id == pedido_id]

    async def get_productos_for_update(self, producto_ids: list[int]) -> list[Producto]:
        return [self.productos[producto_id] for producto_id in producto_ids]

    async def save_productos(self, productos: list[Producto]) -> None:
        for producto in productos:
            self.productos[producto.id] = producto


class FakeUsuarioRepository:
    def __init__(self, roles: list[str]) -> None:
        self.roles = roles

    async def get_with_roles(self, user_id: int) -> tuple[Usuario, list[str]]:
        usuario = Usuario(
            id=user_id,
            nombre="Test",
            apellido="User",
            email="test@example.com",
            password_hash="x" * 60,
        )
        return usuario, self.roles


class FakeUnitOfWork:
    def __init__(
        self,
        pedido: Pedido,
        detalles: list[DetallePedido],
        productos: list[Producto],
        roles: list[str],
    ) -> None:
        self.pedidos = FakePedidoRepository(pedido, detalles, productos)
        self.usuarios = FakeUsuarioRepository(roles)


def build_pedido(estado_codigo: str) -> Pedido:
    return Pedido(
        id=1,
        usuario_id=10,
        estado_codigo=estado_codigo,
        forma_pago_codigo="MERCADOPAGO",
        total=Decimal("250.00"),
        costo_envio=Decimal("50.00"),
    )


def build_producto(stock_cantidad: int) -> Producto:
    return Producto(
        id=100,
        nombre="Hamburguesa",
        precio_base=Decimal("100.00"),
        stock_cantidad=stock_cantidad,
        disponible=True,
    )


def build_detalle() -> DetallePedido:
    return DetallePedido(
        id=1,
        pedido_id=1,
        producto_id=100,
        cantidad=2,
        nombre_snapshot="Hamburguesa",
        precio_snapshot=Decimal("100.00"),
    )


class PedidosFsmTests(IsolatedAsyncioTestCase):
    async def test_confirmar_por_pago_descuenta_stock_una_sola_vez(self) -> None:
        pedido = build_pedido(ESTADO_PENDIENTE)
        producto = build_producto(stock_cantidad=5)
        uow = FakeUnitOfWork(pedido, [build_detalle()], [producto], roles=[])

        await PedidosService().confirmar_por_pago(uow, pedido_id=1)
        await PedidosService().confirmar_por_pago(uow, pedido_id=1)

        self.assertEqual(ESTADO_CONFIRMADO, pedido.estado_codigo)
        self.assertIsNone(pedido.updated_at.tzinfo)
        self.assertEqual(3, producto.stock_cantidad)
        self.assertEqual(1, len(uow.pedidos.historial))
        self.assertIsNone(uow.pedidos.historial[0].cambiado_por_id)

    async def test_cancelar_confirmado_restaura_stock_y_persiste_motivo(self) -> None:
        pedido = build_pedido(ESTADO_CONFIRMADO)
        producto = build_producto(stock_cantidad=3)
        uow = FakeUnitOfWork(pedido, [build_detalle()], [producto], roles=["ADMIN"])
        request = CancelarPedidoRequest(motivo="Cliente no disponible")
        current_user = Usuario(
            id=99,
            nombre="Admin",
            apellido="Food",
            email="admin@example.com",
            password_hash="x" * 60,
        )

        result = await PedidosService().cancelar_pedido(uow, 1, request, current_user)

        self.assertEqual(ESTADO_CANCELADO, result.estado_codigo)
        self.assertEqual(5, producto.stock_cantidad)
        self.assertEqual("Cliente no disponible", uow.pedidos.historial[0].motivo)

    async def test_rechaza_salto_manual_desde_pendiente(self) -> None:
        pedido = build_pedido(ESTADO_PENDIENTE)
        producto = build_producto(stock_cantidad=5)
        uow = FakeUnitOfWork(pedido, [build_detalle()], [producto], roles=["PEDIDOS"])
        request = AvanzarEstadoRequest(nuevoEstado=ESTADO_EN_CAMINO)
        current_user = Usuario(
            id=20,
            nombre="Ops",
            apellido="Food",
            email="ops@example.com",
            password_hash="x" * 60,
        )

        with self.assertRaises(ConflictError):
            await PedidosService().avanzar_estado(uow, 1, request, current_user)

        self.assertEqual(ESTADO_PENDIENTE, pedido.estado_codigo)
        self.assertEqual([], uow.pedidos.historial)

    async def test_rechaza_cancelacion_manual_sin_motivo(self) -> None:
        pedido = build_pedido(ESTADO_CONFIRMADO)
        producto = build_producto(stock_cantidad=5)
        uow = FakeUnitOfWork(pedido, [build_detalle()], [producto], roles=["PEDIDOS"])
        request = AvanzarEstadoRequest(nuevoEstado=ESTADO_CANCELADO)
        current_user = Usuario(
            id=20,
            nombre="Ops",
            apellido="Food",
            email="ops@example.com",
            password_hash="x" * 60,
        )

        with self.assertRaises(ValidationAppError):
            await PedidosService().avanzar_estado(uow, 1, request, current_user)

        self.assertEqual(ESTADO_CONFIRMADO, pedido.estado_codigo)
        self.assertEqual(5, producto.stock_cantidad)

    async def test_rechaza_transicion_desde_estado_terminal(self) -> None:
        pedido = build_pedido(ESTADO_ENTREGADO)
        producto = build_producto(stock_cantidad=5)
        uow = FakeUnitOfWork(pedido, [build_detalle()], [producto], roles=["PEDIDOS"])
        request = AvanzarEstadoRequest(nuevoEstado=ESTADO_EN_PREP)
        current_user = Usuario(
            id=20,
            nombre="Ops",
            apellido="Food",
            email="ops@example.com",
            password_hash="x" * 60,
        )

        with self.assertRaises(ConflictError):
            await PedidosService().avanzar_estado(uow, 1, request, current_user)

    async def test_cliente_propietario_cancela_pendiente(self) -> None:
        pedido = build_pedido(ESTADO_PENDIENTE)
        producto = build_producto(stock_cantidad=5)
        uow = FakeUnitOfWork(pedido, [build_detalle()], [producto], roles=["CLIENT"])
        request = CancelarPedidoRequest(motivo="Me equivoque de direccion")
        current_user = Usuario(
            id=10,
            nombre="Cliente",
            apellido="Food",
            email="client@example.com",
            password_hash="x" * 60,
        )

        result = await PedidosService().cancelar_pedido(uow, 1, request, current_user)

        self.assertEqual(ESTADO_CANCELADO, result.estado_codigo)
        self.assertEqual(5, producto.stock_cantidad)

    async def test_cliente_no_ve_historial_ajeno(self) -> None:
        pedido = build_pedido(ESTADO_PENDIENTE)
        producto = build_producto(stock_cantidad=5)
        uow = FakeUnitOfWork(pedido, [build_detalle()], [producto], roles=["CLIENT"])
        current_user = Usuario(
            id=99,
            nombre="Cliente",
            apellido="Ajeno",
            email="other@example.com",
            password_hash="x" * 60,
        )

        with self.assertRaises(ForbiddenError):
            await PedidosService().obtener_historial(uow, 1, current_user)
