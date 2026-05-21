## MODIFIED Requirements

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

## MODIFIED Requirements

### Requirement: Pedido detalle personalization snapshot
The system SHALL store a readable snapshot of excluded ingredients for each order detail when product personalization is used.

#### Scenario: Personalization snapshot column
- **WHEN** the personalization snapshot migration is applied
- **THEN** the `detalle_pedido` table contains `personalizacion_snapshot JSONB NULL`

#### Scenario: Snapshot preserves ingredient names
- **WHEN** a new order detail is created with excluded ingredients
- **THEN** `personalizacion_snapshot` stores the excluded ingredient IDs and names as they were known at order creation time
