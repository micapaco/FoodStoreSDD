## MODIFIED Requirements

### Requirement: Category admin feedback and query consistency
The system SHALL provide clear feedback for category mutations and SHALL keep category/product dependent views consistent.
Conflict errors from the backend SHALL be shown with their actionable message instead of a generic failure toast.

#### Scenario: Mutation success invalidates categories
- **WHEN** create, update or delete succeeds
- **THEN** queries for `['categorias']` and `['categorias', 'tree']` are invalidated

#### Scenario: Mutation success invalidates products
- **WHEN** create, update or delete succeeds
- **THEN** product queries are invalidated so category labels in product admin stay current

#### Scenario: Unauthorized API error
- **WHEN** the API returns 401 or 403
- **THEN** the page shows an actionable error state or toast

#### Scenario: Active duplicate category conflict
- **WHEN** the API returns `409 Conflict` because an active category already exists with that name
- **THEN** the page shows the backend conflict message to the admin
- **AND** the form remains open with the entered values

#### Scenario: Soft-deleted duplicate category name succeeds
- **WHEN** the API creates a new category using a name that only existed in soft-deleted rows
- **THEN** the page shows the normal success toast and refreshes active categories
