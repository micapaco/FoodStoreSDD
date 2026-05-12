from dataclasses import dataclass
from decimal import Decimal

from app.core.exceptions import (
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationAppError,
)
from app.core.uow import UnitOfWork
from app.db.models.catalogo import Producto
from app.db.models.identidad import DireccionEntrega, Usuario
from app.db.models.ventas import DetallePedido, HistorialEstadoPedido, Pedido
from app.modules.pedidos.schemas import (
    CrearPedidoRequest,
    ErrorValidacion,
    ItemPedidoRequest,
    PedidoRead,
    PrecioActualizado,
    ValidarCarritoRequest,
    ValidarCarritoResponse,
)

ESTADO_PENDIENTE = "PENDIENTE"
COSTO_ENVIO_V1 = Decimal("50.00")


@dataclass(frozen=True)
class PreparedPedidoItem:
    producto_id: int
    cantidad: int
    nombre_snapshot: str
    precio_snapshot: Decimal
    personalizacion: list[int] | None


class PedidosService:
    """Casos de uso de pedidos."""

    async def validar_carrito(
        self, uow: UnitOfWork, request: ValidarCarritoRequest
    ) -> ValidarCarritoResponse:
        """Valida stock, disponibilidad y precios vigentes del carrito."""
        errores: list[ErrorValidacion] = []
        precios_actualizados: list[PrecioActualizado] = []

        for item in request.items:
            producto = await uow.productos.get_by_id(item.producto_id)

            if (
                producto is None
                or not producto.disponible
                or producto.deleted_at is not None
            ):
                errores.append(
                    ErrorValidacion(
                        producto_id=item.producto_id,
                        tipo="NO_DISPONIBLE",
                        mensaje="El producto no esta disponible.",
                    )
                )
                continue

            if producto.stock_cantidad < item.cantidad:
                errores.append(
                    ErrorValidacion(
                        producto_id=item.producto_id,
                        tipo="STOCK_INSUFICIENTE",
                        mensaje=f"Stock insuficiente. Disponible: {producto.stock_cantidad}",
                    )
                )

            precio_actual = Decimal(producto.precio_base)
            if precio_actual != item.precio_esperado:
                precios_actualizados.append(
                    PrecioActualizado(
                        producto_id=item.producto_id,
                        precio_viejo=item.precio_esperado,
                        precio_nuevo=precio_actual,
                    )
                )

        return ValidarCarritoResponse(
            valido=len(errores) == 0 and len(precios_actualizados) == 0,
            errores=errores,
            precios_actualizados=precios_actualizados,
        )

    async def crear_pedido(
        self,
        uow: UnitOfWork,
        request: CrearPedidoRequest,
        current_user: Usuario,
    ) -> PedidoRead:
        """Crea un pedido completo dentro del UoW abierto por el router."""
        usuario_id = self._require_usuario_id(current_user)
        await self._validar_forma_pago(uow, request.forma_pago_codigo)
        direccion_snapshot = await self._build_direccion_snapshot(
            uow,
            usuario_id=usuario_id,
            direccion_id=request.direccion_id,
        )
        prepared_items = await self._prepare_items(uow, request.items)

        subtotal = sum(
            (item.precio_snapshot * item.cantidad for item in prepared_items),
            Decimal("0.00"),
        )
        pedido = await self._create_pedido(
            uow,
            request=request,
            usuario_id=usuario_id,
            direccion_snapshot=direccion_snapshot,
            total=subtotal + COSTO_ENVIO_V1,
        )
        await self._create_detalles(uow, pedido_id=pedido.id, items=prepared_items)
        await self._create_historial(uow, pedido_id=pedido.id, usuario_id=usuario_id)

        return PedidoRead(
            id=pedido.id,
            estado_codigo=pedido.estado_codigo,
            total=pedido.total,
            costo_envio=pedido.costo_envio,
            created_at=pedido.created_at,
        )

    @staticmethod
    def _require_usuario_id(current_user: Usuario) -> int:
        if current_user.id is None:
            raise UnauthorizedError("Usuario invalido.")
        return current_user.id

    @staticmethod
    async def _validar_forma_pago(uow: UnitOfWork, codigo: str) -> None:
        forma_pago = await uow.pedidos.get_forma_pago_habilitada(codigo)
        if forma_pago is None:
            raise ValidationAppError("La forma de pago no esta habilitada.")

    @staticmethod
    async def _build_direccion_snapshot(
        uow: UnitOfWork,
        *,
        usuario_id: int,
        direccion_id: int | None,
    ) -> dict | None:
        if direccion_id is None:
            return None

        direccion = await uow.direcciones.get_by_id(direccion_id)
        if direccion is None or direccion.deleted_at is not None:
            raise NotFoundError("Direccion no encontrada.")
        if direccion.usuario_id != usuario_id:
            raise ForbiddenError("La direccion no pertenece al usuario autenticado.")
        return PedidosService._serialize_direccion(direccion)

    @staticmethod
    def _serialize_direccion(direccion: DireccionEntrega) -> dict:
        return {
            "id": direccion.id,
            "alias": direccion.alias,
            "linea1": direccion.linea1,
            "linea2": direccion.linea2,
            "ciudad": direccion.ciudad,
            "provincia": direccion.provincia,
            "codigo_postal": direccion.codigo_postal,
            "notas": direccion.notas,
        }

    async def _prepare_items(
        self,
        uow: UnitOfWork,
        items: list[ItemPedidoRequest],
    ) -> list[PreparedPedidoItem]:
        product_ids = list({item.producto_id for item in items})
        productos = await uow.pedidos.get_productos_for_update(product_ids)
        productos_by_id = {producto.id: producto for producto in productos}

        self._validar_productos_y_stock(productos_by_id, items)
        removable = await uow.pedidos.get_removable_ingredientes(product_ids)
        return [
            self._prepare_item(productos_by_id[item.producto_id], item, removable)
            for item in items
        ]

    @staticmethod
    def _validar_productos_y_stock(
        productos_by_id: dict[int, Producto],
        items: list[ItemPedidoRequest],
    ) -> None:
        cantidades: dict[int, int] = {}
        for item in items:
            cantidades[item.producto_id] = cantidades.get(item.producto_id, 0) + item.cantidad

        for producto_id, cantidad in cantidades.items():
            producto = productos_by_id.get(producto_id)
            if producto is None or producto.deleted_at is not None or not producto.disponible:
                raise ValidationAppError(f"El producto {producto_id} no esta disponible.")
            if producto.stock_cantidad < cantidad:
                raise ValidationAppError(
                    f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock_cantidad}."
                )

    @staticmethod
    def _prepare_item(
        producto: Producto,
        item: ItemPedidoRequest,
        removable: dict[int, set[int]],
    ) -> PreparedPedidoItem:
        producto_id = int(producto.id)
        personalizacion = sorted(set(item.personalizacion))
        invalid = set(personalizacion) - removable.get(producto_id, set())
        if invalid:
            raise ValidationAppError(
                f"Personalizacion invalida para el producto {producto.nombre}."
            )
        return PreparedPedidoItem(
            producto_id=producto_id,
            cantidad=item.cantidad,
            nombre_snapshot=producto.nombre,
            precio_snapshot=Decimal(producto.precio_base),
            personalizacion=personalizacion or None,
        )

    @staticmethod
    async def _create_pedido(
        uow: UnitOfWork,
        *,
        request: CrearPedidoRequest,
        usuario_id: int,
        direccion_snapshot: dict | None,
        total: Decimal,
    ) -> Pedido:
        pedido = Pedido(
            usuario_id=usuario_id,
            estado_codigo=ESTADO_PENDIENTE,
            forma_pago_codigo=request.forma_pago_codigo,
            direccion_id=request.direccion_id,
            direccion_snapshot=direccion_snapshot,
            notas=request.notas,
            total=total,
            costo_envio=COSTO_ENVIO_V1,
        )
        return await uow.pedidos.create(pedido)

    @staticmethod
    async def _create_detalles(
        uow: UnitOfWork,
        *,
        pedido_id: int | None,
        items: list[PreparedPedidoItem],
    ) -> None:
        if pedido_id is None:
            raise ValidationAppError("No se pudo crear el pedido.")
        detalles = [
            DetallePedido(
                pedido_id=pedido_id,
                producto_id=item.producto_id,
                cantidad=item.cantidad,
                nombre_snapshot=item.nombre_snapshot,
                precio_snapshot=item.precio_snapshot,
                personalizacion=item.personalizacion,
            )
            for item in items
        ]
        await uow.pedidos.create_detalles(detalles)

    @staticmethod
    async def _create_historial(
        uow: UnitOfWork,
        *,
        pedido_id: int | None,
        usuario_id: int,
    ) -> None:
        if pedido_id is None:
            raise ValidationAppError("No se pudo registrar el historial del pedido.")
        historial = HistorialEstadoPedido(
            pedido_id=pedido_id,
            estado_desde=None,
            estado_hasta=ESTADO_PENDIENTE,
            cambiado_por_id=usuario_id,
        )
        await uow.pedidos.create_historial(historial)
