## ADDED Requirements

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
