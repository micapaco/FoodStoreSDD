# admin-usuarios-api Specification

## Purpose
TBD - created by archiving change admin-users. Update Purpose after archive.
## Requirements
### Requirement: Listar usuarios (Admin)
The system SHALL expose `GET /api/v1/admin/usuarios` requiring role ADMIN.
Query params: `q` (string, optional — ILIKE on nombre+email), `rol` (string, optional — filter by rol codigo), `page` (int, default 1), `size` (int, default 20, max 100).
Response: HTTP 200 + `UsuarioListResponse` (items, total, page, size, pages).
Each item includes: id, nombre, apellido, email, roles (list of strings), activo, created_at.

#### Scenario: Listado sin filtros
- **WHEN** ADMIN requests `GET /api/v1/admin/usuarios` without filters
- **THEN** the system returns HTTP 200 with paginated list of all users (including inactive)

#### Scenario: Búsqueda por nombre o email
- **WHEN** ADMIN requests with `q=juan`
- **THEN** the system returns only users whose nombre OR email contains "juan" (case-insensitive)

#### Scenario: Filtro por rol
- **WHEN** ADMIN requests with `rol=PEDIDOS`
- **THEN** the system returns only users who have the PEDIDOS role assigned

#### Scenario: Acceso denegado sin rol ADMIN
- **WHEN** a non-ADMIN authenticated user requests the endpoint
- **THEN** the system returns HTTP 403

---

### Requirement: Detalle de usuario (Admin)
The system SHALL expose `GET /api/v1/admin/usuarios/{id}` requiring role ADMIN.
Response: HTTP 200 + `UsuarioDetailRead` (all list fields + telefono, updated_at).
On not found: HTTP 404.

#### Scenario: Usuario existente
- **WHEN** ADMIN requests `GET /api/v1/admin/usuarios/5`
- **THEN** the system returns HTTP 200 with full user detail including roles and activo status

#### Scenario: Usuario no encontrado
- **WHEN** ADMIN requests a non-existent user id
- **THEN** the system returns HTTP 404

---

### Requirement: Editar usuario (Admin)
The system SHALL expose `PUT /api/v1/admin/usuarios/{id}` requiring role ADMIN.
Body: `UsuarioUpdateRequest` (nombre, apellido, email, telefono — all optional).
Response: HTTP 200 + `UsuarioDetailRead`.
On email conflict: HTTP 409. On not found: HTTP 404.

#### Scenario: Edición exitosa
- **WHEN** ADMIN submits valid updated fields for an existing user
- **THEN** the system updates the user and returns HTTP 200 with updated data

#### Scenario: Email duplicado
- **WHEN** ADMIN submits an email already belonging to another user
- **THEN** the system returns HTTP 409

---

### Requirement: Cambiar roles de usuario (Admin)
The system SHALL expose `PATCH /api/v1/admin/usuarios/{id}/roles` requiring role ADMIN.
Body: `{ roles: list[str] }` as full replacement of the user's role set.
The submitted role list SHALL contain exactly one role code from: ADMIN, STOCK, PEDIDOS, CLIENT.
Response: HTTP 200 + `UsuarioDetailRead`.

#### Scenario: Asignación de rol exitosa
- **WHEN** ADMIN submits a one-item role list for a user
- **THEN** the system replaces the user's role and returns HTTP 200

#### Scenario: Protección del último ADMIN
- **WHEN** ADMIN tries to remove ADMIN role from the only user with that role
- **THEN** the system returns HTTP 409 Conflict

#### Scenario: Lista de roles vacía
- **WHEN** ADMIN submits an empty roles list
- **THEN** the system returns HTTP 422 Unprocessable Entity

#### Scenario: Múltiples roles
- **WHEN** ADMIN submits two or more roles
- **THEN** the system returns HTTP 422 Unprocessable Entity

### Requirement: Activar o desactivar usuario (Admin)
The system SHALL expose `PATCH /api/v1/admin/usuarios/{id}/estado` requiring role ADMIN.
Body: `{ activo: bool }`.
Response: HTTP 200 + `UsuarioDetailRead`.
On desactivating last ADMIN: HTTP 409. On not found: HTTP 404.
After desactivating: all active refresh tokens of the target user MUST be revoked.

#### Scenario: Desactivación exitosa
- **WHEN** ADMIN sets `activo: false` for an active user
- **THEN** the system sets activo=false and returns HTTP 200
- **THEN** all active refresh tokens of that user are revoked

#### Scenario: Activación exitosa
- **WHEN** ADMIN sets `activo: true` for an inactive user
- **THEN** the system sets activo=true and returns HTTP 200

#### Scenario: Desactivar al único ADMIN
- **WHEN** ADMIN tries to deactivate the only user with ADMIN role
- **THEN** the system returns HTTP 409 with message "No se puede desactivar al único administrador del sistema"

