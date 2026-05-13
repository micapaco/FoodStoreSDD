## MODIFIED Requirements

### Requirement: Login endpoint
The system SHALL expose `POST /api/v1/auth/login` to authenticate existing users.
The body SHALL be `{ email, password }`.
On success: HTTP 200 + `TokenResponse` (access_token, refresh_token, token_type="bearer", expires_in=1800).
On invalid credentials: HTTP 401. The error message MUST NOT differentiate "email not found" from "wrong password".
On inactive account (`activo = false`): HTTP 403 with message "Cuenta desactivada".

#### Scenario: Successful login
- **WHEN** valid credentials are submitted for an active user
- **THEN** the system returns HTTP 200 with a TokenResponse containing both access and refresh tokens

#### Scenario: Invalid credentials
- **WHEN** login is submitted with a wrong password or non-existent email
- **THEN** the system returns HTTP 401 with a generic error message that does not reveal which field was wrong

#### Scenario: Rate limit exceeded
- **WHEN** more than 5 login attempts from the same IP occur within 15 minutes
- **THEN** the system returns HTTP 429 with `Retry-After` header and message "Demasiados intentos, reintenta en X minutos"

#### Scenario: Cuenta desactivada
- **WHEN** valid credentials are submitted for a user with `activo = false`
- **THEN** the system returns HTTP 403 with message "Cuenta desactivada"
