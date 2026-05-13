# frontend-http-client Specification

## Purpose
Define the shared frontend HTTP client behavior, including base URL resolution, JWT request headers, and automatic token refresh on 401 responses.
## Requirements
### Requirement: Axios instance centralized with base URL from environment
The system SHALL provide a single Axios instance at `shared/api/axios.ts` that uses `VITE_API_BASE_URL` as its `baseURL`, so all HTTP calls share the same configuration.

#### Scenario: Base URL read from environment
- **WHEN** the Axios instance is created
- **THEN** `baseURL` equals the value of `import.meta.env.VITE_API_BASE_URL`

#### Scenario: All API calls use the shared instance
- **WHEN** any feature makes an HTTP request to the backend
- **THEN** it uses the shared Axios instance, not a new `axios.create()` or `fetch()`

---

### Requirement: Request interceptor attaches JWT Bearer token
The system SHALL add an `Authorization: Bearer <token>` header to every outgoing request when an access token is present in `authStore`.

#### Scenario: Authenticated request includes token
- **WHEN** `authStore` has a non-null `accessToken`
- **THEN** every request includes the header `Authorization: Bearer <accessToken>`

#### Scenario: Unauthenticated request has no Authorization header
- **WHEN** `authStore.accessToken` is null
- **THEN** the request is sent without the `Authorization` header

#### Scenario: Token read outside React component tree
- **WHEN** the interceptor executes
- **THEN** it reads the token via `useAuthStore.getState().accessToken` (not a React hook)

---

### Requirement: Response interceptor handles 401 with automatic token refresh
The system SHALL intercept 401 responses and attempt a token refresh before retrying the original request. If the refresh fails, the user MUST be logged out.

#### Scenario: Single 401 triggers refresh and retry
- **WHEN** a request returns 401 and `authStore.refreshToken` is non-null
- **THEN** the interceptor calls the refresh endpoint
- **THEN** `authStore` is updated with the new tokens
- **THEN** the original request is retried with the new `accessToken`
- **THEN** the retried request resolves transparently to the caller

#### Scenario: Refresh failure causes logout
- **WHEN** the refresh endpoint returns an error (token expired or invalid)
- **THEN** `authStore.logout()` is called
- **THEN** all pending requests in the queue are rejected
- **THEN** the user is redirected to the login page

#### Scenario: Concurrent 401s do not trigger multiple refresh calls (queue pattern)
- **WHEN** two or more requests return 401 simultaneously
- **THEN** only ONE refresh call is made
- **THEN** all concurrent requests wait for that single refresh to complete
- **THEN** all requests retry with the new token once refresh succeeds

#### Scenario: Refresh request itself does not trigger another refresh loop
- **WHEN** the refresh endpoint call returns 401
- **THEN** the interceptor does NOT attempt another refresh (avoids infinite loop)
- **THEN** logout is called immediately

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

