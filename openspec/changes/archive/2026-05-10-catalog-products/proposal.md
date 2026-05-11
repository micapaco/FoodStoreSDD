## Why

El sistema Food Store necesita gestionar su catálogo de productos como entidad central del negocio. Sin productos no hay carrito, pedidos ni facturación. Este change completa el dominio de catálogo comenzado en `catalog-categories-ingredients` (change 07), agregando CRUD completo de productos con relaciones a categorías e ingredientes, control de stock, disponibilidad, y las vistas de gestión para roles ADMIN/STOCK, más el catálogo público con filtros y búsqueda.

## What Changes

### Backend — Nuevo módulo `productos`
- **CRUD completo** de productos (`POST/GET/PUT/PATCH/DELETE`) con soft delete
- **Relaciones N:M** con categorías (`ProductoCategoria`) e ingredientes (`ProductoIngrediente`)
- **Control de stock**: campo `stock_cantidad` con CHECK >= 0, toggle `disponible`
- **Filtros y búsqueda**: por categoría, ingrediente, rango de precio, disponibilidad, texto libre (nombre + descripción)
- **Paginación** con página/tamaño y total de registros
- **Rutas protegidas** por rol: ADMIN (full CRUD), STOCK (stock + disponible), CLIENT (lectura pública)
- **Catálogo público**: endpoint `GET /api/v1/productos` con filtros, sin requerir autenticación
- **Detalle público**: `GET /api/v1/productos/{id}` con categorías e ingredientes expandidos
- **Seed data**: productos de ejemplo con mezcla de categorías e ingredientes

### Frontend — Gestión de productos
- **ProductosPage**: listado con tabla, paginación, búsqueda y filtros por categoría/disponibilidad/stock
- **ProductosCreatePage / ProductosEditPage**: formulario con selection de categorías (árbol) e ingredientes
- **ProductosDetailPage**: detalle del producto con categorías, ingredientes y estado de stock
- **Stock management**: toggle rápido de `disponible` y edición inline de `stock_cantidad` para rol STOCK
- **Catálogo público** (página pública para CLIENT): grid de productos con filtros y búsqueda

### Infraestructura
- **Migration** `0005_add_producto_fields`: agregar índices compuestos para búsqueda y filtros sobre `producto`
- **Router registrado** en `backend/app/main.py` bajo `/api/v1/productos`

## Capabilities

### New Capabilities
- `productos-api`: API CRUD de productos con relaciones, stock, filtros, paginación y control por rol
- `productos-frontend`: UI de gestión de productos para ADMIN/STOCK + catálogo público para CLIENT

### Modified Capabilities
- `catalog-api`: se expande con endpoints públicos de productos (`GET /api/v1/productos`)
- `backend-db-schema`: se agregan índices compuestos via migration `0005`
- `backend-db-seed`: se agregan productos de ejemplo con relaciones
- `auth-rbac`: los permisos declarados para `/api/v1/productos` pasan de "listed for completeness" a implementados

## Impact

- **Backend**: nuevo módulo `backend/app/modules/productos/` (model, schemas, repository, service, router)
- **Base de datos**: migration `0005` con índices en `producto` (nombre, precio_base, disponible, deleted_at)
- **Frontend**: nuevas páginas en `frontend/src/pages/productos/`, features en `frontend/src/features/productos/`
- **Seed**: actualización de `backend/app/db/seed.py` con productos, ProductoCategoria y ProductoIngrediente
- **Router global**: registro del nuevo router de productos en `main.py`
- **Dependencias**: `catalog-categories-ingredients` ✅ ya archivado. `frontend-shell` ✅ ya archivado.
