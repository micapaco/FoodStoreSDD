## MODIFIED Requirements

### Requirement: Ingredient CRUD
The system SHALL allow ADMIN and STOCK users to create, read, update, and soft-delete ingredients.

#### Scenario: Search ingredients by name
- **WHEN** any user sends `GET /api/v1/ingredientes?q=queso&page=1&size=20`
- **THEN** the system returns `200 OK` with only active ingredients whose `nombre` contains `queso` case-insensitively
- **AND** `total`, `page`, `size`, and `pages` reflect the filtered result

#### Scenario: Search ingredients with allergen filter
- **WHEN** any user sends `GET /api/v1/ingredientes?q=mani&alergeno=true&page=1&size=20`
- **THEN** the system returns `200 OK` with active ingredients matching both the name search and allergen filter
