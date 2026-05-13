"""Servicio del módulo config — lógica de acceso a parámetros del sistema."""

from datetime import datetime

from sqlalchemy import select

from app.core.exceptions import NotFoundError
from app.core.uow import UnitOfWork
from app.db.models.configuracion import Configuracion


async def listar(uow: UnitOfWork) -> list[Configuracion]:
    """Retorna todos los parámetros de configuración."""
    result = await uow.session.execute(select(Configuracion))
    return list(result.scalars().all())


async def obtener(clave: str, uow: UnitOfWork) -> Configuracion:
    """Retorna un parámetro por clave. Lanza NotFoundError si no existe."""
    result = await uow.session.execute(
        select(Configuracion).where(Configuracion.clave == clave)
    )
    config = result.scalar_one_or_none()
    if config is None:
        raise NotFoundError(f"Parámetro '{clave}' no encontrado")
    return config


async def actualizar(
    clave: str, valor: str, usuario_id: int, uow: UnitOfWork
) -> Configuracion:
    """Actualiza el valor de un parámetro existente y registra quién lo modificó."""
    config = await obtener(clave, uow)
    config.valor = valor
    config.updated_by_id = usuario_id
    config.updated_at = datetime.utcnow()
    await uow.session.flush()
    await uow.session.refresh(config)
    return config
