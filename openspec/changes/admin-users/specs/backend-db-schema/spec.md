## ADDED Requirements

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
