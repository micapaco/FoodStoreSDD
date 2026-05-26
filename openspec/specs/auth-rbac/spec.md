# auth-rbac Specification

## Purpose
Define fixed application roles and RBAC dependencies for authenticated routes.
## Requirements
### Requirement: Four fixed roles
The system SHALL enforce exactly 5 roles: ADMIN, STOCK, PEDIDOS, CLIENT, COCINA.
A user SHALL have exactly one active role at a time, with the exception of the operative combination STOCK+PEDIDOS which may coexist.

#### Scenario: Registration assigns CLIENT role
- **WHEN** a new user registers successfully
- **THEN** the role CLIENT is automatically assigned by the service
- **AND** it MUST NOT come from the request body

#### Scenario: Single role token
- **WHEN** a user has role ADMIN
- **THEN** the access token's roles claim contains ["ADMIN"]

#### Scenario: COCINA role assignment
- **WHEN** an ADMIN assigns the COCINA role to a user
- **THEN** the user can access the `/cocina` endpoint and KDS screen

#### Scenario: Multiple role assignment rejected
- **WHEN** an ADMIN attempts to assign more than one role to a user (except STOCK+PEDIDOS combination)
- **THEN** the system rejects the request with validation error

### Requirement: get_current_user dependency
The system SHALL provide a FastAPI dependency `get_current_user()` that:
1. Extracts the Bearer token from the Authorization header.
2. Decodes and validates the JWT (signature, expiration, claims).
3. Loads the `Usuario` from the database using the `sub` claim.
4. Returns the `Usuario` object for injection into the handler.

#### Scenario: Valid token
- **WHEN** a valid Bearer token is provided
- **THEN** get_current_user returns the Usuario object with no exceptions

#### Scenario: Missing token
- **WHEN** no Authorization header is present on a protected endpoint
- **THEN** get_current_user raises HTTP 401

#### Scenario: Expired token
- **WHEN** an expired JWT is provided
- **THEN** get_current_user raises HTTP 401 with message indicating token expiration

### Requirement: require_role dependency
The system SHALL provide a FastAPI dependency factory `require_role(roles: list[str])` that:
1. Calls `get_current_user()` to get the authenticated user.
2. Checks that the user has at least one of the required roles.
3. Raises HTTP 403 if the user lacks the required role.

#### Scenario: Role satisfied
- **WHEN** an ADMIN user accesses an endpoint protected with require_role(["ADMIN"])
- **THEN** the request proceeds without error

#### Scenario: Role not satisfied
- **WHEN** a CLIENT user accesses an endpoint protected with require_role(["ADMIN"])
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: Any-of role matching
- **WHEN** a STOCK user accesses an endpoint protected with require_role(["ADMIN", "STOCK"])
- **THEN** the request proceeds (STOCK is in the allowed list)

### Requirement: Public routes
The following routes SHALL be accessible without authentication:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/productos` (public catalog listing)
- `GET /api/v1/productos/{id}` (public product detail)

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

---

### Requirement: Rol COCINA en seed idempotente
El sistema SHALL incluir el rol `COCINA` en el seed de roles con inserción idempotente.

#### Scenario: Seed de rol COCINA
- **WHEN** se ejecuta el seed de roles
- **THEN** existe el registro `Rol(codigo='COCINA', nombre='Cocinero')` en la tabla `rol`
- **THEN** la inserción usa `ON CONFLICT DO NOTHING` para ser idempotente

#### Scenario: Asignación de rol COCINA a usuario
- **WHEN** un ADMIN asigna el rol `COCINA` a un usuario existente
- **THEN** el usuario puede autenticarse y recibir un token con `roles: ["COCINA"]`
- **THEN** el usuario tiene acceso a los endpoints de cocina y puede ejecutar transiciones FSM autorizadas

