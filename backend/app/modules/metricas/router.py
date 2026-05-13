"""Módulo metricas — router admin."""

from datetime import date
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, Query

from app.core.deps import require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.metricas import service
from app.modules.metricas.schemas import (
    PedidosPorEstadoResponse,
    ProductosTopResponse,
    ResumenResponse,
    VentasResponse,
)

router = APIRouter(prefix="/admin/metricas", tags=["admin-metricas"])


@router.get("/resumen", response_model=ResumenResponse)
async def resumen(
    desde: Annotated[Optional[date], Query(description="Fecha inicio (ISO)")] = None,
    hasta: Annotated[Optional[date], Query(description="Fecha fin (ISO)")] = None,
    _current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> ResumenResponse:
    async with UnitOfWork() as uow:
        return await service.get_resumen(uow, desde, hasta)


@router.get("/ventas", response_model=VentasResponse)
async def ventas(
    desde: Annotated[Optional[date], Query()] = None,
    hasta: Annotated[Optional[date], Query()] = None,
    granularidad: Annotated[Literal["dia", "semana", "mes"], Query()] = "dia",
    _current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> VentasResponse:
    async with UnitOfWork() as uow:
        return await service.get_ventas(uow, desde, hasta, granularidad)


@router.get("/productos-top", response_model=ProductosTopResponse)
async def productos_top(
    top: Annotated[int, Query(ge=1, le=50)] = 10,
    desde: Annotated[Optional[date], Query()] = None,
    hasta: Annotated[Optional[date], Query()] = None,
    _current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> ProductosTopResponse:
    async with UnitOfWork() as uow:
        return await service.get_productos_top(uow, top, desde, hasta)


@router.get("/pedidos-por-estado", response_model=PedidosPorEstadoResponse)
async def pedidos_por_estado(
    desde: Annotated[Optional[date], Query()] = None,
    hasta: Annotated[Optional[date], Query()] = None,
    _current_user: Usuario = Depends(require_role(["ADMIN"])),
) -> PedidosPorEstadoResponse:
    async with UnitOfWork() as uow:
        return await service.get_pedidos_por_estado(uow, desde, hasta)
