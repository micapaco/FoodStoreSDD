## Purpose

Define el contrato API para listar y administrar ingredientes del catalogo, incluyendo el flag de alergenos y las operaciones protegidas para `ADMIN` y `STOCK`.
## Requirements
### Requirement: Ingredient CRUD
The system SHALL allow ADMIN and STOCK users to create, read, update, and soft-delete ingredients.

#### Scenario: Search ingredients by name
- **WHEN** any user sends `GET /api/v1/ingredientes?q=queso&page=1&size=20`
- **THEN** the system returns `200 OK` with only active ingredients whose `nombre` contains `queso` case-insensitively
- **AND** `total`, `page`, `size`, and `pages` reflect the filtered result

#### Scenario: Search ingredients with allergen filter
- **WHEN** any user sends `GET /api/v1/ingredientes?q=mani&alergeno=true&page=1&size=20`
- **THEN** the system returns `200 OK` with active ingredients matching both the name search and allergen filter

### Requirement: List allergens
The system SHALL allow filtering ingredients by allergen status.

#### Scenario: List only allergens
- **WHEN** any user sends `GET /api/v1/ingredientes?alergeno=true`
- **THEN** the system returns `200 OK` with only ingredients where `es_alergeno` is true

### Requirement: Ingredient schema
The system SHALL accept the following fields for ingredient operations:
- `nombre`: string, required, 1-100 chars, unique
- `es_alergeno`: boolean, optional, defaults to false

#### Scenario: IngredientRead response shape
- **WHEN** the system returns ingredient data
- **THEN** the response SHALL contain `{ id, nombre, es_alergeno, created_at, updated_at }` and SHALL NOT include `deleted_at` for active ingredients
