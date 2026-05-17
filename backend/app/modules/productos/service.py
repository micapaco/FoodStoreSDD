"""
Módulo productos — capa de servicio.

Lógica de negocio para la gestión de productos del catálogo:
- Creación con validación de categorías/ingredientes activos
- Actualización parcial con resincronización de relaciones
- Soft delete y control de stock/disponibilidad
- Listado con filtros combinados (modo admin vs público)
"""

from datetime import datetime, timezone
from math import ceil
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import UploadFile

from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.core.uow import UnitOfWork
from app.db.models.catalogo import Producto
from app.modules.productos.schemas import (
    CategoriaReadRef,
    IngredienteAsignacion,
    IngredienteReadRef,
    ProductoCreate,
    ProductoDetail,
    ProductoList,
    ProductoRead,
    ProductoUpdate,
)

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
}
MAX_PRODUCT_IMAGE_BYTES = 1_000_000
PRODUCT_IMAGE_DIR = Path(__file__).resolve().parents[2] / "static" / "uploads" / "productos"


class ProductoService:
    """Servicio stateless de productos. La transacción la maneja el UoW."""

    # ── Helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def _build_producto_read(producto: Producto) -> ProductoRead:
        """Construye un ProductoRead desde un modelo Producto.

        Si el producto tiene las relaciones cargadas (categorias),
        extrae los IDs correspondientes.
        """
        categoria_ids = []
        if hasattr(producto, "categorias") and producto.categorias:
            categoria_ids = [c.id for c in producto.categorias]  # type: ignore[union-attr]

        ingrediente_ids = []
        if hasattr(producto, "ingredientes") and producto.ingredientes:
            ingrediente_ids = [i.id for i in producto.ingredientes]  # type: ignore[union-attr]

        return ProductoRead(
            id=producto.id,  # type: ignore[arg-type]
            nombre=producto.nombre,
            descripcion=producto.descripcion,
            precio_base=producto.precio_base,
            stock_cantidad=producto.stock_cantidad,
            disponible=producto.disponible,
            imagen_url=producto.imagen_url,
            created_at=producto.created_at,  # type: ignore[arg-type]
            updated_at=producto.updated_at,  # type: ignore[arg-type]
            categoria_ids=categoria_ids,
            ingrediente_ids=ingrediente_ids,
        )

    @staticmethod
    def _build_producto_detail(
        producto: Producto,
        es_removible_map: Optional[dict[int, bool]] = None,
    ) -> ProductoDetail:
        """Construye un ProductoDetail con relaciones expandidas.

        Args:
            producto: Producto con relaciones categorias e ingredientes cargadas.
            es_removible_map: Dict {ingrediente_id: es_removible} para marcar
                              qué ingredientes son removibles en este producto.
        """
        base = ProductoService._build_producto_read(producto)

        # Mapear categorías
        categorias = []
        if hasattr(producto, "categorias") and producto.categorias:
            for cat in producto.categorias:  # type: ignore[union-attr]
                categorias.append(
                    CategoriaReadRef(
                        id=cat.id,  # type: ignore[arg-type]
                        nombre=cat.nombre,
                    )
                )

        # Mapear ingredientes con es_removible
        ingredientes = []
        if hasattr(producto, "ingredientes") and producto.ingredientes:
            for ing in producto.ingredientes:  # type: ignore[union-attr]
                ing_id = ing.id  # type: ignore[arg-type]
                es_removible = False
                if es_removible_map is not None:
                    es_removible = es_removible_map.get(ing_id, False)

                ingredientes.append(
                    IngredienteReadRef(
                        id=ing_id,
                        nombre=ing.nombre,
                        es_alergeno=ing.es_alergeno,
                        es_removible=es_removible,
                    )
                )

        return ProductoDetail(
            id=base.id,
            nombre=base.nombre,
            descripcion=base.descripcion,
            precio_base=base.precio_base,
            stock_cantidad=base.stock_cantidad,
            disponible=base.disponible,
            imagen_url=base.imagen_url,
            created_at=base.created_at,
            updated_at=base.updated_at,
            categoria_ids=base.categoria_ids,
            ingrediente_ids=base.ingrediente_ids,
            categorias=categorias,
            ingredientes=ingredientes,
        )

    @staticmethod
    async def _load_es_removible(
        uow: UnitOfWork, producto: Producto
    ) -> dict[int, bool]:
        """Carga el mapa es_removible para los ingredientes del producto."""
        producto_id = producto.id  # type: ignore[arg-type]
        return await uow.productos.get_ingrediente_associations(producto_id)

    # ── Validaciones ──────────────────────────────────────────────────────

    @staticmethod
    async def _validate_categorias_exist(
        uow: UnitOfWork, categoria_ids: list[int]
    ) -> None:
        """Valida que todas las categorías existan y estén activas."""
        for cat_id in categoria_ids:
            categoria = await uow.categorias.get_by_id(cat_id)
            if categoria is None or categoria.deleted_at is not None:
                raise NotFoundError(
                    f"La categoría {cat_id} no existe o está eliminada."
                )

    @staticmethod
    async def _validate_ingredientes_exist(
        uow: UnitOfWork, ingredientes: list[IngredienteAsignacion]
    ) -> None:
        """Valida que todos los ingredientes existan y estén activos."""
        for ing in ingredientes:
            ingrediente = await uow.ingredientes.get_by_id(ing.ingrediente_id)
            if ingrediente is None or ingrediente.deleted_at is not None:
                raise NotFoundError(
                    f"El ingrediente {ing.ingrediente_id} no existe o está eliminado."
                )

    # ── Operaciones CRUD ──────────────────────────────────────────────────

    @staticmethod
    async def crear_producto(
        uow: UnitOfWork, data: ProductoCreate
    ) -> ProductoDetail:
        """Crea un nuevo producto con categorías e ingredientes.

        Valida que categorías e ingredientes existan y estén activos,
        luego sincroniza las tablas pivote.
        """
        # Validar unicidad de nombre
        existing = await uow.productos.get_by_nombre(data.nombre)
        if existing is not None:
            raise ConflictError(
                f"Ya existe un producto con el nombre '{data.nombre}'."
            )

        # Validar categorías e ingredientes
        if data.categoria_ids:
            await ProductoService._validate_categorias_exist(
                uow, data.categoria_ids
            )
        if data.ingredientes:
            await ProductoService._validate_ingredientes_exist(
                uow, data.ingredientes
            )

        # Crear producto
        producto = Producto(
            nombre=data.nombre,
            descripcion=data.descripcion,
            precio_base=data.precio_base,
            stock_cantidad=data.stock_cantidad,
            disponible=data.disponible,
            imagen_url=data.imagen_url,
        )
        producto = await uow.productos.create(producto)
        producto_id = producto.id  # type: ignore[arg-type]

        # Sincronizar relaciones
        if data.categoria_ids:
            await uow.productos.sync_categorias(producto_id, data.categoria_ids)
        if data.ingredientes:
            await uow.productos.sync_ingredientes(producto_id, data.ingredientes)

        # Recargar con relaciones
        producto = await uow.productos.get_with_relations(producto_id)
        if producto is None:
            raise RuntimeError("El producto creado no pudo ser recuperado.")

        es_removible_map = await ProductoService._load_es_removible(uow, producto)
        return ProductoService._build_producto_detail(producto, es_removible_map)

    @staticmethod
    async def actualizar_producto(
        uow: UnitOfWork,
        producto_id: int,
        data: ProductoUpdate,
    ) -> ProductoDetail:
        """Actualiza un producto parcialmente con resincronización de relaciones."""
        producto = await uow.productos.get_by_id(producto_id)
        if producto is None or producto.deleted_at is not None:
            raise NotFoundError(f"Producto {producto_id} no encontrado.")

        changed = False

        # Actualizar campos escalares
        if data.nombre is not None and data.nombre != producto.nombre:
            existing = await uow.productos.get_by_nombre(data.nombre)
            if existing is not None and existing.id != producto_id:
                raise ConflictError(
                    f"Ya existe un producto con el nombre '{data.nombre}'."
                )
            producto.nombre = data.nombre
            changed = True

        if data.descripcion is not None and data.descripcion != producto.descripcion:
            producto.descripcion = data.descripcion
            changed = True

        if data.precio_base is not None and data.precio_base != producto.precio_base:
            producto.precio_base = data.precio_base
            changed = True

        if (
            data.stock_cantidad is not None
            and data.stock_cantidad != producto.stock_cantidad
        ):
            producto.stock_cantidad = data.stock_cantidad
            changed = True

        if data.disponible is not None and data.disponible != producto.disponible:
            producto.disponible = data.disponible
            changed = True

        if "imagen_url" in data.model_dump(exclude_unset=True):
            producto.imagen_url = data.imagen_url
            changed = True

        # Sincronizar categorías si se enviaron
        if "categoria_ids" in data.model_dump(exclude_unset=True):
            if data.categoria_ids is not None:
                await ProductoService._validate_categorias_exist(
                    uow, data.categoria_ids
                )
                await uow.productos.sync_categorias(producto_id, data.categoria_ids)
            else:
                # Si se envía explícitamente null → limpiar categorías
                await uow.productos.sync_categorias(producto_id, [])
            changed = True

        # Sincronizar ingredientes si se enviaron
        if "ingredientes" in data.model_dump(exclude_unset=True):
            if data.ingredientes is not None:
                await ProductoService._validate_ingredientes_exist(
                    uow, data.ingredientes
                )
                await uow.productos.sync_ingredientes(
                    producto_id, data.ingredientes
                )
            else:
                await uow.productos.sync_ingredientes(producto_id, [])
            changed = True

        if not changed:
            raise ValidationAppError("No se enviaron campos para actualizar.")

        producto.updated_at = datetime.now(timezone.utc)
        producto = await uow.productos.update(producto)

        # Recargar con relaciones
        producto = await uow.productos.get_with_relations(producto_id)
        if producto is None:
            raise RuntimeError("El producto actualizado no pudo ser recuperado.")

        es_removible_map = await ProductoService._load_es_removible(uow, producto)
        return ProductoService._build_producto_detail(producto, es_removible_map)

    @staticmethod
    async def listar_productos(
        uow: UnitOfWork,
        page: int = 1,
        size: int = 20,
        q: Optional[str] = None,
        categoria_id: Optional[int] = None,
        ingrediente_id: Optional[int] = None,
        precio_min: Optional[float] = None,
        precio_max: Optional[float] = None,
        disponible: Optional[bool] = None,
        sort: str = "created_at",
        order: str = "desc",
        admin: bool = False,
    ) -> ProductoList:
        """Lista productos con filtros combinados y paginación.

        En modo admin incluye productos no disponibles.
        En modo público solo productos disponibles.
        """
        items, total = await uow.productos.list_paginated(
            page=page,
            size=size,
            q=q,
            categoria_id=categoria_id,
            ingrediente_id=ingrediente_id,
            precio_min=precio_min,
            precio_max=precio_max,
            disponible=disponible,
            sort=sort,
            order=order,
            admin=admin,
        )

        reads = [
            ProductoService._build_producto_read(p) for p in items
        ]
        pages = max(1, ceil(total / size))

        return ProductoList(
            items=reads,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    @staticmethod
    async def obtener_producto(
        uow: UnitOfWork,
        producto_id: int,
        admin: bool = False,
    ) -> ProductoDetail:
        """Obtiene un producto con relaciones expandidas.

        En modo público verifica que esté disponible.
        En modo admin permite ver cualquier producto (incluyendo no disponible).
        """
        if admin:
            producto = await uow.productos.get_by_id_admin(producto_id)
        else:
            producto = await uow.productos.get_with_relations(producto_id)

        if producto is None or producto.deleted_at is not None:
            raise NotFoundError(f"Producto {producto_id} no encontrado.")

        if not admin and not producto.disponible:
            raise NotFoundError(f"Producto {producto_id} no encontrado.")

        es_removible_map = await ProductoService._load_es_removible(uow, producto)
        return ProductoService._build_producto_detail(producto, es_removible_map)

    @staticmethod
    async def eliminar_producto(uow: UnitOfWork, producto_id: int) -> None:
        """Elimina lógicamente un producto (soft delete)."""
        producto = await uow.productos.get_by_id(producto_id)
        if producto is None or producto.deleted_at is not None:
            raise NotFoundError(f"Producto {producto_id} no encontrado.")

        await uow.productos.soft_delete(producto)

    @staticmethod
    async def actualizar_stock(
        uow: UnitOfWork,
        producto_id: int,
        stock_cantidad: int,
    ) -> ProductoDetail:
        """Actualiza el stock de un producto."""
        if stock_cantidad < 0:
            raise ValidationAppError("El stock no puede ser negativo.")

        producto = await uow.productos.get_by_id(producto_id)
        if producto is None or producto.deleted_at is not None:
            raise NotFoundError(f"Producto {producto_id} no encontrado.")

        producto.updated_at = datetime.now(timezone.utc)
        await uow.productos.update_stock(producto_id, stock_cantidad)

        # Recargar con relaciones
        producto = await uow.productos.get_with_relations(producto_id)
        if producto is None:
            raise RuntimeError("El producto actualizado no pudo ser recuperado.")

        es_removible_map = await ProductoService._load_es_removible(uow, producto)
        return ProductoService._build_producto_detail(producto, es_removible_map)

    @staticmethod
    async def actualizar_disponibilidad(
        uow: UnitOfWork,
        producto_id: int,
        disponible: bool,
    ) -> ProductoDetail:
        """Actualiza la disponibilidad de un producto."""
        producto = await uow.productos.get_by_id(producto_id)
        if producto is None or producto.deleted_at is not None:
            raise NotFoundError(f"Producto {producto_id} no encontrado.")

        producto.updated_at = datetime.now(timezone.utc)
        await uow.productos.update_disponibilidad(producto_id, disponible)

        # Recargar con relaciones
        producto = await uow.productos.get_with_relations(producto_id)
        if producto is None:
            raise RuntimeError("El producto actualizado no pudo ser recuperado.")

        es_removible_map = await ProductoService._load_es_removible(uow, producto)
        return ProductoService._build_producto_detail(producto, es_removible_map)

    @staticmethod
    async def guardar_imagen_producto(file: UploadFile, base_url: str) -> str:
        """Guarda una imagen de producto y retorna una URL absoluta."""
        suffix = ALLOWED_IMAGE_CONTENT_TYPES.get(file.content_type or "")
        if suffix is None:
            raise ValidationAppError("La imagen debe ser JPG, PNG, WEBP, GIF o AVIF.")

        content = await file.read()
        if not content:
            raise ValidationAppError("La imagen no puede estar vacia.")
        if len(content) > MAX_PRODUCT_IMAGE_BYTES:
            raise ValidationAppError("La imagen no puede superar 1 MB.")

        PRODUCT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4().hex}{suffix}"
        path = PRODUCT_IMAGE_DIR / filename
        path.write_bytes(content)

        relative_url = f"/static/uploads/productos/{filename}"
        return f"{base_url.rstrip('/')}{relative_url}"
