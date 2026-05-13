# Profile API

## Requirement: Update own profile
The system SHALL allow authenticated users to update their personal information (nombre, apellido, teléfono, email).

### Scenario: Successful profile update
- **WHEN** an authenticated user sends `PUT /auth/me` with valid `nombre`, `apellido`, `telefono`
- **THEN** the system returns `200 OK` with the updated `UserResponse` (without `password_hash`)

### Scenario: Update with duplicate email
- **WHEN** an authenticated user sends `PUT /auth/me` with an `email` that belongs to another user
- **THEN** the system returns `409 Conflict` with `code: "CONFLICT"` and detail "El email ya está registrado"

### Scenario: Update with empty fields
- **WHEN** an authenticated user sends `PUT /auth/me` with empty `nombre` or `apellido`
- **THEN** the system returns `422 Unprocessable Entity` with validation error for the empty field

### Scenario: Unauthenticated update attempt
- **WHEN** a request without valid JWT sends `PUT /auth/me`
- **THEN** the system returns `401 Unauthorized`

---

## Requirement: Change password
The system SHALL allow authenticated users to change their password by providing their current password and a new password.

### Scenario: Successful password change
- **WHEN** an authenticated user sends `PUT /auth/change-password` with valid `current_password`, `new_password`, and `confirm_password`
- **THEN** the system returns `200 OK` with message "Contraseña actualizada correctamente"

### Scenario: Incorrect current password
- **WHEN** an authenticated user sends `PUT /auth/change-password` with wrong `current_password`
- **THEN** the system returns `403 Forbidden` with `code: "FORBIDDEN"` and detail "Contraseña actual incorrecta"

### Scenario: New password too short
- **WHEN** an authenticated user sends `PUT /auth/change-password` with `new_password` shorter than 8 characters
- **THEN** the system returns `422 Unprocessable Entity` with validation error for field `new_password`

### Scenario: New password equals current password
- **WHEN** an authenticated user sends `PUT /auth/change-password` with `new_password` identical to `current_password`
- **THEN** the system returns `422 Unprocessable Entity` with validation error "La nueva contraseña debe ser diferente a la actual"

### Scenario: New password contains full email
- **WHEN** an authenticated user sends `PUT /auth/change-password` with `new_password` containing the user's full email address
- **THEN** the system returns `422 Unprocessable Entity` with validation error "La contraseña no puede contener tu email"

### Scenario: Confirm password does not match
- **WHEN** an authenticated user sends `PUT /auth/change-password` with `confirm_password` different from `new_password`
- **THEN** the system returns `422 Unprocessable Entity` with validation error for field `confirm_password`

### Scenario: Rate limiting on password change
- **WHEN** an authenticated user sends more than 10 `PUT /auth/change-password` requests within 15 minutes
- **THEN** the system returns `429 Too Many Requests`

### Scenario: Unauthenticated password change attempt
- **WHEN** a request without valid JWT sends `PUT /auth/change-password`
- **THEN** the system returns `401 Unauthorized`

---

## Requirement: Profile response schema
The system SHALL return user data in the standard `UserResponse` shape for all profile-related responses.

### Scenario: UserResponse shape
- **WHEN** the system returns user data from `GET /auth/me` or `PUT /auth/me`
- **THEN** the response body SHALL contain `{ id, email, nombre, apellido, telefono, roles: [{ codigo, nombre }], created_at }` and SHALL NOT contain `password_hash`

---

## Requirement: UpdateProfileRequest schema
The system SHALL accept the following fields on `PUT /auth/me`:
- `nombre`: string, required, 1-100 chars
- `apellido`: string, required, 1-100 chars
- `telefono`: string, optional, max 20 chars
- `email`: string, required, valid email format

### Scenario: UpdateProfileRequest validation
- **WHEN** the request body contains additional fields not in the schema
- **THEN** the system returns `422 Unprocessable Entity` with `code: "VALIDATION_ERROR"` (Pydantic `extra="forbid"`)

---

## Requirement: ChangePasswordRequest schema
The system SHALL accept the following fields on `PUT /auth/change-password`:
- `current_password`: string, required
- `new_password`: string, required, minimum 8 chars, must differ from current password, must not contain user's full email address
- `confirm_password`: string, required, must match `new_password`

### Scenario: ChangePasswordRequest validation
- **WHEN** the request body contains additional fields not in the schema
- **THEN** the system returns `422 Unprocessable Entity` with `code: "VALIDATION_ERROR"` (Pydantic `extra="forbid"`)
