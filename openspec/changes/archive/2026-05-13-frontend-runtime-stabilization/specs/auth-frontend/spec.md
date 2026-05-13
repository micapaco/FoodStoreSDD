## ADDED Requirements

### Requirement: Post-login redirect respects role access
The system SHALL only redirect a user to the `from` path after login when the authenticated user's roles are allowed to access that path.
If the user cannot access the requested path, the system SHALL redirect to the default home for the user's primary role.

#### Scenario: Client redirected away from admin origin
- **WHEN** a CLIENT logs in from `/login?from=/admin`
- **THEN** the app redirects to `/`
- **THEN** the user does not land on `/403` immediately after successful login

#### Scenario: Admin returns to admin origin
- **WHEN** an ADMIN logs in from `/login?from=/admin/usuarios`
- **THEN** the app redirects to `/admin/usuarios`

#### Scenario: Stock user returns only to product admin
- **WHEN** a STOCK user logs in from `/login?from=/admin/productos`
- **THEN** the app redirects to `/admin/productos`

#### Scenario: Stock user cannot return to users admin
- **WHEN** a STOCK user logs in from `/login?from=/admin/usuarios`
- **THEN** the app redirects to `/admin/productos`
