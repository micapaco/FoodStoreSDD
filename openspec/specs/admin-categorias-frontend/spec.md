# admin-categorias-frontend Specification

## Purpose
TBD - created by archiving change admin-categories-ui. Update Purpose after archive.
## Requirements
### Requirement: Categories admin page replaces placeholder
The system SHALL provide a functional `CategoriesAdminPage` at `/admin/categorias` for ADMIN users.
The page SHALL consume the existing categories API contract and SHALL NOT invent backend fields or endpoints.

#### Scenario: Admin sees category management page
- **WHEN** an ADMIN navigates to `/admin/categorias`
- **THEN** the page displays category management controls instead of placeholder text

#### Scenario: Loading categories
- **WHEN** category data is loading
- **THEN** the page displays a loading state

#### Scenario: Empty category list
- **WHEN** the categories list is empty
- **THEN** the page displays an empty state with an action to create a category

---

### Requirement: Category create and edit form
The system SHALL allow ADMIN users to create categories and edit existing categories using fields compatible with backend schemas: `nombre` and `parent_id`.

#### Scenario: Create root category
- **WHEN** an ADMIN submits a valid name with no parent
- **THEN** the frontend calls `POST /api/v1/categorias` with `{ nombre, parent_id: null }`
- **THEN** the list refreshes and a success toast is shown

#### Scenario: Create child category
- **WHEN** an ADMIN selects a parent category and submits a valid name
- **THEN** the frontend calls `POST /api/v1/categorias` with the selected `parent_id`

#### Scenario: Edit category
- **WHEN** an ADMIN edits a category name or parent
- **THEN** the frontend calls `PUT /api/v1/categorias/{id}` with changed fields
- **THEN** category queries are invalidated after success

#### Scenario: Prevent obvious self-parent selection
- **WHEN** an ADMIN edits a category
- **THEN** the parent selector does not offer the category itself as parent
- **THEN** backend anti-cycle validation remains the final source of truth

---

### Requirement: Category deletion
The system SHALL allow ADMIN users to soft-delete categories through the existing delete endpoint with an explicit confirmation step.

#### Scenario: Confirm delete
- **WHEN** an ADMIN clicks delete for a category
- **THEN** the page asks for confirmation before calling the API

#### Scenario: Delete category
- **WHEN** an ADMIN confirms deletion
- **THEN** the frontend calls `DELETE /api/v1/categorias/{id}`
- **THEN** the list refreshes and a success toast is shown

#### Scenario: Delete error
- **WHEN** the backend rejects deletion
- **THEN** the page shows an error toast and keeps the current list visible

---

### Requirement: Category admin feedback and query consistency
The system SHALL provide clear feedback for category mutations and SHALL keep category/product dependent views consistent.

#### Scenario: Mutation success invalidates categories
- **WHEN** create, update or delete succeeds
- **THEN** queries for `['categorias']` and `['categorias', 'tree']` are invalidated

#### Scenario: Mutation success invalidates products
- **WHEN** create, update or delete succeeds
- **THEN** product queries are invalidated so category labels in product admin stay current

#### Scenario: Unauthorized API error
- **WHEN** the API returns 401 or 403
- **THEN** the page shows an actionable error state or toast

