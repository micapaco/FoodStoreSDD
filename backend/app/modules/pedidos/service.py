from decimal import Decimal

from app.core.uow import UnitOfWork
from app.modules.pedidos.schemas import (
    ErrorValidacion,
    PrecioActualizado,
    ValidarCarritoRequest,
    ValidarCarritoResponse,
)


class PedidosService:
    """Casos de uso de pedidos previos a la creación de la orden."""

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
                        mensaje="El producto no está disponible.",
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
