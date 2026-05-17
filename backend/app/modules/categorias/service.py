"""
Módulo categorías — capa de servicio.

Contiene la lógica de negocio para la gestión de categorías jerárquicas:
- Creación con validación de padre activo
- Actualización con validación anti-ciclos
- Soft delete
- Árbol jerárquico completo
"""

from datetime import datetime, timezone
from math import ceil
from typing import Optional

from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.core.uow import UnitOfWork
from app.db.models.catalogo import Categoria
from app.modules.categorias.schemas import (
    CategoriaCreate,
    CategoriaList,
    CategoriaRead,
    CategoriaUpdate,
)


class CategoriaService:
    """Servicio stateless de categorías. La transacción la maneja el UoW."""

    @staticmethod
    def _utc_now_naive() -> datetime:
        """UTC sin tzinfo para columnas timestamp sin zona horaria."""
        return datetime.now(timezone.utc).replace(tzinfo=None)

    @staticmethod
    def _normalize_nombre(nombre: str) -> str:
        """Normaliza espacios sin cambiar la capitalizacion elegida."""
        return " ".join(nombre.strip().split())

    @staticmethod
    async def _ensure_nombre_activo_disponible(
        uow: UnitOfWork,
        nombre: str,
        *,
        ignore_id: int | None = None,
    ) -> None:
        existing = await uow.categorias.get_active_by_nombre_normalized(nombre)
        if existing is not None and existing.id != ignore_id:
            raise ConflictError(
                f"Ya existe una categoria activa con el nombre '{nombre}'."
            )

    @staticmethod
    async def _build_tree(categorias: list[Categoria]) -> list[CategoriaRead]:
        """Construye el árbol jerárquico desde una lista plana ordenada por profundidad.

        Recorre la lista (ordenada raíces → hojas) y anida cada categoría
        como hijo de su padre. Las raíces (parent_id = None) son los nodos
        de nivel superior.
        """
        node_map: dict[int, CategoriaRead] = {}
        roots: list[CategoriaRead] = []

        for cat in categorias:
            read = CategoriaRead(
                id=cat.id,
                nombre=cat.nombre,
                parent_id=cat.parent_id,
                created_at=cat.created_at,
                updated_at=cat.updated_at,
            )
            node_map[cat.id] = read  # type: ignore[arg-type]

            if cat.parent_id is None:
                roots.append(read)
            else:
                parent = node_map.get(cat.parent_id)
                if parent is not None:
                    parent.children.append(read)

        return roots

    @staticmethod
    async def create(uow: UnitOfWork, data: CategoriaCreate) -> CategoriaRead:
        """Crea una nueva categoría.

        Valida que el padre exista y esté activo si se proporciona parent_id.
        """
        nombre = CategoriaService._normalize_nombre(data.nombre)
        await CategoriaService._ensure_nombre_activo_disponible(uow, nombre)

        if data.parent_id is not None:
            exists = await uow.categorias.validate_parent_exists(data.parent_id)
            if not exists:
                raise NotFoundError(
                    f"La categoría padre {data.parent_id} no existe o está eliminada."
                )

        categoria = Categoria(nombre=nombre, parent_id=data.parent_id)
        categoria = await uow.categorias.create(categoria)

        return CategoriaRead(
            id=categoria.id,  # type: ignore[arg-type]
            nombre=categoria.nombre,
            parent_id=categoria.parent_id,
            created_at=categoria.created_at,  # type: ignore[arg-type]
            updated_at=categoria.updated_at,  # type: ignore[arg-type]
        )

    @staticmethod
    async def update(
        uow: UnitOfWork,
        categoria_id: int,
        data: CategoriaUpdate,
    ) -> CategoriaRead:
        """Actualiza una categoría con validación anti-ciclos.

        Si se cambia el parent_id, verifica que:
        1. El nuevo padre exista y esté activo
        2. No se cree un ciclo (el nuevo padre no puede ser descendiente del nodo actual)
        """
        categoria = await uow.categorias.get_by_id(categoria_id)
        if categoria is None or categoria.deleted_at is not None:
            raise NotFoundError(f"Categoría {categoria_id} no encontrada.")

        # Actualizar campos presentes en el request
        changed = False

        if data.nombre is not None:
            nombre = CategoriaService._normalize_nombre(data.nombre)
            if nombre != categoria.nombre:
                await CategoriaService._ensure_nombre_activo_disponible(
                    uow,
                    nombre,
                    ignore_id=categoria_id,
                )
                categoria.nombre = nombre
                changed = True

        # Si se especificó parent_id explícitamente None → convertir en raíz
        # Si se especificó un valor → cambiar de padre (con validaciones)
        # Si no se especificó (None por default del schema) → no tocar
        if "parent_id" in data.model_dump(exclude_unset=True):
            new_parent = data.parent_id

            if new_parent is not None:
                # Validar que el nuevo padre existe y está activo
                exists = await uow.categorias.validate_parent_exists(new_parent)
                if not exists:
                    raise NotFoundError(
                        f"La categoría padre {new_parent} no existe o está eliminada."
                    )

                # Validar anti-ciclos
                has_cycle = await uow.categorias.check_circular_ref(categoria_id, new_parent)
                if has_cycle:
                    raise ValidationAppError(
                        "No se puede asignar esa categoría como padre porque "
                        "crearía un ciclo en la jerarquía."
                    )

            categoria.parent_id = new_parent
            changed = True

        if not changed:
            raise ValidationAppError("No se enviaron campos para actualizar.")

        categoria.updated_at = CategoriaService._utc_now_naive()
        categoria = await uow.categorias.update(categoria)

        return CategoriaRead(
            id=categoria.id,  # type: ignore[arg-type]
            nombre=categoria.nombre,
            parent_id=categoria.parent_id,
            created_at=categoria.created_at,  # type: ignore[arg-type]
            updated_at=categoria.updated_at,  # type: ignore[arg-type]
        )

    @staticmethod
    async def soft_delete(uow: UnitOfWork, categoria_id: int) -> None:
        """Elimina lógicamente una categoría.

        NOTA: Los hijos NO se eliminan en cascada — quedan huérfanos.
        El soft delete solo marca la categoría; los hijos existen pero
        una categoría eliminada no puede ser referenciada como padre.
        """
        categoria = await uow.categorias.get_by_id(categoria_id)
        if categoria is None or categoria.deleted_at is not None:
            raise NotFoundError(f"Categoría {categoria_id} no encontrada.")

        await uow.categorias.soft_delete(categoria)

    @staticmethod
    async def get_tree(uow: UnitOfWork) -> list[CategoriaRead]:
        """Retorna el árbol completo de categorías activas."""
        categorias = await uow.categorias.get_tree()
        return await CategoriaService._build_tree(categorias)

    @staticmethod
    async def get_by_id(uow: UnitOfWork, categoria_id: int) -> CategoriaRead:
        """Retorna una categoría por ID."""
        categoria = await uow.categorias.get_by_id(categoria_id)
        if categoria is None or categoria.deleted_at is not None:
            raise NotFoundError(f"Categoría {categoria_id} no encontrada.")

        return CategoriaRead(
            id=categoria.id,  # type: ignore[arg-type]
            nombre=categoria.nombre,
            parent_id=categoria.parent_id,
            created_at=categoria.created_at,  # type: ignore[arg-type]
            updated_at=categoria.updated_at,  # type: ignore[arg-type]
        )

    @staticmethod
    async def list_all(
        uow: UnitOfWork,
        page: int = 1,
        size: int = 20,
    ) -> CategoriaList:
        """Lista categorías activas con paginación."""
        skip = (page - 1) * size
        items = await uow.categorias.list_active(skip=skip, limit=size)
        total = await uow.categorias.count_active()
        pages = max(1, ceil(total / size))

        reads = [
            CategoriaRead(
                id=cat.id,  # type: ignore[arg-type]
                nombre=cat.nombre,
                parent_id=cat.parent_id,
                created_at=cat.created_at,  # type: ignore[arg-type]
                updated_at=cat.updated_at,  # type: ignore[arg-type]
            )
            for cat in items
        ]
        return CategoriaList(
            items=reads,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )
