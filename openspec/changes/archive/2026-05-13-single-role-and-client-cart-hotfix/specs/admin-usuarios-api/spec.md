## MODIFIED Requirements

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
