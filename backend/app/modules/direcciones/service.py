"""Módulo direcciones — service layer.

Reglas:
- Ownership estricto: operar sobre direcciones ajenas retorna 404.
- Soft delete.
- es_principal único por usuario; primera dirección creada => principal.
- es_principal no se setea via POST/PUT; solo PATCH /{id}/principal.
"""

from app.core.exceptions import NotFoundError
from app.core.uow import UnitOfWork
from app.db.models.identidad import DireccionEntrega
from app.modules.direcciones.schemas import (
    DireccionCreate,
    DireccionList,
    DireccionRead,
    DireccionUpdate,
)


class DireccionService:
    """Servicio stateless de direcciones. La transacción la maneja el UoW."""

    @staticmethod
    async def list(
        uow: UnitOfWork,
        *,
        usuario_id: int,
        page: int = 1,
        page_size: int = 10,
    ) -> DireccionList:
        skip = (page - 1) * page_size
        items = await uow.direcciones.list_by_usuario(usuario_id, skip=skip, limit=page_size)
        total = await uow.direcciones.count_by_usuario(usuario_id)
        reads = [DireccionRead.model_validate(it) for it in items]
        return DireccionList(items=reads, page=page, page_size=page_size, total=total)

    @staticmethod
    async def get_by_id(uow: UnitOfWork, *, usuario_id: int, direccion_id: int) -> DireccionRead:
        direccion = await uow.direcciones.get_owned_active(usuario_id, direccion_id)
        if direccion is None:
            raise NotFoundError("Dirección no encontrada.")
        return DireccionRead.model_validate(direccion)

    @staticmethod
    async def create(uow: UnitOfWork, *, usuario_id: int, data: DireccionCreate) -> DireccionRead:
        is_first = not await uow.direcciones.has_any_active(usuario_id)
        direccion = DireccionEntrega(
            usuario_id=usuario_id,
            alias=data.alias,
            linea1=data.linea1,
            linea2=data.linea2,
            ciudad=data.ciudad,
            provincia=data.provincia,
            codigo_postal=data.codigo_postal,
            notas=data.notas,
            es_principal=is_first,
        )
        direccion = await uow.direcciones.create(direccion)
        return DireccionRead.model_validate(direccion)

    @staticmethod
    async def update(
        uow: UnitOfWork,
        *,
        usuario_id: int,
        direccion_id: int,
        data: DireccionUpdate,
    ) -> DireccionRead:
        direccion = await uow.direcciones.get_owned_active(usuario_id, direccion_id)
        if direccion is None:
            raise NotFoundError("Dirección no encontrada.")

        direccion.alias = data.alias
        direccion.linea1 = data.linea1
        direccion.linea2 = data.linea2
        direccion.ciudad = data.ciudad
        direccion.provincia = data.provincia
        direccion.codigo_postal = data.codigo_postal
        direccion.notas = data.notas

        direccion = await uow.direcciones.update(direccion)
        return DireccionRead.model_validate(direccion)

    @staticmethod
    async def soft_delete(uow: UnitOfWork, *, usuario_id: int, direccion_id: int) -> None:
        direccion = await uow.direcciones.get_owned_active(usuario_id, direccion_id)
        if direccion is None:
            raise NotFoundError("Dirección no encontrada.")
        await uow.direcciones.soft_delete(direccion)

    @staticmethod
    async def set_principal(uow: UnitOfWork, *, usuario_id: int, direccion_id: int) -> DireccionRead:
        direccion = await uow.direcciones.get_owned_active(usuario_id, direccion_id)
        if direccion is None:
            raise NotFoundError("Dirección no encontrada.")

        # Unset otras en la misma transacción.
        await uow.direcciones.unset_principal_others(usuario_id, keep_id=direccion_id)
        direccion.es_principal = True
        direccion = await uow.direcciones.update(direccion)
        return DireccionRead.model_validate(direccion)
