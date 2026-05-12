## ADDED Requirements

### Requirement: Categoria table
The system SHALL store categories in a `categoria` table with hierarchical self-reference.

#### Scenario: Categoria table structure
- **WHEN** the migration `XXXX_add_categoria_ingrediente` is applied
- **THEN** the database SHALL contain a `categoria` table with columns: `id` (PK serial), `nombre` (VARCHAR(100), UQ, NN), `categoria_padre_id` (FK → categoria.id, nullable), `deleted_at` (TIMESTAMPTZ, nullable), `created_at` (TIMESTAMPTZ, NN), `updated_at` (TIMESTAMPTZ, NN)

#### Scenario: Self-referential FK
- **WHEN** a category references a parent
- **THEN** `categoria_padre_id` SHALL reference an existing `categoria.id` with `deleted_at IS NULL`

---

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
