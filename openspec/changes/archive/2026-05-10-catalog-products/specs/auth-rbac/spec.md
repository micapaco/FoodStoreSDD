## MODIFIED Requirements

### Requirement: Public routes
The following routes SHALL be accessible without authentication:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/productos` (public catalog listing)

#### Scenario: Public register
- **WHEN** POST /auth/register is called without a Bearer token
- **THEN** the system processes the request normally (no 401)

#### Scenario: Public login
- **WHEN** POST /auth/login is called without a Bearer token
- **THEN** the system processes the request normally (no 401)

#### Scenario: Public product listing
- **WHEN** GET /api/v1/productos is called without a Bearer token
- **THEN** the system returns paginated product data (no 401)

#### Scenario: Public product detail
- **WHEN** GET /api/v1/productos/{id} is called without a Bearer token
- **THEN** the system returns product detail (no 401)
