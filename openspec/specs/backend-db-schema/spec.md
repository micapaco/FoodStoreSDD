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
