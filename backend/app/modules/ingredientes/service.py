"""
Módulo ingredientes — capa de servicio.

Lógica de negocio para gestión de ingredientes y alérgenos:
- Creación con validación de unicidad de nombre
- Actualización parcial
- Soft delete
- Listado de alérgenos
"""

from datetime import datetime
from math import ceil

from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.core.uow import UnitOfWork
from app.db.models.catalogo import Ingrediente
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteList,
    IngredienteRead,
    IngredienteUpdate,
)


class IngredienteService:
    """Servicio stateless de ingredientes. La transacción la maneja el UoW."""

    @staticmethod
    async def create(uow: UnitOfWork, data: IngredienteCreate) -> IngredienteRead:
        """Crea un nuevo ingrediente.

        Valida que el nombre no esté duplicado (incluso entre eliminados
        para evitar conflictos de unique constraint).
        """
        existing = await uow.ingredientes.get_by_nombre(data.nombre)
        if existing is not None:
            raise ConflictError(f"Ya existe un ingrediente con el nombre '{data.nombre}'.")

        ingrediente = Ingrediente(
            nombre=data.nombre,
            es_alergeno=data.es_alergeno,
        )
        ingrediente = await uow.ingredientes.create(ingrediente)

        return IngredienteRead(
            id=ingrediente.id,  # type: ignore[arg-type]
            nombre=ingrediente.nombre,
            es_alergeno=ingrediente.es_alergeno,
            created_at=ingrediente.created_at,  # type: ignore[arg-type]
            updated_at=ingrediente.updated_at,  # type: ignore[arg-type]
        )

    @staticmethod
    async def update(
        uow: UnitOfWork,
        ingrediente_id: int,
        data: IngredienteUpdate,
    ) -> IngredienteRead:
        """Actualiza un ingrediente parcialmente.

        Si se cambia el nombre, valida unicidad.
        """
        ingrediente = await uow.ingredientes.get_by_id(ingrediente_id)
        if ingrediente is None or ingrediente.deleted_at is not None:
            raise NotFoundError(f"Ingrediente {ingrediente_id} no encontrado.")

        changed = False

        if data.nombre is not None and data.nombre != ingrediente.nombre:
            # Validar que el nuevo nombre no esté en uso
            existing = await uow.ingredientes.get_by_nombre(data.nombre)
            if existing is not None and existing.id != ingrediente_id:
                raise ConflictError(
                    f"Ya existe un ingrediente con el nombre '{data.nombre}'."
                )
            ingrediente.nombre = data.nombre
            changed = True

        if data.es_alergeno is not None and data.es_alergeno != ingrediente.es_alergeno:
            ingrediente.es_alergeno = data.es_alergeno
            changed = True

        if not changed:
            raise ValidationAppError("No se enviaron campos para actualizar.")

        ingrediente.updated_at = datetime.now(datetime.timezone.utc)
        ingrediente = await uow.ingredientes.update(ingrediente)

        return IngredienteRead(
            id=ingrediente.id,  # type: ignore[arg-type]
            nombre=ingrediente.nombre,
            es_alergeno=ingrediente.es_alergeno,
            created_at=ingrediente.created_at,  # type: ignore[arg-type]
            updated_at=ingrediente.updated_at,  # type: ignore[arg-type]
        )

    @staticmethod
    async def soft_delete(uow: UnitOfWork, ingrediente_id: int) -> None:
        """Elimina lógicamente un ingrediente."""
        ingrediente = await uow.ingredientes.get_by_id(ingrediente_id)
        if ingrediente is None or ingrediente.deleted_at is not None:
            raise NotFoundError(f"Ingrediente {ingrediente_id} no encontrado.")

        await uow.ingredientes.soft_delete(ingrediente)

    @staticmethod
    async def get_by_id(uow: UnitOfWork, ingrediente_id: int) -> IngredienteRead:
        """Retorna un ingrediente por ID."""
        ingrediente = await uow.ingredientes.get_by_id(ingrediente_id)
        if ingrediente is None or ingrediente.deleted_at is not None:
            raise NotFoundError(f"Ingrediente {ingrediente_id} no encontrado.")

        return IngredienteRead(
            id=ingrediente.id,  # type: ignore[arg-type]
            nombre=ingrediente.nombre,
            es_alergeno=ingrediente.es_alergeno,
            created_at=ingrediente.created_at,  # type: ignore[arg-type]
            updated_at=ingrediente.updated_at,  # type: ignore[arg-type]
        )

    @staticmethod
    async def list_all(
        uow: UnitOfWork,
        page: int = 1,
        size: int = 20,
        alergeno: bool | None = None,
    ) -> IngredienteList:
        """Lista ingredientes activos con paginación y filtro opcional de alérgenos."""
        skip = (page - 1) * size

        if alergeno is not None:
            if alergeno:
                items = await uow.ingredientes.list_alergenos(skip=skip, limit=size)
                total = await uow.ingredientes.count_alergenos()
            else:
                items = await uow.ingredientes.list_no_alergenos(skip=skip, limit=size)
                total = await uow.ingredientes.count_no_alergenos()
        else:
            items = await uow.ingredientes.list_active(skip=skip, limit=size)
            total = await uow.ingredientes.count_active()

        reads = [
            IngredienteRead(
                id=ing.id,  # type: ignore[arg-type]
                nombre=ing.nombre,
                es_alergeno=ing.es_alergeno,
                created_at=ing.created_at,  # type: ignore[arg-type]
                updated_at=ing.updated_at,  # type: ignore[arg-type]
            )
            for ing in items
        ]
        pages = max(1, ceil(total / size))

        return IngredienteList(
            items=reads,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )
