## ADDED Requirements

### Requirement: Ingredient CRUD
The system SHALL allow ADMIN and STOCK users to create, read, update, and soft-delete ingredients.

#### Scenario: Create ingredient
- **WHEN** an ADMIN sends `POST /api/v1/ingredientes` with valid `nombre` and optional `es_alergeno`
- **THEN** the system returns `201 Created` with the created ingredient

#### Scenario: Create ingredient duplicate name
- **WHEN** an ADMIN sends `POST /api/v1/ingredientes` with a `nombre` that already exists
- **THEN** the system returns `409 Conflict` with detail "El ingrediente ya existe"

#### Scenario: List ingredients (paginated)
- **WHEN** any user sends `GET /api/v1/ingredientes`
- **THEN** the system returns `200 OK` with a paginated list of active ingredients

#### Scenario: Get ingredient by ID
- **WHEN** any user sends `GET /api/v1/ingredientes/{id}`
- **THEN** the system returns `200 OK` with the ingredient details

#### Scenario: Update ingredient
- **WHEN** an ADMIN sends `PUT /api/v1/ingredientes/{id}` with updated fields
- **THEN** the system returns `200 OK` with the updated ingredient

#### Scenario: Soft-delete ingredient
- **WHEN** an ADMIN sends `DELETE /api/v1/ingredientes/{id}`
- **THEN** the system returns `204 No Content` and the ingredient is soft-deleted (deleted_at set)

#### Scenario: Delete non-existent ingredient
- **WHEN** an ADMIN sends `DELETE /api/v1/ingredientes/{id}` with an invalid ID
- **THEN** the system returns `404 Not Found`

#### Scenario: Unauthenticated CRUD attempt
- **WHEN** a request without valid JWT sends any CRUD operation
- **THEN** the system returns `401 Unauthorized`

#### Scenario: CLIENT cannot create/edit/delete ingredients
- **WHEN** a CLIENT user sends POST, PUT, or DELETE on ingredients
- **THEN** the system returns `403 Forbidden`

---

### Requirement: List allergens
The system SHALL allow filtering ingredients by allergen status.

#### Scenario: List only allergens
- **WHEN** any user sends `GET /api/v1/ingredientes?alergeno=true`
- **THEN** the system returns `200 OK` with only ingredients where `es_alergeno` is true

---

### Requirement: Ingredient schema
The system SHALL accept the following fields for ingredient operations:
- `nombre`: string, required, 1-100 chars, unique
- `es_alergeno`: boolean, optional, defaults to false

#### Scenario: IngredientRead response shape
- **WHEN** the system returns ingredient data
- **THEN** the response SHALL contain `{ id, nombre, es_alergeno, created_at, updated_at }` and SHALL NOT include `deleted_at` for active ingredients
