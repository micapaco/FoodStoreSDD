from decimal import Decimal
from unittest import IsolatedAsyncioTestCase

from app.core.exceptions import ConflictError, ForbiddenError
from app.db.models.identidad import Usuario
from app.db.models.ventas import DetallePedido, HistorialEstadoPedido, Pago, Pedido
from app.modules.pedidos.service import PedidosService


def build_usuario(
    user_id: int,
    *,
    nombre: str = "Cliente",
    apellido: str = "Food",
    email: str = "cliente@example.com",
) -> Usuario:
    return Usuario(
        id=user_id,
        nombre=nombre,
        apellido=apellido,
        email=email,
        password_hash="x" * 60,
    )


def build_pedido(
    user_id: int = 10,
    *,
    estado_codigo: str = "CONFIRMADO",
    forma_pago_codigo: str = "MERCADOPAGO",
) -> Pedido:
    return Pedido(
        id=1,
        usuario_id=user_id,
        estado_codigo=estado_codigo,
        forma_pago_codigo=forma_pago_codigo,
        direccion_snapshot={
            "id": 3,
            "alias": "Casa",
            "linea1": "Av. Siempre Viva 742",
            "linea2": "Piso 1",
            "ciudad": "Rosario",
            "provincia": "Santa Fe",
            "codigo_postal": "2000",
            "notas": "Porton negro",
        },
        total=Decimal("250.00"),
        costo_envio=Decimal("50.00"),
    )


class FakePedidoRepository:
    def __init__(self, pedido: Pedido, usuario: Usuario) -> None:
        self.pedido = pedido
        self.usuario = usuario
        self.updated_pedidos: list[Pedido] = []
        self.historial_creado: list[HistorialEstadoPedido] = []
        self.saved_productos = []

    async def get_by_id(self, pedido_id: int) -> Pedido | None:
        return self.pedido if pedido_id == self.pedido.id else None

    async def list_by_usuario_paginated(
        self,
        usuario_id: int,
        *,
        page: int,
        size: int,
        estado: str | None,
    ):
        if usuario_id != self.pedido.usuario_id:
            return [], 0
        if estado and estado != self.pedido.estado_codigo:
            return [], 0
        return [(self.pedido, 2)], 1

    async def list_admin_paginated(self, **_: object):
        return [(self.pedido, self.usuario, 2)], 1

    async def get_admin_pedido_with_usuario(
        self,
        pedido_id: int,
    ) -> tuple[Pedido, Usuario] | None:
        if pedido_id != self.pedido.id:
            return None
        return self.pedido, self.usuario

    async def get_detalles_by_pedido_id(self, pedido_id: int) -> list[DetallePedido]:
        if pedido_id != self.pedido.id:
            return []
        return [
            DetallePedido(
                id=1,
                pedido_id=pedido_id,
                producto_id=100,
                cantidad=2,
                nombre_snapshot="Hamburguesa",
                precio_snapshot=Decimal("100.00"),
                personalizacion=[7],
                personalizacion_snapshot=[{"ingredienteId": 7, "nombre": "Queso"}],
            )
        ]

    async def get_ingrediente_names(self, ingrediente_ids: list[int]) -> dict[int, str]:
        return {ingrediente_id: f"Ingrediente {ingrediente_id}" for ingrediente_id in ingrediente_ids}

    async def list_historial_by_pedido_id(
        self,
        pedido_id: int,
    ) -> list[HistorialEstadoPedido]:
        if pedido_id != self.pedido.id:
            return []
        return [
            HistorialEstadoPedido(
                id=1,
                pedido_id=pedido_id,
                estado_desde="PENDIENTE",
                estado_hasta="CONFIRMADO",
                cambiado_por_id=None,
            )
        ]

    async def get_productos_for_update(self, producto_ids: list[int]):
        from app.db.models.catalogo import Producto

        return [
            Producto(
                id=producto_ids[0],
                nombre="Hamburguesa",
                precio_base=Decimal("100.00"),
                stock_cantidad=5,
                disponible=True,
            )
        ]

    async def save_productos(self, productos) -> None:
        self.saved_productos = productos

    async def update(self, pedido: Pedido) -> Pedido:
        self.updated_pedidos.append(pedido)
        return pedido

    async def create_historial(self, historial: HistorialEstadoPedido) -> HistorialEstadoPedido:
        historial.id = len(self.historial_creado) + 10
        self.historial_creado.append(historial)
        return historial


class FakePagoRepository:
    async def list_by_pedido_id(self, pedido_id: int) -> list[Pago]:
        return [
            Pago(
                id=1,
                pedido_id=pedido_id,
                mp_payment_id=999,
                mp_status="approved",
                status_detail="accredited",
                external_reference="pedido-1",
                idempotency_key="idem-1",
            )
        ]


class FakeUsuarioRepository:
    def __init__(self, usuario: Usuario, roles: list[str]) -> None:
        self.usuario = usuario
        self.roles = roles

    async def get_with_roles(self, user_id: int) -> tuple[Usuario, list[str]] | None:
        if user_id != self.usuario.id:
            return None
        return self.usuario, self.roles


class FakeUnitOfWork:
    def __init__(self, pedido: Pedido, usuario: Usuario, roles: list[str]) -> None:
        self.pedidos = FakePedidoRepository(pedido, usuario)
        self.pagos = FakePagoRepository()
        self.usuarios = FakeUsuarioRepository(usuario, roles)


class PedidosViewsTests(IsolatedAsyncioTestCase):
    async def test_lista_pedidos_propios_con_paginacion(self) -> None:
        usuario = build_usuario(10)
        uow = FakeUnitOfWork(build_pedido(), usuario, roles=["CLIENT"])

        result = await PedidosService().listar_propios(
            uow,
            current_user=usuario,
            page=1,
            size=10,
            estado="CONFIRMADO",
        )

        self.assertEqual(1, result.total)
        self.assertEqual(1, result.pages)
        self.assertEqual(2, result.items[0].cantidad_items)

    async def test_cliente_no_accede_detalle_ajeno(self) -> None:
        owner = build_usuario(10)
        visitante = build_usuario(99, email="otro@example.com")
        uow = FakeUnitOfWork(build_pedido(), owner, roles=["CLIENT"])

        with self.assertRaises(ForbiddenError):
            await PedidosService().obtener_detalle_propio(
                uow,
                pedido_id=1,
                current_user=visitante,
            )

    async def test_detalle_operativo_incluye_cliente_pago_e_historial(self) -> None:
        operador = build_usuario(20, nombre="Ops", email="ops@example.com")
        cliente = build_usuario(10)
        uow = FakeUnitOfWork(build_pedido(), cliente, roles=["PEDIDOS"])
        uow.usuarios = FakeUsuarioRepository(operador, ["PEDIDOS"])

        result = await PedidosService().obtener_detalle_operativo(
            uow,
            pedido_id=1,
            current_user=operador,
        )

        self.assertEqual("cliente@example.com", result.cliente.email)
        self.assertEqual("approved", result.pago.mp_status)
        self.assertEqual("CONFIRMADO", result.historial[0].estado_hasta)

    async def test_operador_sin_rol_no_lista_pedidos(self) -> None:
        usuario = build_usuario(10)
        uow = FakeUnitOfWork(build_pedido(), usuario, roles=["CLIENT"])

        with self.assertRaises(ForbiddenError):
            await PedidosService().listar_operativos(
                uow,
                current_user=usuario,
                page=1,
                size=20,
                estado=None,
                desde=None,
                hasta=None,
                q=None,
            )

    async def test_lista_operativa_incluye_forma_pago(self) -> None:
        operador = build_usuario(20, nombre="Ops", email="ops@example.com")
        cliente = build_usuario(10)
        uow = FakeUnitOfWork(
            build_pedido(forma_pago_codigo="TRANSFERENCIA"),
            cliente,
            roles=["PEDIDOS"],
        )
        uow.usuarios = FakeUsuarioRepository(operador, ["PEDIDOS"])

        result = await PedidosService().listar_operativos(
            uow,
            current_user=operador,
            page=1,
            size=20,
            estado=None,
            desde=None,
            hasta=None,
            q=None,
        )

        self.assertEqual("TRANSFERENCIA", result.items[0].forma_pago_codigo)

    async def test_operador_confirma_pago_offline_pendiente(self) -> None:
        operador = build_usuario(20, nombre="Ops", email="ops@example.com")
        cliente = build_usuario(10)
        pedido = build_pedido(estado_codigo="PENDIENTE", forma_pago_codigo="TRANSFERENCIA")
        uow = FakeUnitOfWork(pedido, cliente, roles=["PEDIDOS"])
        uow.usuarios = FakeUsuarioRepository(operador, ["PEDIDOS"])

        result = await PedidosService().confirmar_pago_offline(
            uow,
            pedido_id=1,
            request=type("Req", (), {"motivo": "Comprobante validado"})(),
            current_user=operador,
        )

        self.assertEqual("CONFIRMADO", result.estado_codigo)
        self.assertEqual("CONFIRMADO", uow.pedidos.updated_pedidos[0].estado_codigo)
        self.assertEqual("CONFIRMADO", uow.pedidos.historial_creado[0].estado_hasta)
        self.assertEqual(3, uow.pedidos.saved_productos[0].stock_cantidad)

    async def test_no_confirma_offline_mercadopago(self) -> None:
        operador = build_usuario(20, nombre="Ops", email="ops@example.com")
        cliente = build_usuario(10)
        pedido = build_pedido(estado_codigo="PENDIENTE", forma_pago_codigo="MERCADOPAGO")
        uow = FakeUnitOfWork(pedido, cliente, roles=["PEDIDOS"])
        uow.usuarios = FakeUsuarioRepository(operador, ["PEDIDOS"])

        with self.assertRaises(ConflictError):
            await PedidosService().confirmar_pago_offline(
                uow,
                pedido_id=1,
                request=type("Req", (), {"motivo": None})(),
                current_user=operador,
            )
