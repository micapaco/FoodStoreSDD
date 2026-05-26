from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from math import ceil

from sqlalchemy import select

from app.core.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ServiceUnavailableError,
    UnauthorizedError,
    ValidationAppError,
)
from app.core.uow import UnitOfWork
from app.db.models.catalogo import Producto
from app.db.models.configuracion import Configuracion
from app.db.models.identidad import DireccionEntrega, Usuario
from app.db.models.ventas import DetallePedido, HistorialEstadoPedido, Pedido
from app.modules.pedidos.schemas import (
    AvanzarEstadoRequest,
    CancelarPedidoRequest,
    ConfirmarPagoOfflineRequest,
    CrearPedidoRequest,
    DireccionSnapshotRead,
    ErrorValidacion,
    HistorialEstadoRead,
    ItemPedidoRequest,
    PedidoAdminDetailRead,
    PedidoAdminListItemRead,
    PedidoAdminListResponse,
    PedidoClienteRead,
    PedidoDetalleItemRead,
    PedidoDetailRead,
    PedidoListItemRead,
    PedidoListResponse,
    PedidoPagoResumenRead,
    PedidoPersonalizacionDetalleRead,
    PedidoRead,
    PrecioActualizado,
    ValidarCarritoRequest,
    ValidarCarritoResponse,
)

ESTADO_PENDIENTE = "PENDIENTE"
ESTADO_CONFIRMADO = "CONFIRMADO"
ESTADO_EN_PREP = "EN_PREP"
ESTADO_EN_CAMINO = "EN_CAMINO"
ESTADO_ENTREGADO = "ENTREGADO"
ESTADO_CANCELADO = "CANCELADO"
COSTO_ENVIO_V1 = Decimal("50.00")
SISTEMA_USUARIO_ID = None
MANUAL_TRANSITIONS = {
    ESTADO_CONFIRMADO: {ESTADO_EN_PREP, ESTADO_CANCELADO},
    ESTADO_EN_PREP: {ESTADO_EN_CAMINO, ESTADO_CANCELADO},
    ESTADO_EN_CAMINO: {ESTADO_ENTREGADO},
}
PICKUP_EN_PREP_TRANSITIONS = {ESTADO_ENTREGADO, ESTADO_CANCELADO}
TERMINAL_STATES = {ESTADO_ENTREGADO, ESTADO_CANCELADO}
STOCK_DISCOUNTED_STATES = {ESTADO_CONFIRMADO, ESTADO_EN_PREP, ESTADO_EN_CAMINO}
OFFLINE_PAYMENT_CODES = {"EFECTIVO", "TRANSFERENCIA"}


def _utc_now_naive() -> datetime:
    """UTC sin tzinfo para columnas TIMESTAMP WITHOUT TIME ZONE."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


@dataclass(frozen=True)
class PreparedPedidoItem:
    producto_id: int
    cantidad: int
    nombre_snapshot: str
    precio_snapshot: Decimal
    personalizacion: list[int] | None
    personalizacion_snapshot: list[dict] | None
    notas: str | None = None


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
        # Verificar que el local está aceptando pedidos
        try:
            habilitados_result = await uow.session.execute(
                select(Configuracion).where(Configuracion.clave == "pedidos_habilitados")
            )
            habilitados_row = habilitados_result.scalar_one_or_none()
            if habilitados_row is not None and habilitados_row.valor.lower() == "false":
                raise ServiceUnavailableError(
                    "El local no está aceptando pedidos en este momento."
                )
        except ServiceUnavailableError:
            raise
        except Exception:
            pass  # Si no se puede leer la config, se permite continuar

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
        costo_envio = await self._resolve_costo_envio(uow, request.direccion_id)
        pedido = await self._create_pedido(
            uow,
            request=request,
            usuario_id=usuario_id,
            direccion_snapshot=direccion_snapshot,
            total=subtotal + costo_envio,
            costo_envio=costo_envio,
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

    async def confirmar_por_pago(self, uow: UnitOfWork, pedido_id: int) -> None:
        """Confirma automaticamente un pedido cuando pagos informa approved."""
        pedido = await self._get_active_pedido(uow, pedido_id)
        if pedido.estado_codigo == ESTADO_CONFIRMADO:
            return
        await self._confirmar_pedido_pendiente(
            uow,
            pedido=pedido,
            cambiado_por_id=SISTEMA_USUARIO_ID,
            motivo=None,
        )

    async def confirmar_pago_offline(
        self,
        uow: UnitOfWork,
        pedido_id: int,
        request: ConfirmarPagoOfflineRequest,
        current_user: Usuario,
    ) -> PedidoRead:
        """Confirma pagos offline pendientes por una accion operativa autorizada."""
        usuario_id = self._require_usuario_id(current_user)
        roles = await self._get_user_roles(uow, usuario_id)
        if not self._has_any_role(roles, {"ADMIN", "PEDIDOS"}):
            raise ForbiddenError("No tenes permiso para confirmar pagos offline.")

        pedido = await self._get_active_pedido(uow, pedido_id)
        self._validate_offline_confirmation(pedido)
        await self._confirmar_pedido_pendiente(
            uow,
            pedido=pedido,
            cambiado_por_id=usuario_id,
            motivo=request.motivo,
        )
        return self._to_read(pedido)

    async def avanzar_estado(
        self,
        uow: UnitOfWork,
        pedido_id: int,
        request: AvanzarEstadoRequest,
        current_user: Usuario,
    ) -> PedidoRead:
        """Avanza manualmente estados operativos de pedidos."""
        usuario_id = self._require_usuario_id(current_user)
        roles = await self._get_user_roles(uow, usuario_id)
        if not self._has_any_role(roles, {"ADMIN", "PEDIDOS", "COCINA"}):
            raise ForbiddenError("No tenes permiso para avanzar pedidos.")

        # El rol COCINA puede ejecutar CONFIRMADO→EN_PREP, EN_PREP→EN_CAMINO
        # y EN_PREP→ENTREGADO (pedidos de retiro en local, donde no hay fase EN_CAMINO).
        # El FSM valida la transición específica según el tipo de pedido.
        if self._has_any_role(roles, {"COCINA"}) and not self._has_any_role(roles, {"ADMIN", "PEDIDOS"}):
            allowed_cocina = {ESTADO_EN_PREP, ESTADO_EN_CAMINO, ESTADO_ENTREGADO}
            if request.nuevo_estado not in allowed_cocina:
                raise ForbiddenError("El rol COCINA solo puede avanzar a EN_PREP, EN_CAMINO o ENTREGADO.")

        pedido = await self._get_active_pedido(uow, pedido_id)
        self._validate_manual_transition(pedido, request.nuevo_estado)

        if request.nuevo_estado == ESTADO_CANCELADO:
            self._require_cancel_motivo(request.motivo)
            await self._restore_stock_if_needed(uow, pedido)

        await self._apply_estado(
            uow,
            pedido=pedido,
            nuevo_estado=request.nuevo_estado,
            cambiado_por_id=usuario_id,
            motivo=request.motivo,
        )
        return self._to_read(pedido)

    async def cancelar_pedido(
        self,
        uow: UnitOfWork,
        pedido_id: int,
        request: CancelarPedidoRequest,
        current_user: Usuario,
    ) -> PedidoRead:
        """Cancela un pedido validando ownership, rol y restauracion de stock."""
        usuario_id = self._require_usuario_id(current_user)
        pedido = await self._get_active_pedido(uow, pedido_id)
        roles = await self._get_user_roles(uow, usuario_id)

        self._validate_cancel_permission(pedido, usuario_id, roles)
        self._validate_cancel_state(pedido.estado_codigo)
        await self._restore_stock_if_needed(uow, pedido)
        await self._apply_estado(
            uow,
            pedido=pedido,
            nuevo_estado=ESTADO_CANCELADO,
            cambiado_por_id=usuario_id,
            motivo=request.motivo,
        )
        return self._to_read(pedido)

    async def obtener_historial(
        self,
        uow: UnitOfWork,
        pedido_id: int,
        current_user: Usuario,
    ) -> list[HistorialEstadoRead]:
        """Retorna historial cronologico visible por propietario u operadores."""
        usuario_id = self._require_usuario_id(current_user)
        pedido = await self._get_active_pedido(uow, pedido_id)
        roles = await self._get_user_roles(uow, usuario_id)
        if pedido.usuario_id != usuario_id and not self._has_any_role(
            roles, {"ADMIN", "PEDIDOS"}
        ):
            raise ForbiddenError("No tenes permiso para ver el historial de este pedido.")

        historial = await uow.pedidos.list_historial_by_pedido_id(pedido_id)
        return [self._historial_to_read(item) for item in historial]

    async def listar_propios(
        self,
        uow: UnitOfWork,
        *,
        current_user: Usuario,
        page: int,
        size: int,
        estado: str | None,
    ) -> PedidoListResponse:
        """Lista pedidos propios con paginacion y filtro de estado."""
        usuario_id = self._require_usuario_id(current_user)
        rows, total = await uow.pedidos.list_by_usuario_paginated(
            usuario_id,
            page=page,
            size=size,
            estado=estado,
        )
        return PedidoListResponse(
            items=[
                self._to_list_item_read(pedido, cantidad_items)
                for pedido, cantidad_items in rows
            ],
            total=total,
            page=page,
            size=size,
            pages=max(1, ceil(total / size)),
        )

    async def obtener_detalle_propio(
        self,
        uow: UnitOfWork,
        *,
        pedido_id: int,
        current_user: Usuario,
    ) -> PedidoDetailRead:
        """Retorna detalle completo de un pedido propio."""
        usuario_id = self._require_usuario_id(current_user)
        pedido = await self._get_active_pedido(uow, pedido_id)
        if pedido.usuario_id != usuario_id:
            raise ForbiddenError("No tenes permiso para ver este pedido.")
        return await self._build_detail_read(uow, pedido)

    async def listar_operativos(
        self,
        uow: UnitOfWork,
        *,
        current_user: Usuario,
        page: int,
        size: int,
        estado: str | None,
        desde,
        hasta,
        q: str | None,
    ) -> PedidoAdminListResponse:
        """Lista pedidos del sistema para ADMIN/PEDIDOS."""
        usuario_id = self._require_usuario_id(current_user)
        roles = await self._get_user_roles(uow, usuario_id)
        if not self._has_any_role(roles, {"ADMIN", "PEDIDOS"}):
            raise ForbiddenError("No tenes permiso para consultar pedidos operativos.")

        rows, total = await uow.pedidos.list_admin_paginated(
            page=page,
            size=size,
            estado=estado,
            desde=desde,
            hasta=hasta,
            q=q,
        )
        return PedidoAdminListResponse(
            items=[
                self._to_admin_list_item_read(pedido, usuario, cantidad_items)
                for pedido, usuario, cantidad_items in rows
            ],
            total=total,
            page=page,
            size=size,
            pages=max(1, ceil(total / size)),
        )

    async def obtener_detalle_operativo(
        self,
        uow: UnitOfWork,
        *,
        pedido_id: int,
        current_user: Usuario,
    ) -> PedidoAdminDetailRead:
        """Retorna detalle operativo de cualquier pedido visible por ADMIN/PEDIDOS."""
        usuario_id = self._require_usuario_id(current_user)
        roles = await self._get_user_roles(uow, usuario_id)
        if not self._has_any_role(roles, {"ADMIN", "PEDIDOS"}):
            raise ForbiddenError("No tenes permiso para ver pedidos operativos.")

        result = await uow.pedidos.get_admin_pedido_with_usuario(pedido_id)
        if result is None:
            raise NotFoundError("Pedido no encontrado.")
        pedido, usuario = result
        detail = await self._build_detail_read(uow, pedido)
        return PedidoAdminDetailRead(
            **detail.model_dump(),
            cliente=PedidoClienteRead(
                id=usuario.id,
                nombre=usuario.nombre,
                apellido=usuario.apellido,
                email=usuario.email,
            ),
        )

    @staticmethod
    def _require_usuario_id(current_user: Usuario) -> int:
        if current_user.id is None:
            raise UnauthorizedError("Usuario invalido.")
        return current_user.id

    @staticmethod
    async def _get_active_pedido(uow: UnitOfWork, pedido_id: int) -> Pedido:
        pedido = await uow.pedidos.get_by_id(pedido_id)
        if pedido is None or pedido.deleted_at is not None:
            raise NotFoundError("Pedido no encontrado.")
        return pedido

    @staticmethod
    async def _get_user_roles(uow: UnitOfWork, usuario_id: int) -> list[str]:
        result = await uow.usuarios.get_with_roles(usuario_id)
        if result is None:
            raise UnauthorizedError("Usuario no encontrado o inactivo.")
        return result[1]

    @staticmethod
    def _has_any_role(roles: list[str], allowed: set[str]) -> bool:
        return any(role in allowed for role in roles)

    @staticmethod
    def _validate_manual_transition(pedido: Pedido, nuevo_estado: str) -> None:
        if nuevo_estado == ESTADO_CONFIRMADO:
            raise ConflictError("La confirmacion del pedido es automatica por pago aprobado.")
        estado_actual = pedido.estado_codigo
        if estado_actual in TERMINAL_STATES:
            raise ConflictError("El pedido esta en un estado terminal.")
        allowed = PedidosService._allowed_manual_transitions(pedido)
        if nuevo_estado not in allowed:
            raise ConflictError("Transicion de estado no permitida.")

    @staticmethod
    def _allowed_manual_transitions(pedido: Pedido) -> set[str]:
        if pedido.estado_codigo == ESTADO_EN_PREP and PedidosService._is_pickup_order(pedido):
            return PICKUP_EN_PREP_TRANSITIONS
        return MANUAL_TRANSITIONS.get(pedido.estado_codigo, set())

    @staticmethod
    def _validate_cancel_permission(
        pedido: Pedido,
        usuario_id: int,
        roles: list[str],
    ) -> None:
        if pedido.usuario_id == usuario_id and pedido.estado_codigo == ESTADO_PENDIENTE:
            return
        if PedidosService._has_any_role(roles, {"ADMIN", "PEDIDOS"}):
            return
        raise ForbiddenError("No tenes permiso para cancelar este pedido.")

    @staticmethod
    def _validate_cancel_state(estado_actual: str) -> None:
        if estado_actual in TERMINAL_STATES:
            raise ConflictError("El pedido esta en un estado terminal.")
        if estado_actual == ESTADO_EN_CAMINO:
            raise ConflictError("No se puede cancelar un pedido en camino.")
        if estado_actual not in {ESTADO_PENDIENTE, ESTADO_CONFIRMADO, ESTADO_EN_PREP}:
            raise ConflictError("Cancelacion no permitida para el estado actual.")

    @staticmethod
    def _require_cancel_motivo(motivo: str | None) -> None:
        if motivo is None or not motivo.strip():
            raise ValidationAppError("El motivo es obligatorio para cancelar.")

    @staticmethod
    def _validate_offline_confirmation(pedido: Pedido) -> None:
        if pedido.estado_codigo != ESTADO_PENDIENTE:
            raise ConflictError("Solo se pueden confirmar pagos offline pendientes.")
        if pedido.forma_pago_codigo not in OFFLINE_PAYMENT_CODES:
            raise ConflictError("El pedido no usa una forma de pago offline confirmable.")

    @staticmethod
    def _is_pickup_order(pedido: Pedido) -> bool:
        return pedido.direccion_id is None

    async def _resolve_costo_envio(
        self, uow: UnitOfWork, direccion_id: int | None
    ) -> Decimal:
        """Retorna costo de envío. Si es pickup (sin dirección) retorna 0.
        De lo contrario, lee costo_envio_base de la tabla configuracion.
        Fallback a COSTO_ENVIO_V1 si la clave no existe o el valor no es parseable.
        """
        if direccion_id is None:
            return Decimal("0.00")
        try:
            result = await uow.session.execute(
                select(Configuracion).where(Configuracion.clave == "costo_envio_base")
            )
            row = result.scalar_one_or_none()
            if row is not None:
                return Decimal(row.valor)
        except Exception:
            pass
        return COSTO_ENVIO_V1

    async def _restore_stock_if_needed(self, uow: UnitOfWork, pedido: Pedido) -> None:
        if pedido.estado_codigo not in STOCK_DISCOUNTED_STATES:
            return
        await self._ajustar_stock_pedido(uow, pedido.id, multiplier=1)

    async def _descontar_stock_pedido(self, uow: UnitOfWork, pedido_id: int) -> None:
        await self._ajustar_stock_pedido(uow, pedido_id, multiplier=-1)

    async def _confirmar_pedido_pendiente(
        self,
        uow: UnitOfWork,
        *,
        pedido: Pedido,
        cambiado_por_id: int | None,
        motivo: str | None,
    ) -> None:
        if pedido.id is None:
            raise ValidationAppError("Pedido invalido.")
        if pedido.estado_codigo != ESTADO_PENDIENTE:
            raise ConflictError("El pedido ya no esta pendiente.")
        await self._descontar_stock_pedido(uow, pedido.id)
        await self._apply_estado(
            uow,
            pedido=pedido,
            nuevo_estado=ESTADO_CONFIRMADO,
            cambiado_por_id=cambiado_por_id,
            motivo=motivo,
        )

    @staticmethod
    async def _ajustar_stock_pedido(
        uow: UnitOfWork,
        pedido_id: int | None,
        *,
        multiplier: int,
    ) -> None:
        if pedido_id is None:
            raise ValidationAppError("Pedido invalido.")
        detalles = await uow.pedidos.get_detalles_by_pedido_id(pedido_id)
        cantidades = PedidosService._sum_detalle_cantidades(detalles, multiplier)
        productos = await uow.pedidos.get_productos_for_update(list(cantidades.keys()))
        PedidosService._apply_stock_delta(productos, cantidades)
        await uow.pedidos.save_productos(productos)

    @staticmethod
    def _sum_detalle_cantidades(
        detalles: list[DetallePedido],
        multiplier: int,
    ) -> dict[int, int]:
        cantidades: dict[int, int] = {}
        for detalle in detalles:
            if detalle.producto_id is not None:
                delta = detalle.cantidad * multiplier
                cantidades[detalle.producto_id] = cantidades.get(detalle.producto_id, 0) + delta
        return cantidades

    @staticmethod
    def _apply_stock_delta(productos: list[Producto], deltas: dict[int, int]) -> None:
        productos_by_id = {producto.id: producto for producto in productos}
        for producto_id, delta in deltas.items():
            producto = productos_by_id.get(producto_id)
            if producto is None:
                raise ConflictError(f"Producto {producto_id} no disponible para ajustar stock.")
            if producto.stock_cantidad + delta < 0:
                raise ConflictError(f"Stock insuficiente para confirmar {producto.nombre}.")
            producto.stock_cantidad += delta
            producto.updated_at = datetime.now(timezone.utc)

    @staticmethod
    async def _apply_estado(
        uow: UnitOfWork,
        *,
        pedido: Pedido,
        nuevo_estado: str,
        cambiado_por_id: int | None,
        motivo: str | None,
    ) -> None:
        if pedido.id is None:
            raise ValidationAppError("Pedido invalido.")
        estado_desde = pedido.estado_codigo
        pedido.estado_codigo = nuevo_estado
        pedido.updated_at = _utc_now_naive()
        await uow.pedidos.update(pedido)
        await uow.pedidos.create_historial(
            HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde=estado_desde,
                estado_hasta=nuevo_estado,
                cambiado_por_id=cambiado_por_id,
                motivo=motivo,
            )
        )

    @staticmethod
    def _to_read(pedido: Pedido) -> PedidoRead:
        if pedido.id is None:
            raise ValidationAppError("Pedido invalido.")
        return PedidoRead(
            id=pedido.id,
            estado_codigo=pedido.estado_codigo,
            total=pedido.total,
            costo_envio=pedido.costo_envio,
            created_at=pedido.created_at,
        )

    @staticmethod
    def _to_list_item_read(
        pedido: Pedido,
        cantidad_items: int,
    ) -> PedidoListItemRead:
        base = PedidosService._to_read(pedido)
        return PedidoListItemRead(
            **base.model_dump(),
            cantidad_items=cantidad_items,
        )

    @staticmethod
    def _to_admin_list_item_read(
        pedido: Pedido,
        usuario: Usuario,
        cantidad_items: int,
    ) -> PedidoAdminListItemRead:
        base = PedidosService._to_list_item_read(pedido, cantidad_items)
        return PedidoAdminListItemRead(
            **base.model_dump(),
            cliente_nombre=f"{usuario.nombre} {usuario.apellido}".strip(),
            cliente_email=usuario.email,
            forma_pago_codigo=pedido.forma_pago_codigo,
        )

    @staticmethod
    def _historial_to_read(historial: HistorialEstadoPedido) -> HistorialEstadoRead:
        if historial.id is None:
            raise ValidationAppError("Historial invalido.")
        return HistorialEstadoRead(
            id=historial.id,
            pedido_id=historial.pedido_id,
            estado_desde=historial.estado_desde,
            estado_hasta=historial.estado_hasta,
            cambiado_por_id=historial.cambiado_por_id,
            motivo=historial.motivo,
            created_at=historial.created_at,
        )

    async def _build_detail_read(
        self,
        uow: UnitOfWork,
        pedido: Pedido,
    ) -> PedidoDetailRead:
        base = self._to_read(pedido)
        detalles = await uow.pedidos.get_detalles_by_pedido_id(pedido.id)
        historial = await uow.pedidos.list_historial_by_pedido_id(pedido.id)
        pagos = await uow.pagos.list_by_pedido_id(pedido.id)
        ultimo_pago = pagos[-1] if pagos else None
        return PedidoDetailRead(
            **base.model_dump(),
            forma_pago_codigo=pedido.forma_pago_codigo,
            direccion_snapshot=self._direccion_snapshot_to_read(pedido.direccion_snapshot),
            notas=pedido.notas,
            items=await self._detalles_to_read(uow, detalles),
            historial=[self._historial_to_read(item) for item in historial],
            pago=self._pago_resumen_to_read(ultimo_pago),
        )

    @staticmethod
    async def _detalles_to_read(
        uow: UnitOfWork,
        detalles: list[DetallePedido],
    ) -> list[PedidoDetalleItemRead]:
        missing_ids: set[int] = set()
        for detalle in detalles:
            if detalle.personalizacion and not detalle.personalizacion_snapshot:
                missing_ids.update(detalle.personalizacion)

        names_by_id: dict[int, str] = {}
        if missing_ids:
            names_by_id = await uow.pedidos.get_ingrediente_names(list(missing_ids))

        return [
            PedidosService._detalle_to_read(detalle, names_by_id)
            for detalle in detalles
        ]

    @staticmethod
    def _detalle_to_read(
        detalle: DetallePedido,
        names_by_id: dict[int, str] | None = None,
    ) -> PedidoDetalleItemRead:
        personalizacion = detalle.personalizacion or []
        detalle_legible = PedidosService._personalizacion_detalle_to_read(
            detalle.personalizacion_snapshot,
            personalizacion,
            names_by_id or {},
        )
        return PedidoDetalleItemRead(
            producto_id=detalle.producto_id,
            nombre_snapshot=detalle.nombre_snapshot,
            precio_snapshot=detalle.precio_snapshot,
            cantidad=detalle.cantidad,
            personalizacion=personalizacion,
            personalizacion_detalle=detalle_legible,
            notas=detalle.notas,
        )

    @staticmethod
    def _personalizacion_detalle_to_read(
        snapshot: list[dict] | None,
        personalizacion: list[int],
        names_by_id: dict[int, str],
    ) -> list[PedidoPersonalizacionDetalleRead]:
        if snapshot:
            return [
                PedidoPersonalizacionDetalleRead(
                    ingrediente_id=int(item.get("ingredienteId") or item.get("ingrediente_id")),
                    nombre=str(item.get("nombre") or ""),
                )
                for item in snapshot
                if item.get("ingredienteId") is not None or item.get("ingrediente_id") is not None
            ]
        return [
            PedidoPersonalizacionDetalleRead(
                ingrediente_id=ingrediente_id,
                nombre=names_by_id.get(ingrediente_id, f"Ingrediente #{ingrediente_id}"),
            )
            for ingrediente_id in personalizacion
        ]

    @staticmethod
    def _direccion_snapshot_to_read(
        snapshot: dict | None,
    ) -> DireccionSnapshotRead | None:
        if snapshot is None:
            return None
        return DireccionSnapshotRead(
            id=snapshot.get("id"),
            alias=snapshot.get("alias"),
            linea1=snapshot.get("linea1", ""),
            linea2=snapshot.get("linea2"),
            ciudad=snapshot.get("ciudad", ""),
            provincia=snapshot.get("provincia", ""),
            codigo_postal=snapshot.get("codigo_postal"),
            notas=snapshot.get("notas"),
        )

    @staticmethod
    def _pago_resumen_to_read(pago) -> PedidoPagoResumenRead | None:
        if pago is None:
            return None
        return PedidoPagoResumenRead(
            mp_payment_id=pago.mp_payment_id,
            mp_status=pago.mp_status,
            status_detail=pago.status_detail,
            updated_at=pago.updated_at,
        )

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
        removable = await uow.pedidos.get_removable_ingredientes_detail(product_ids)
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
        removable: dict[int, dict[int, str]],
    ) -> PreparedPedidoItem:
        producto_id = int(producto.id)
        personalizacion = sorted(set(item.personalizacion))
        removable_ingredientes = removable.get(producto_id, {})
        invalid = set(personalizacion) - set(removable_ingredientes)
        if invalid:
            raise ValidationAppError(
                f"Personalizacion invalida para el producto {producto.nombre}."
            )
        personalizacion_snapshot = [
            {"ingredienteId": ingrediente_id, "nombre": removable_ingredientes[ingrediente_id]}
            for ingrediente_id in personalizacion
        ]
        notas = item.notas.strip() if item.notas else None
        return PreparedPedidoItem(
            producto_id=producto_id,
            cantidad=item.cantidad,
            nombre_snapshot=producto.nombre,
            precio_snapshot=Decimal(producto.precio_base),
            personalizacion=personalizacion or None,
            personalizacion_snapshot=personalizacion_snapshot or None,
            notas=notas or None,
        )

    @staticmethod
    async def _create_pedido(
        uow: UnitOfWork,
        *,
        request: CrearPedidoRequest,
        usuario_id: int,
        direccion_snapshot: dict | None,
        total: Decimal,
        costo_envio: Decimal,
    ) -> Pedido:
        pedido = Pedido(
            usuario_id=usuario_id,
            estado_codigo=ESTADO_PENDIENTE,
            forma_pago_codigo=request.forma_pago_codigo,
            direccion_id=request.direccion_id,
            direccion_snapshot=direccion_snapshot,
            notas=request.notas,
            total=total,
            costo_envio=costo_envio,
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
                personalizacion_snapshot=item.personalizacion_snapshot,
                notas=item.notas,
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
