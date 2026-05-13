"""Módulo metricas — service layer (solo lectura, sin repositorio dedicado)."""

from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Literal

from sqlalchemy import func, select

from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.db.models.ventas import DetallePedido, Pedido
from app.modules.metricas.schemas import (
    EstadoCountItem,
    PedidosPorEstadoResponse,
    ProductoTopItem,
    ProductosTopResponse,
    PuntoVentaItem,
    ResumenResponse,
    VentasResponse,
)

_GRANULARIDAD_MAP: dict[str, str] = {
    "dia": "day",
    "semana": "week",
    "mes": "month",
}


def _rango_default() -> tuple[datetime, datetime]:
    now = datetime.utcnow()
    return now - timedelta(days=30), now


def _to_datetime(d: date | None, end_of_day: bool = False) -> datetime | None:
    if d is None:
        return None
    dt = datetime(d.year, d.month, d.day)
    if end_of_day:
        dt = dt.replace(hour=23, minute=59, second=59)
    return dt


async def get_resumen(
    uow: UnitOfWork,
    desde: date | None,
    hasta: date | None,
) -> ResumenResponse:
    desde_dt = _to_datetime(desde) or _rango_default()[0]
    hasta_dt = _to_datetime(hasta, end_of_day=True) or datetime.utcnow()

    session = uow.session

    # Totales de pedidos en el rango
    stmt_pedidos = select(
        func.coalesce(func.sum(Pedido.total), Decimal("0")).label("total_ventas"),
        func.count(Pedido.id).label("cantidad_pedidos"),
        func.coalesce(func.avg(Pedido.total), Decimal("0")).label("ticket_promedio"),
    ).where(
        Pedido.deleted_at.is_(None),
        Pedido.created_at >= desde_dt,
        Pedido.created_at <= hasta_dt,
    )
    row = (await session.execute(stmt_pedidos)).one()

    # Total de usuarios registrados en el rango
    stmt_usuarios = select(func.count(Usuario.id)).where(
        Usuario.deleted_at.is_(None),
        Usuario.created_at >= desde_dt,
        Usuario.created_at <= hasta_dt,
    )
    usuarios_count = (await session.execute(stmt_usuarios)).scalar_one()

    # Top 5 productos por cantidad vendida
    stmt_top = (
        select(
            DetallePedido.producto_id,
            DetallePedido.nombre_snapshot.label("nombre"),
            func.sum(DetallePedido.cantidad).label("cantidad_vendida"),
            func.sum(DetallePedido.cantidad * DetallePedido.precio_snapshot).label("ingreso_total"),
        )
        .join(Pedido, DetallePedido.pedido_id == Pedido.id)
        .where(
            Pedido.deleted_at.is_(None),
            Pedido.created_at >= desde_dt,
            Pedido.created_at <= hasta_dt,
        )
        .group_by(DetallePedido.producto_id, DetallePedido.nombre_snapshot)
        .order_by(func.sum(DetallePedido.cantidad).desc())
        .limit(5)
    )
    top_rows = (await session.execute(stmt_top)).all()

    return ResumenResponse(
        total_ventas=row.total_ventas,
        cantidad_pedidos=row.cantidad_pedidos,
        ticket_promedio=row.ticket_promedio,
        usuarios_registrados=usuarios_count,
        productos_top=[
            ProductoTopItem(
                producto_id=r.producto_id,
                nombre=r.nombre,
                cantidad_vendida=int(r.cantidad_vendida),
                ingreso_total=r.ingreso_total,
            )
            for r in top_rows
        ],
    )


async def get_ventas(
    uow: UnitOfWork,
    desde: date | None,
    hasta: date | None,
    granularidad: Literal["dia", "semana", "mes"],
) -> VentasResponse:
    desde_dt = _to_datetime(desde) or _rango_default()[0]
    hasta_dt = _to_datetime(hasta, end_of_day=True) or datetime.utcnow()
    pg_trunc = _GRANULARIDAD_MAP[granularidad]

    session = uow.session
    fecha_col = func.date_trunc(pg_trunc, Pedido.created_at).label("fecha")

    stmt = (
        select(
            fecha_col,
            func.coalesce(func.sum(Pedido.total), Decimal("0")).label("total_ventas"),
            func.count(Pedido.id).label("cantidad_pedidos"),
        )
        .where(
            Pedido.deleted_at.is_(None),
            Pedido.created_at >= desde_dt,
            Pedido.created_at <= hasta_dt,
        )
        .group_by(fecha_col)
        .order_by(fecha_col)
    )
    rows = (await session.execute(stmt)).all()

    return VentasResponse(
        puntos=[
            PuntoVentaItem(
                fecha=r.fecha.date() if hasattr(r.fecha, "date") else r.fecha,
                total_ventas=r.total_ventas,
                cantidad_pedidos=int(r.cantidad_pedidos),
            )
            for r in rows
        ]
    )


async def get_productos_top(
    uow: UnitOfWork,
    top: int,
    desde: date | None,
    hasta: date | None,
) -> ProductosTopResponse:
    desde_dt = _to_datetime(desde) or _rango_default()[0]
    hasta_dt = _to_datetime(hasta, end_of_day=True) or datetime.utcnow()

    session = uow.session
    stmt = (
        select(
            DetallePedido.producto_id,
            DetallePedido.nombre_snapshot.label("nombre"),
            func.sum(DetallePedido.cantidad).label("cantidad_vendida"),
            func.sum(DetallePedido.cantidad * DetallePedido.precio_snapshot).label("ingreso_total"),
        )
        .join(Pedido, DetallePedido.pedido_id == Pedido.id)
        .where(
            Pedido.deleted_at.is_(None),
            Pedido.created_at >= desde_dt,
            Pedido.created_at <= hasta_dt,
        )
        .group_by(DetallePedido.producto_id, DetallePedido.nombre_snapshot)
        .order_by(func.sum(DetallePedido.cantidad).desc())
        .limit(top)
    )
    rows = (await session.execute(stmt)).all()

    return ProductosTopResponse(
        productos=[
            ProductoTopItem(
                producto_id=r.producto_id,
                nombre=r.nombre,
                cantidad_vendida=int(r.cantidad_vendida),
                ingreso_total=r.ingreso_total,
            )
            for r in rows
        ]
    )


async def get_pedidos_por_estado(
    uow: UnitOfWork,
    desde: date | None,
    hasta: date | None,
) -> PedidosPorEstadoResponse:
    desde_dt = _to_datetime(desde) or _rango_default()[0]
    hasta_dt = _to_datetime(hasta, end_of_day=True) or datetime.utcnow()

    session = uow.session
    stmt = (
        select(
            Pedido.estado_codigo,
            func.count(Pedido.id).label("cantidad"),
        )
        .where(
            Pedido.deleted_at.is_(None),
            Pedido.created_at >= desde_dt,
            Pedido.created_at <= hasta_dt,
        )
        .group_by(Pedido.estado_codigo)
        .order_by(func.count(Pedido.id).desc())
    )
    rows = (await session.execute(stmt)).all()

    return PedidosPorEstadoResponse(
        estados=[
            EstadoCountItem(estado_codigo=r.estado_codigo, cantidad=int(r.cantidad))
            for r in rows
        ]
    )
