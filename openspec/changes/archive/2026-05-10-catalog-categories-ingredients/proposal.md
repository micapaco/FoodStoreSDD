## Why

El catálogo de productos necesita una estructura jerárquica de categorías y un registro de ingredientes con alérgenos antes de poder implementar productos. Sin categorías no hay navegación, sin ingredientes no hay personalización de pedidos ni badges de alérgenos en UI. Este cambio sienta las bases del dominio de catálogo.

## What Changes

- **CRUD de categorías jerárquicas** con validación anti-ciclos (CTE recursiva), soft delete seguro, endpoint público de árbol y endpoints ADMIN
- **CRUD de ingredientes** con flag `es_alergeno`, soft delete, endpoints públicos y ADMIN
- **Modelos SQLModel**: `Categoria`, `Ingrediente` con sus relaciones
- **Schemas Pydantic**: Create/Update/Read separados para cada entidad
- **Seed data**: categorías base e ingredientes comunes precargados
- **No incluye**: relaciones producto-categoría ni producto-ingrediente (eso es change 08)

## Capabilities

### New Capabilities
- `categorias-api`: CRUD de categorías jerárquicas con CTE recursiva, soft delete, validación anti-ciclos
- `ingredientes-api`: CRUD de ingredientes con flag es_alergeno, soft delete
- `catalog-api`: Catálogo público base - endpoint de árbol de categorías + listado de ingredientes

### Modified Capabilities
- `backend-db-schema`: Nuevas tablas Categoria, Ingrediente en el ERD v5
- `backend-db-seed`: Seed de categorías base e ingredientes comunes

## Impact

- **Modelos**: Nuevos `app/modules/categorias/model.py` y `app/modules/ingredientes/model.py`
- **Migraciones**: Nueva migration con tablas Categoria e Ingrediente
- **Routers**: `/api/v1/categorias` y `/api/v1/ingredientes` con endpoints públicos y protegidos
- **Seed**: Actualizar `app/db/seed.py` con categorías jerárquicas e ingredientes
- **RBAC**: Categorías e ingredientes: ADMIN/STOCK crean/editan/eliminan, CLIENT solo lectura
- **Frontend**: No se toca en este change — solo backend
