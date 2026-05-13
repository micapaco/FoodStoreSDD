## MODIFIED Requirements

### Requirement: Category CRUD
The system SHALL allow ADMIN and STOCK users to create, read, update, and soft-delete categories.
The system SHALL persist category timestamps with values compatible with the configured PostgreSQL column types.

#### Scenario: Create category
- **WHEN** an ADMIN sends `POST /api/v1/categorias` with valid `nombre` and optional `parent_id`
- **THEN** the system returns `201 Created` with the created category
- **AND** the response includes valid `created_at` and `updated_at` values

#### Scenario: Create category with invalid parent
- **WHEN** an ADMIN sends `POST /api/v1/categorias` with a `parent_id` that does not exist or is soft-deleted
- **THEN** the system returns `422 Unprocessable Entity` with validation error

#### Scenario: List categories (paginated)
- **WHEN** any user sends `GET /api/v1/categorias`
- **THEN** the system returns `200 OK` with a paginated list of active categories

#### Scenario: Get category by ID
- **WHEN** any user sends `GET /api/v1/categorias/{id}`
- **THEN** the system returns `200 OK` with the category and its children

#### Scenario: Update category
- **WHEN** an ADMIN sends `PUT /api/v1/categorias/{id}` with updated fields
- **THEN** the system returns `200 OK` with the updated category
- **AND** the response includes a valid `updated_at` value

#### Scenario: Update creates circular hierarchy
- **WHEN** an ADMIN sends `PUT /api/v1/categorias/{id}` setting `parent_id` to a descendant of the current node
- **THEN** the system returns `422 Unprocessable Entity` with code "CIRCULAR_REFERENCE"

#### Scenario: Soft-delete category
- **WHEN** an ADMIN sends `DELETE /api/v1/categorias/{id}`
- **THEN** the system returns `204 No Content` and the category is soft-deleted

#### Scenario: Delete non-existent category
- **WHEN** an ADMIN sends `DELETE /api/v1/categorias/{id}` with an invalid ID
- **THEN** the system returns `404 Not Found`

#### Scenario: Unauthenticated CRUD attempt
- **WHEN** a request without valid JWT sends any CRUD operation
- **THEN** the system returns `401 Unauthorized`

#### Scenario: CLIENT cannot create/edit/delete categories
- **WHEN** a CLIENT user sends POST, PUT, or DELETE on categories
- **THEN** the system returns `403 Forbidden`

### Requirement: Category schema
The system SHALL accept the following fields for category operations:
- `nombre`: string, required, 1-100 chars, unique
- `parent_id`: integer, optional, must reference an active non-deleted category

#### Scenario: CategoryRead response shape
- **WHEN** the system returns category data
- **THEN** the response SHALL contain `{ id, nombre, parent_id, children, created_at, updated_at }`
- **AND** the response SHALL NOT include `deleted_at` for active categories
