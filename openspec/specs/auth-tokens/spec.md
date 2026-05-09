## ADDED Requirements

### Requirement: Access token structure
The system SHALL issue JWT access tokens signed with HS256 using the SECRET_KEY env var.
Each access token SHALL contain claims: `sub` (user id), `email`, `roles` (list of strings), `exp` (unix timestamp).
Access tokens SHALL expire 30 minutes after issuance (ACCESS_TOKEN_EXPIRE_MINUTES=30).

#### Scenario: Token claims present
- **WHEN** a token is decoded after successful login
- **THEN** it contains sub, email, roles, and exp claims

#### Scenario: Token expiration
- **WHEN** an access token older than 30 minutes is used on a protected endpoint
- **THEN** the system returns HTTP 401 with an expiration error

---

### Requirement: Refresh token lifecycle
The system SHALL issue opaque refresh tokens (UUID v4) valid for 7 days.
The refresh token SHALL be stored in the `RefreshToken` table as a SHA-256 hash (`token_hash CHAR(64)`).
Each `RefreshToken` record SHALL have: `token_hash`, `usuario_id`, `family_id` (UUID), `expires_at`, `revoked_at` (NULL = active).

#### Scenario: Refresh token stored as hash
- **WHEN** a refresh token is issued
- **THEN** the token value is not stored in plain text — only its SHA-256 hash exists in the DB

#### Scenario: Active token check
- **WHEN** a refresh token is used
- **THEN** the system finds the matching hash and verifies revoked_at IS NULL and expires_at > now()

---

### Requirement: Refresh token rotation
The system SHALL revoke the submitted refresh token and issue a new one on every successful refresh.
The new token MUST have a new expiration (7 days from the refresh call) and the SAME `family_id` as the revoked token.

#### Scenario: Token rotated on refresh
- **WHEN** a valid refresh token is used at POST /auth/refresh
- **THEN** the old token has revoked_at set to the current timestamp and a new token is returned with the same family_id

---

### Requirement: Replay attack detection
The system SHALL detect and defend against refresh token replay attacks.
If a token with `revoked_at` already set is submitted, the system MUST revoke ALL `RefreshToken` records sharing the same `family_id` and return HTTP 401.

#### Scenario: Single-device replay
- **WHEN** a refresh token that was already rotated (revoked_at IS NOT NULL) is submitted
- **THEN** ALL tokens in the same family_id are revoked and HTTP 401 is returned

#### Scenario: Family isolation
- **WHEN** replay is detected in one family
- **THEN** tokens belonging to OTHER family_ids of the same user are NOT revoked
