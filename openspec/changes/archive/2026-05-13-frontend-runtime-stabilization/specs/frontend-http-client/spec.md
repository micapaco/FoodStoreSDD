## ADDED Requirements

### Requirement: API base URL fallback for local development
The system SHALL use `VITE_API_BASE_URL` when it is defined and SHALL fall back to `/api/v1` when it is not defined.
The fallback SHALL allow Vite's development proxy to route frontend API calls to the backend without requiring a local `frontend/.env` file.

#### Scenario: Environment API base URL exists
- **WHEN** `import.meta.env.VITE_API_BASE_URL` is defined
- **THEN** the shared Axios instance uses that value as its `baseURL`

#### Scenario: Environment API base URL is missing
- **WHEN** `import.meta.env.VITE_API_BASE_URL` is undefined
- **THEN** the shared Axios instance uses `/api/v1` as its `baseURL`
- **THEN** login calls are sent to `/api/v1/auth/login`, not `/auth/login`

#### Scenario: Refresh uses same base URL resolution
- **WHEN** the response interceptor attempts token refresh
- **THEN** it calls `${API_BASE_URL}/auth/refresh` using the same resolved API base URL
