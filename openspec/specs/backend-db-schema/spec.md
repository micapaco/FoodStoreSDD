## Purpose
Database schema requirements for Food Store — defines table structures, indexes, constraints, and migrations for all entities. Each requirement maps to one or more Alembic migrations.
## Requirements
### Requirement: Categoria table
The system SHALL store categories in a `categoria` table with hierarchical self-reference.
Category names SHALL be unique only among active rows (`deleted_at IS NULL`) using a case-insensitive, trimmed comparison.
Soft-deleted categories SHALL remain historical records and SHALL NOT prevent creating a new active category with the same normalized name.

#### Scenario: Categoria table structure
- **WHEN** the category schema migration is applied
- **THEN** the database SHALL contain a `categoria` table with columns: `id` (PK), `nombre` (VARCHAR(100), NN), `parent_id` (FK -> categoria.id, nullable), `deleted_at` (TIMESTAMPTZ, nullable), `created_at` (TIMESTAMPTZ, NN), `updated_at` (TIMESTAMPTZ, NN)
- **AND** `categoria.nombre` SHALL NOT have a global unique constraint

#### Scenario: Active category name uniqueness
- **WHEN** the category active-name migration is applied
- **THEN** the database SHALL enforce a unique partial index equivalent to `UNIQUE(lower(btrim(nombre))) WHERE deleted_at IS NULL`

#### Scenario: Soft-deleted category name can be reused
- **WHEN** a row exists with `nombre='Entradas'` and `deleted_at IS NOT NULL`
- **THEN** the database SHALL allow inserting a new row with normalized name `entradas` and `deleted_at IS NULL`

#### Scenario: Self-referential FK
- **WHEN** a category references a parent
- **THEN** `parent_id` SHALL reference an existing active category

### Requirement: Ingrediente table
The system SHALL store ingredients in an `ingrediente` table.

#### Scenario: Ingrediente table structure
- **WHEN** the migration `XXXX_add_categoria_ingrediente` is applied
- **THEN** the database SHALL contain an `ingrediente` table with columns: `id` (PK serial), `nombre` (VARCHAR(100), UQ, NN), `es_alergeno` (BOOLEAN, NN, default false), `deleted_at` (TIMESTAMPTZ, nullable), `created_at` (TIMESTAMPTZ, NN), `updated_at` (TIMESTAMPTZ, NN)

---

### Requirement: Producto table indexes
The system SHALL create composite indexes on the `producto` table for query performance.

#### Scenario: Product search indexes
- **WHEN** the migration `0005_add_producto_indexes` is applied
- **THEN** the database SHALL contain a GIN trigram index on `producto.nombre` and `producto.descripcion` for ILIKE search
- **THEN** the database SHALL contain a composite index on `(disponible, deleted_at)` for catalog queries
- **THEN** the database SHALL contain an index on `precio_base` for price range filtering

---

### Requirement: Pedido conserva snapshot de direccion
El esquema de base de datos SHALL permitir persistir un snapshot inmutable de la direccion de entrega usada al crear un pedido.

#### Scenario: Columna direccion_snapshot
- **WHEN** se aplica la migracion de `order-creation`
- **THEN** la tabla `pedido` contiene la columna `direccion_snapshot` como `JSONB NULL`

#### Scenario: Columna notas
- **WHEN** se aplica la migracion de `order-creation`
- **THEN** la tabla `pedido` contiene la columna `notas` como `TEXT NULL`

#### Scenario: Pedido con entrega
- **WHEN** un pedido se crea con `direccion_id` no nulo
- **THEN** `direccion_snapshot` guarda los datos completos necesarios para reconstruir la direccion historica

#### Scenario: Pedido con retiro en local
- **WHEN** un pedido se crea con `direccion_id=NULL`
- **THEN** `direccion_snapshot` queda `NULL`

---

### Requirement: Campo activo en tabla usuario
The system SHALL add an `activo` column to the `usuario` table via an Alembic migration.
The column SHALL be `BOOLEAN NOT NULL DEFAULT TRUE`.
All existing rows MUST be backfilled to `TRUE` atomically as part of the migration.

#### Scenario: Migración aplicada
- **WHEN** the migration `add_activo_to_usuario` is applied
- **THEN** the `usuario` table contains column `activo BOOLEAN NOT NULL DEFAULT TRUE`
- **THEN** all pre-existing rows have `activo = TRUE`

#### Scenario: Nuevo usuario creado
- **WHEN** a new user registers via `POST /api/v1/auth/register`
- **THEN** the `activo` field defaults to `TRUE` without requiring it in the request body

#### Scenario: Rollback de migración
- **WHEN** `alembic downgrade -1` is executed
- **THEN** the `activo` column is removed from `usuario` without data loss in other columns

### Requirement: Tabla configuracion
The system SHALL add a `configuracion` table to store operational system parameters as key-value pairs.
Schema: `clave VARCHAR(100) PRIMARY KEY`, `valor TEXT NOT NULL`, `updated_by_id BIGINT FK → usuario.id NULLABLE`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
The table SHALL be seeded with three initial rows: `costo_envio_base = "50.00"`, `pedidos_habilitados = "true"`, `mensaje_sistema = ""`.

#### Scenario: Migración aplicada
- **WHEN** the migration `add_configuracion_table` is applied
- **THEN** the database contains the `configuracion` table with the three seeded rows

#### Scenario: Rollback de migración
- **WHEN** `alembic downgrade -1` is executed
- **THEN** the `configuracion` table is dropped without affecting other tables

### Requirement: Pedido detalle personalization snapshot
The system SHALL store a readable snapshot of excluded ingredients for each order detail when product personalization is used.

#### Scenario: Personalization snapshot column
- **WHEN** the personalization snapshot migration is applied
- **THEN** the `detalle_pedido` table contains `personalizacion_snapshot JSONB NULL`

#### Scenario: Snapshot preserves ingredient names
- **WHEN** a new order detail is created with excluded ingredients
- **THEN** `personalizacion_snapshot` stores the excluded ingredient IDs and names as they were known at order creation time

