## ADDED Requirements

### Requirement: Register endpoint
The system SHALL expose `POST /api/v1/auth/register` to create new accounts.
The body SHALL be `{ nombre, apellido, email, password }`.
On success: HTTP 201 + `UserResponse` (id, nombre, apellido, email, roles, created_at). Password MUST NOT appear in any response.
On duplicate email: HTTP 409 with RFC 7807 error body.
On validation failure (password < 8 chars, invalid email): HTTP 422.

#### Scenario: Successful registration
- **WHEN** a valid RegisterRequest is submitted with a unique email
- **THEN** the system returns HTTP 201 with a UserResponse containing the new user's data and roles: ["CLIENT"]

#### Scenario: Duplicate email
- **WHEN** a RegisterRequest is submitted with an email already in the database
- **THEN** the system returns HTTP 409 with a detail message "El email ya está registrado"

#### Scenario: Weak password
- **WHEN** a RegisterRequest is submitted with password shorter than 8 characters
- **THEN** the system returns HTTP 422 with validation error detail

#### Scenario: Password not exposed
- **WHEN** any auth endpoint returns user data
- **THEN** the response body MUST NOT contain password_hash or any password field

---

### Requirement: Login endpoint
The system SHALL expose `POST /api/v1/auth/login` to authenticate existing users.
The body SHALL be `{ email, password }`.
On success: HTTP 200 + `TokenResponse` (access_token, refresh_token, token_type="bearer", expires_in=1800).
On invalid credentials: HTTP 401. The error message MUST NOT differentiate "email not found" from "wrong password".

#### Scenario: Successful login
- **WHEN** valid credentials are submitted
- **THEN** the system returns HTTP 200 with a TokenResponse containing both access and refresh tokens

#### Scenario: Invalid credentials
- **WHEN** login is submitted with a wrong password or non-existent email
- **THEN** the system returns HTTP 401 with a generic error message that does not reveal which field was wrong

#### Scenario: Rate limit exceeded
- **WHEN** more than 5 login attempts from the same IP occur within 15 minutes
- **THEN** the system returns HTTP 429 with `Retry-After` header and message "Demasiados intentos, reintenta en X minutos"

---

### Requirement: Refresh endpoint
The system SHALL expose `POST /api/v1/auth/refresh` to obtain a new token pair.
The body SHALL be `{ refresh_token }`.
On success: HTTP 200 + `TokenResponse` with a new access token and rotated refresh token.
On expired or invalid token: HTTP 401.
On replay attack (reused token): HTTP 401 + all tokens in the same family MUST be revoked.

#### Scenario: Valid refresh token
- **WHEN** a valid, non-expired, non-revoked refresh token is submitted
- **THEN** the system returns HTTP 200 with a new TokenResponse and the old refresh token is revoked

#### Scenario: Expired refresh token
- **WHEN** a refresh token past its expires_at is submitted
- **THEN** the system returns HTTP 401 and the user must re-login

#### Scenario: Replay attack detected
- **WHEN** a refresh token with revoked_at already set is submitted
- **THEN** the system revokes ALL tokens in that family and returns HTTP 401

---

### Requirement: Logout endpoint
The system SHALL expose `POST /api/v1/auth/logout` to revoke the current refresh token.
Requires Bearer access token in Authorization header.
The body SHALL be `{ refresh_token }`.
On success: HTTP 204 No Content.
The access token remains valid until its natural expiration (stateless).

#### Scenario: Successful logout
- **WHEN** an authenticated user posts their refresh token to /logout
- **THEN** the system sets revoked_at on the RefreshToken record and returns HTTP 204

#### Scenario: Unauthenticated logout
- **WHEN** /logout is called without a valid Bearer token
- **THEN** the system returns HTTP 401

---

### Requirement: Me endpoint
The system SHALL expose `GET /api/v1/auth/me` to return the current user's profile.
Requires Bearer access token.
On success: HTTP 200 + `UserResponse`.

#### Scenario: Authenticated me request
- **WHEN** a valid Bearer token is included in the request
- **THEN** the system returns HTTP 200 with the UserResponse of the token owner

#### Scenario: Unauthenticated me request
- **WHEN** /auth/me is called without a Bearer token
- **THEN** the system returns HTTP 401
