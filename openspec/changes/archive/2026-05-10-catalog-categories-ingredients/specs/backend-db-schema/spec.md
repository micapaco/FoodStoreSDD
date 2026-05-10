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
