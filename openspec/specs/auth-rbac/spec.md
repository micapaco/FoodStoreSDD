## ADDED Requirements

### Requirement: Four fixed roles
The system SHALL enforce exactly 4 roles: ADMIN, STOCK, PEDIDOS, CLIENT.
Roles are stored in the `Rol` table as semantic PKs (VARCHAR(20)).
A user MAY have multiple roles simultaneously (M:N via `UsuarioRol`).

#### Scenario: CLIENT assigned on register
- **WHEN** a new user registers via POST /auth/register
- **THEN** the role CLIENT is automatically assigned by the service — it MUST NOT come from the request body

#### Scenario: Multiple roles
- **WHEN** a user has both ADMIN and CLIENT roles
- **THEN** the access token's roles claim contains ["ADMIN", "CLIENT"]

---

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

---

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

---

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
