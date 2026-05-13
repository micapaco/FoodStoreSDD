"""Módulo metricas — schemas Pydantic v2."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ProductoTopItem(BaseModel):
    producto_id: int | None
    nombre: str
    cantidad_vendida: int
    ingreso_total: Decimal


class ResumenResponse(BaseModel):
    total_ventas: Decimal
    cantidad_pedidos: int
    ticket_promedio: Decimal
    usuarios_registrados: int
    productos_top: list[ProductoTopItem]


class PuntoVentaItem(BaseModel):
    fecha: date
    total_ventas: Decimal
    cantidad_pedidos: int


class VentasResponse(BaseModel):
    puntos: list[PuntoVentaItem]


class ProductosTopResponse(BaseModel):
    productos: list[ProductoTopItem]


class EstadoCountItem(BaseModel):
    estado_codigo: str
    cantidad: int


class PedidosPorEstadoResponse(BaseModel):
    estados: list[EstadoCountItem]
