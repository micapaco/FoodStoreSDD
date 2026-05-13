"""Router del módulo config."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.deps import get_current_user, require_role
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
from app.modules.config import service
from app.modules.config.schemas import (
    ConfigListResponse,
    ConfigParametro,
    ConfigPublicaResponse,
    ConfigUpdateRequest,
)

router = APIRouter(tags=["config"])


@router.get(
    "/admin/configuracion",
    response_model=ConfigListResponse,
    status_code=status.HTTP_200_OK,
)
async def listar_configuracion(
    _current_user: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
) -> ConfigListResponse:
    """Retorna todos los parámetros de configuración del sistema. Solo ADMIN."""
    async with UnitOfWork() as uow:
        parametros = await service.listar(uow)
    return ConfigListResponse(
        parametros=[
            ConfigParametro(
                clave=p.clave,
                valor=p.valor,
                updated_by_id=p.updated_by_id,
                updated_at=p.updated_at,
            )
            for p in parametros
        ]
    )


@router.put(
    "/admin/configuracion/{clave}",
    response_model=ConfigParametro,
    status_code=status.HTTP_200_OK,
)
async def actualizar_configuracion(
    clave: str,
    request: ConfigUpdateRequest,
    current_user: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
) -> ConfigParametro:
    """Actualiza el valor de un parámetro de configuración. Solo ADMIN."""
    async with UnitOfWork() as uow:
        config = await service.actualizar(
            clave, request.valor, current_user.id, uow  # type: ignore[arg-type]
        )
        return ConfigParametro(
            clave=config.clave,
            valor=config.valor,
            updated_by_id=config.updated_by_id,
            updated_at=config.updated_at,
        )


@router.get(
    "/configuracion/publica",
    response_model=ConfigPublicaResponse,
    status_code=status.HTTP_200_OK,
)
async def configuracion_publica() -> ConfigPublicaResponse:
    """Retorna parámetros públicos del sistema. Sin autenticación requerida."""
    async with UnitOfWork() as uow:
        try:
            costo_row = await service.obtener("costo_envio_base", uow)
            costo = float(costo_row.valor)
        except Exception:
            costo = 50.0

        try:
            habilitados_row = await service.obtener("pedidos_habilitados", uow)
            habilitados = habilitados_row.valor.lower() == "true"
        except Exception:
            habilitados = True

        try:
            mensaje_row = await service.obtener("mensaje_sistema", uow)
            mensaje = mensaje_row.valor
        except Exception:
            mensaje = ""

    return ConfigPublicaResponse(
        costo_envio_base=costo,
        pedidos_habilitados=habilitados,
        mensaje_sistema=mensaje,
    )
