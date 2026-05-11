## ADDED Requirements

### Requirement: Public catalog endpoint
The system SHALL expose public endpoints for catalog browsing of products, categories and ingredients.

#### Scenario: Get catalog overview
- **WHEN** any user sends `GET /api/v1/catalogo/resumen`
- **THEN** the system returns `200 OK` with the category tree and ingredient count

#### Scenario: Get product listing
- **WHEN** any user sends `GET /api/v1/productos?page=1&size=20`
- **THEN** the system returns `200 OK` with paginated product list (only `disponible=true` and `deleted_at IS NULL`)

#### Scenario: Get product detail
- **WHEN** any user sends `GET /api/v1/productos/{id}`
- **THEN** the system returns `200 OK` with product detail including `categorias[]` and `ingredientes[]`

#### Scenario: Unauthenticated access
- **WHEN** an anonymous user accesses public catalog endpoints
- **THEN** the system returns public data without requiring authentication

---

### Requirement: Product filtering
The system SHALL support advanced filtering on the public product listing endpoint.

#### Scenario: Filter by text search
- **WHEN** a user sends `GET /api/v1/productos?q=pizza`
- **THEN** the system returns products matching by name or description (ILIKE)

#### Scenario: Filter by category
- **WHEN** a user sends `GET /api/v1/productos?categoria_id=5`
- **THEN** the system returns products associated with that category

#### Scenario: Filter by price range
- **WHEN** a user sends `GET /api/v1/productos?precio_min=100&precio_max=500`
- **THEN** the system returns products within the price range

#### Scenario: Filter by ingredient
- **WHEN** a user sends `GET /api/v1/productos?ingrediente_id=3`
- **THEN** the system returns products containing that ingredient
