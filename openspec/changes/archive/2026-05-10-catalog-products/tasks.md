## 1. Backend — Módulo productos: modelo y schemas

- [x] 1.1 Crear `backend/app/modules/productos/__init__.py`
- [x] 1.2 Crear `backend/app/modules/productos/schemas.py` con ProductoCreate, ProductoUpdate, ProductoRead, ProductoDetail (categorías+ingredientes expandidos), ProductoStockUpdate, los schemas de request con `categoria_ids: list[int]` e `ingrediente_ids: list[IngredienteAsignacion]`
- [x] 1.3 Verificar que los modelos `Producto`, `ProductoCategoria`, `ProductoIngrediente` ya existen en `backend/app/db/models/catalogo.py` y agregar relaciones many-to-many

## 2. Backend — Repositorio de productos

- [x] 2.1 Crear `backend/app/modules/productos/repository.py` con `ProductoRepository(BaseRepository[Producto])`
- [x] 2.2 Implementar `list_paginated()` con filtros por texto (ILIKE), categoría_id, ingrediente_id, precio_min/precio_max, disponible, sort/order
- [x] 2.3 Implementar `get_with_relations()` que cargue categorías e ingredientes del producto
- [x] 2.4 Implementar `sync_categorias()` para sincronizar ProductoCategoria (evitar duplicados, remover no incluidas)
- [x] 2.5 Implementar `sync_ingredientes()` para sincronizar ProductoIngrediente con es_removible
- [x] 2.6 Implementar `update_stock()` con validación >= 0
- [x] 2.7 Implementar `update_disponibilidad()` toggle

## 3. Backend — Service de productos

- [x] 3.1 Crear `backend/app/modules/productos/service.py`
- [x] 3.2 Implementar `crear_producto()`: validar categorías/ingredientes existentes, crear producto, sincronizar relaciones
- [x] 3.3 Implementar `actualizar_producto()`: actualizar datos + resincronizar relaciones
- [x] 3.4 Implementar `listar_productos()` con filtros combinados (admin: todos, público: solo disponibles)
- [x] 3.5 Implementar `obtener_producto()` con relaciones expandidas
- [x] 3.6 Implementar `eliminar_producto()` soft delete
- [x] 3.7 Implementar `actualizar_stock()` y `actualizar_disponibilidad()`

## 4. Backend — Router de productos

- [x] 4.1 Crear `backend/app/modules/productos/router.py` con router prefix `/api/v1/productos`
- [x] 4.2 Endpoints protegidos ADMIN: `POST /`, `GET /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`
- [x] 4.3 Endpoints protegidos ADMIN/STOCK: `PATCH /{id}/stock`, `PATCH /{id}/disponibilidad`
- [x] 4.4 Endpoints públicos (sin auth): `GET /`, `GET /{id}` (solo disponible=true)
- [x] 4.5 Response_model, tags, status codes correctos por endpoint

## 5. Backend — Migration y seed

- [x] 5.1 Crear migration `0005_add_producto_indexes` con índice GIN trigrama en nombre/descripción, índice compuesto (disponible, deleted_at), índice en precio_base
- [x] 5.2 Agregar seed de productos en `backend/app/db/seed.py` con 6 productos, categorías e ingredientes asignados
- [x] 5.3 Verificar que seed es idempotente (upsert por nombre o skip)

## 6. Backend — Registro del router

- [x] 6.1 Registrar `productos.router` en `backend/app/api/v1/__init__.py` bajo `/api/v1`
- [x] 6.2 Verificar que el módulo `productos` se importa correctamente (sin circular imports) — importa desde app.core.uow, app.db.models.catalogo, app.core.deps (todos existentes)

## 7. Frontend — API layer y types

- [x] 7.1 Crear tipos en `frontend/src/entities/productos/types.ts`: Producto, ProductoCreate, ProductoUpdate, ProductoFilters, ProductoPage
- [x] 7.2 Crear API layer en `frontend/src/shared/api/productos.ts` con funciones createProducto, getProductos, getProducto, updateProducto, deleteProducto, updateStock, updateDisponibilidad
- [x] 7.3 Crear hooks TanStack Query en `frontend/src/features/productos/hooks/useProductos.ts`: useProductos(filters), useProducto(id), useCreateProducto, useUpdateProducto, useDeleteProducto, useUpdateStock, useUpdateDisponibilidad
- [x] 7.4 Configurar queryKeys y staleTime (30s para productos)

## 8. Frontend — Páginas de gestión de productos (ADMIN/STOCK)

- [x] 8.1 Crear `ProductosPage` en `frontend/src/pages/productos/ProductosPage.tsx` con tabla paginada, filtros (texto, categoría, disponible, stock bajo), columna de acciones
- [x] 8.2 Crear `ProductosCreatePage` en `frontend/src/pages/productos/ProductosCreatePage.tsx` con formulario: nombre, descripción, precio_base, stock, disponible, selector de categorías (árbol), selector de ingredientes con es_removible
- [x] 8.3 Crear `ProductosEditPage` en `frontend/src/pages/productos/ProductosEditPage.tsx` con formulario precargado
- [x] 8.4 Crear `ProductosDetailPage` en `frontend/src/pages/productos/ProductosDetailPage.tsx` con detalle expandido: categorías (badges), ingredientes (badge alérgeno + removible)
- [x] 8.5 Agregar modal de confirmación para soft delete
- [x] 8.6 Agregar controles inline de stock (solo STOCK/ADMIN) en la tabla

## 9. Frontend — Catálogo público

- [x] 9.1 Crear `CatalogoPage` en `frontend/src/pages/productos/CatalogoPage.tsx` con grid de tarjetas de producto
- [x] 9.2 Crear tarjeta de producto: nombre, precio, badges de categorías, indicador de alérgenos, imagen placeholder
- [x] 9.3 Agregar filtros públicos: búsqueda por texto, categoría (select), rango de precio
- [x] 9.4 Crear `ProductoDetallePage` pública en `frontend/src/pages/productos/ProductoDetallePage.tsx` con detalle completo y botón "Agregar al carrito" (placeholder)

## 10. Frontend — Routing y estados

- [x] 10.1 Registrar rutas protegidas `/admin/productos`, `/admin/productos/nuevo`, `/admin/productos/{id}`, `/admin/productos/{id}/editar`
- [x] 10.2 Registrar ruta pública `/productos` y `/productos/{id}`
- [x] 10.3 Implementar estados vacío, loading skeleton y error con reintento en todas las páginas
