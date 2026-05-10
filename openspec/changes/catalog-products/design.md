## Context

El módulo `productos` completa el dominio de catálogo de Food Store. Actualmente existen:
- Modelos `Producto`, `ProductoCategoria` y `ProductoIngrediente` en `backend/app/db/models/catalogo.py` (creados en change 02 infra-database con ERD v5)
- Relación N:M con `Categoria` vía `ProductoCategoria` (con `es_principal`)
- Relación N:M con `Ingrediente` vía `ProductoIngrediente` (con `es_removible`)
- Módulos `categorias` e `ingredientes` completos con repositorios, servicios y routers (change 07)
- Frontend con Feature-Sliced Design, Zustand, TanStack Query y shell operativo (changes 03-06)

Lo que falta implementar: el módulo feature `productos` completo (backend + frontend) con CRUD, control de stock, filtros, búsqueda y visibilidad por roles.

## Goals / Non-Goals

**Goals:**
- Módulo backend `productos` con capas: model → repository → service → router
- CRUD completo con soft delete, control de stock y disponibilidad
- Relaciones con categorías e ingredientes (asignación desde el producto)
- Endpoints públicos con filtros, búsqueda y paginación
- Endpoints protegidos por rol (ADMIN: full CRUD, STOCK: stock+disponible)
- Frontend: páginas de gestión (listado, creación, edición, detalle)
- Frontend: catálogo público con grid, filtros y búsqueda
- Seed data con productos de ejemplo

**Non-Goals:**
- Carrito (change 10) — usa productos pero es feature separada
- Precios con descuento o promociones — fuera del alcance v5.0
- Variantes de producto (talle, color) — no existen en ERD v5
- Imágenes de producto — fuera del alcance v5.0
- Exportación CSV — se agrega si sobra tiempo, no es requisito

## Decisions

### 1. Reutilizar modelos existentes vs. modelo propio en módulo
**Decisión:** Mantener `Producto`, `ProductoCategoria` y `ProductoIngrediente` en `models/catalogo.py` (no moverlos al módulo)
**Rationale:** Los modelos ya existen en `catalogo.py` desde change 02. Moverlos rompe imports existentes y no aporta valor. El módulo `productos/` los importa y los usa. Esto sigue el patrón de `categorias` e `ingredientes` que también importan desde `models/catalogo.py`.

### 2. Búsqueda: ILIKE vs FTS (PostgreSQL Full-Text Search)
**Decisión:** `ILIKE` sobre `nombre` y `descripcion` con índices `gin_trgm` (pg_trgm)
**Rationale:** FTS requiere agregar `tsvector` y triggers, lo que es overkill para el volumen esperado. `ILIKE` con trigramas da buena performance con índices GIN y es mucho más simple de implementar y mantener. Si en el futuro hay problemas de performance, se migra a FTS.

### 3. Filtro por categoría: por ID directo vs. sub-árbol
**Decisión:** Filtrar por `categoria_id` directo (no expandir sub-árbol)
**Rationale:** Por ahora el requisito es filtro simple. El árbol no es profundo (máx 2-3 niveles). Expandir a sub-árbol agrega complejidad innecesaria a las queries (CTE recursiva por cada filtro). Se puede agregar después si es necesario.

### 4. Asignación de categorías/ingredientes: endpoints separados vs. embebido en producto
**Decisión:** Embebido en los schemas Create/Update del producto, con arrays de IDs
**Rationale:** Es más simple para el frontend mandar un solo request con los IDs de categorías e ingredientes. El service se encarga de sincronizar las tablas pivote (ProductoCategoria, ProductoIngrediente). Esto sigue el principio de "agregado" de DDD: el producto es el aggregate root y las relaciones son parte de él.

### 5. Frontend: Feature-Sliced Design
**Decisión:** `features/productos/` con hooks (useProductos, useProductoMutations), API layer, y tipos. Las páginas en `pages/productos/`. Componentes compartidos tipados en `shared/`.
**Rationale:** Consistente con la arquitectura existente del frontend. Separa responsabilidades y permite reutilización.

### 6. Catálogo público vs. gestión separados en frontend
**Decisión:** Dos vistas separadas: `CatalogoPage` (pública, grid estilo tienda) y `ProductosPage` (admin, tabla con controles de stock)
**Rationale:** Son audiencias y UX completamente distintas. El cliente quiere ver tarjetas visuales; el admin quiere tabla con datos y acciones. Mezclarlos en una sola página complica ambos casos de uso.

## Risks / Trade-offs

- **[Riesgo]** Las tablas pivote `ProductoCategoria` y `ProductoIngrediente` no tienen soft delete → si se desasigna y asigna repetidamente, no hay historial. **Mitigación:** No es necesario para este change. Las relaciones actuales son las vigentes; el histórico no es requisito.
- **[Riesgo]** Búsqueda ILIKE puede ser lenta con muchos productos (>10K). **Mitigación:** Índice GIN trigrama en `nombre` y `descripcion`. Si escala, migrar a FTS.
- **[Riesgo]** Asignación masiva de categorías/ingredientes en un solo request puede dar timeouts. **Mitigación:** El volumen típico es bajo (5-10 items). Si crece, se puede paginar la asignación.
- **[Riesgo]** Cross-domain (backend + frontend) requiere coordinación del contrato API. **Mitigación:** Backend define contrato primero. Frontend consume sobre el contrato definido.
