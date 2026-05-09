## ADDED Requirements

### Requirement: parseHttpError normalizes any error to AppHttpError

The system SHALL provide a pure helper `parseHttpError(error: unknown): AppHttpError` at `frontend/src/shared/lib/http/parseHttpError.ts` that maps any error (Axios, network, runtime) to a stable shape.

#### Scenario: AppHttpError shape is fixed

- **WHEN** `parseHttpError` returns a value
- **THEN** the returned object has fields `status: number`, `code: string`, `message: string`, `detail?: unknown`

#### Scenario: Network error mapped to NETWORK code

- **WHEN** the input is an `AxiosError` without a `response` (request failed before reaching server)
- **THEN** the result has `status: 0`, `code: 'NETWORK'`, `message: 'Sin conexión con el servidor'`

#### Scenario: 401 mapped to UNAUTHORIZED

- **WHEN** the input is an `AxiosError` with `response.status === 401`
- **THEN** the result has `status: 401`, `code: 'UNAUTHORIZED'`, `message: 'Tu sesión expiró'`

#### Scenario: 403 mapped to FORBIDDEN

- **WHEN** the input is an `AxiosError` with `response.status === 403`
- **THEN** the result has `status: 403`, `code: 'FORBIDDEN'`, `message: 'No tenés permiso para esta acción'`

#### Scenario: 404 mapped to NOT_FOUND

- **WHEN** the input is an `AxiosError` with `response.status === 404`
- **THEN** the result has `status: 404`, `code: 'NOT_FOUND'`, `message: 'Recurso no encontrado'`

#### Scenario: 422 mapped to VALIDATION with backend message

- **WHEN** the input is an `AxiosError` with `response.status === 422` and `response.data.detail` is a string
- **THEN** the result has `status: 422`, `code: 'VALIDATION'`, `message` equal to the backend's detail string

#### Scenario: 5xx mapped to SERVER_ERROR

- **WHEN** the input is an `AxiosError` with `response.status` between 500 and 599
- **THEN** the result has the original status, `code: 'SERVER_ERROR'`, `message: 'Error del servidor, intentá de nuevo'`

#### Scenario: Unknown errors mapped to UNKNOWN

- **WHEN** the input is not an `AxiosError` (plain `Error`, string, anything)
- **THEN** the result has `status: 0`, `code: 'UNKNOWN'`, a generic message

#### Scenario: Original payload preserved in detail

- **WHEN** `parseHttpError` is called on any input
- **THEN** the returned `detail` field contains the original error or its `response.data` so consumers can drill in for debug

---

### Requirement: installErrorHandler wires global feedback into the axios interceptor

The system SHALL provide a function `installErrorHandler()` at `frontend/src/shared/lib/http/installErrorHandler.ts` that is called once at app boot (from `main.tsx`) and connects the response interceptor to global feedback (toasts) and to the auth flow.

#### Scenario: Handler is installed once at boot

- **WHEN** the app starts
- **THEN** `installErrorHandler()` is invoked exactly once before React mounts
- **THEN** subsequent calls are idempotent (safe to call again, no double-handling)

#### Scenario: 401 with successful refresh is silent

- **WHEN** an authenticated request returns 401 and the refresh queue resolves successfully
- **THEN** no toast is published
- **THEN** the caller never sees the 401 (it sees the retried response)

#### Scenario: 401 with failed refresh logs out and toasts

- **WHEN** the refresh queue rejects (refresh token invalid or expired)
- **THEN** `authStore.logout()` is called
- **THEN** a toast `{ kind: 'warning', message: 'Tu sesión expiró' }` is published

#### Scenario: 403 publishes a forbidden toast

- **WHEN** any request returns 403
- **THEN** a toast `{ kind: 'error', message: 'No tenés permiso para esta acción' }` is published

#### Scenario: 5xx publishes a server-error toast

- **WHEN** any request returns a status in 500..599
- **THEN** a toast `{ kind: 'error', message: 'Error del servidor, intentá de nuevo' }` is published

#### Scenario: Network failure publishes a connectivity toast

- **WHEN** a request fails without a response (network error)
- **THEN** a toast `{ kind: 'error', message: 'Sin conexión con el servidor' }` is published

#### Scenario: 422 validation errors do NOT publish a global toast

- **WHEN** a request returns 422
- **THEN** no global toast is published
- **THEN** the error propagates to the caller so the feature can render field-level messages

---

### Requirement: RootErrorBoundary catches render errors with a recoverable fallback

The system SHALL provide a `<RootErrorBoundary>` component that wraps the layout's outlet and renders a fallback UI when a child component throws during render.

#### Scenario: Render error renders fallback

- **WHEN** a descendant of `<RootErrorBoundary>` throws during render
- **THEN** the boundary catches the error and renders a fallback with a heading, a brief message and a "Recargar" button

#### Scenario: Reload button restarts the app

- **WHEN** the user clicks the "Recargar" button in the fallback
- **THEN** `window.location.reload()` is invoked

#### Scenario: Boundary logs the error

- **WHEN** the boundary catches an error
- **THEN** the error and component stack are passed to `console.error` (or a central logger)

#### Scenario: Boundary does not catch async errors

- **WHEN** an async operation in a descendant rejects (promise/useEffect)
- **THEN** the boundary does NOT render the fallback (handled by HTTP error handler or feature code)
