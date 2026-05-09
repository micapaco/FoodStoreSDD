## ADDED Requirements

### Requirement: LoginPage
The system SHALL render a login page at the `/login` route (public, no auth required).
The form SHALL collect `email` and `password`.
On successful login: store tokens via `authStore.login()` and navigate to the previous page (via `?from=` param) or `/` by default.
On error: display a non-specific error toast (do not reveal whether email or password was wrong).

#### Scenario: Successful login flow
- **WHEN** a user submits valid credentials
- **THEN** tokens are stored in authStore, user is set, and the app navigates away from /login

#### Scenario: Failed login
- **WHEN** a user submits invalid credentials
- **THEN** an error toast is shown without revealing which field was wrong

#### Scenario: Redirect after login
- **WHEN** user was redirected to /login?from=/pedidos
- **THEN** after successful login, the app navigates to /pedidos

---

### Requirement: RegisterPage
The system SHALL render a registration page at the `/register` route (public).
The form SHALL collect `nombre`, `apellido`, `email`, `password` (and optional `confirmar_password` for UX validation).
On successful registration: navigate to `/login` with a success toast.
On error: display field-level validation errors and API error toasts.

#### Scenario: Successful registration
- **WHEN** a user submits a valid registration form
- **THEN** the account is created, a success toast is shown, and the user is redirected to /login

#### Scenario: Duplicate email error
- **WHEN** the user submits a form with an already-registered email
- **THEN** an error toast with the API's message is shown and the user stays on /register

#### Scenario: Client-side validation
- **WHEN** the user blurs a field with an invalid value (e.g., password < 8 chars)
- **THEN** a validation error is shown beneath that field before the form is submitted

---

### Requirement: useAuth hook
The system SHALL expose a `useAuth` hook that encapsulates TanStack Query mutations for login and logout, and provides the current auth state.
The hook SHALL expose: `login(credentials)`, `logout()`, `register(data)`, `isPending`, `error`, and the current user from `authStore`.

#### Scenario: Login mutation
- **WHEN** useAuth.login(credentials) is called
- **THEN** it calls POST /auth/login, on success calls authStore.login() with the tokens and user, and invalidates relevant queries

#### Scenario: Logout mutation
- **WHEN** useAuth.logout() is called
- **THEN** it calls POST /auth/logout, then calls authStore.logoutAndRedirect('/') regardless of API response

---

### Requirement: Axios 401 interceptor activation
The Axios response interceptor SHALL handle 401 responses by:
1. Attempting POST /auth/refresh with the stored refresh token.
2. On success: updating authStore with the new access token and retrying the original request.
3. On failure (refresh also 401): calling authStore.logout() to clear state.

The interceptor MUST NOT retry the refresh request itself to avoid infinite loops.

#### Scenario: Token expired mid-session
- **WHEN** an API call returns 401 (expired access token) and a valid refresh token exists
- **THEN** the interceptor transparently refreshes the token and retries the original request without the user noticing

#### Scenario: Refresh token expired
- **WHEN** both the access token and refresh token are expired
- **THEN** the interceptor calls authStore.logout() and the user is redirected to /login

#### Scenario: No retry on refresh endpoint
- **WHEN** POST /auth/refresh itself returns 401
- **THEN** the interceptor does NOT retry — it goes directly to logout

---

### Requirement: authStore integration
The `authStore` SHALL be updated by auth operations as follows:
- `login(tokens, user)`: stores accessToken, refreshToken, user, sets isAuthenticated=true.
- `logout()`: clears all auth state; used by the interceptor on session expiry.
- `logoutAndRedirect(to)`: clears auth state and sets navigateAfterLogout; used by explicit user logout action.

The `accessToken` and `refreshToken` SHALL be persisted to localStorage via Zustand `persist` with `partialize`.

#### Scenario: Tokens persisted on login
- **WHEN** login succeeds
- **THEN** accessToken and refreshToken are in localStorage after page reload

#### Scenario: State cleared on logout
- **WHEN** logout is called
- **THEN** accessToken, refreshToken, and user are null; isAuthenticated is false; localStorage is cleared
