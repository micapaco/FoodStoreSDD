## ADDED Requirements

### Requirement: ProtectedRoute redirects unauthenticated users to login

The system SHALL provide a `<ProtectedRoute>` component that renders `<Outlet />` only when `authStore.isAuthenticated` is true, and otherwise navigates to `/login` while preserving the original path.

#### Scenario: Authenticated user passes through

- **WHEN** `authStore.isAuthenticated` is `true`
- **THEN** `<ProtectedRoute>` renders the child `<Outlet />`

#### Scenario: Unauthenticated user is redirected to login with origin

- **WHEN** `authStore.isAuthenticated` is `false` and the user tries to enter `/perfil`
- **THEN** `<ProtectedRoute>` renders `<Navigate to="/login?from=/perfil" replace />`

#### Scenario: ProtectedRoute reads auth state by slice

- **WHEN** `<ProtectedRoute>` subscribes to `authStore`
- **THEN** it uses a slice selector (e.g. `useAuthStore(s => s.isAuthenticated)`) and not the full store

---

### Requirement: RoleRoute restricts access by role

The system SHALL provide a `<RoleRoute roles={string[]}>` component that renders `<Outlet />` only when `authStore.user` has at least one of the listed roles.

#### Scenario: User with required role passes through

- **WHEN** `<RoleRoute roles={['ADMIN']}>` is rendered and `authStore.user.roles` includes `ADMIN`
- **THEN** the child `<Outlet />` is rendered

#### Scenario: User with one of the multiple required roles passes through

- **WHEN** `<RoleRoute roles={['ADMIN', 'STOCK']}>` is rendered and `authStore.user.roles` includes `STOCK`
- **THEN** the child `<Outlet />` is rendered

#### Scenario: Authenticated user without any required role is forbidden

- **WHEN** `<RoleRoute roles={['ADMIN']}>` is rendered and `authStore.user.roles` only contains `CLIENT`
- **THEN** the component renders `<Navigate to="/403" replace />`

#### Scenario: Unauthenticated user reaches RoleRoute

- **WHEN** `<RoleRoute>` is reached without `<ProtectedRoute>` upstream and the user is not authenticated
- **THEN** the component renders `<Navigate to="/login" replace />` (defensive fallback)

#### Scenario: RoleRoute uses authStore.hasRole semantics

- **WHEN** `<RoleRoute>` evaluates the role check
- **THEN** it uses logic equivalent to `roles.some(r => authStore.hasRole(r))`

---

### Requirement: GuestOnlyRoute redirects authenticated users to their home

The system SHALL provide a `<GuestOnlyRoute>` component that renders `<Outlet />` only for unauthenticated users; if authenticated, it redirects to the role-based home.

#### Scenario: Guest passes through

- **WHEN** `authStore.isAuthenticated` is `false`
- **THEN** `<GuestOnlyRoute>` renders the child `<Outlet />`

#### Scenario: Authenticated CLIENT redirected to home

- **WHEN** `authStore.user.roles` is `['CLIENT']` and the user navigates to `/login`
- **THEN** `<GuestOnlyRoute>` renders `<Navigate to="/" replace />`

#### Scenario: Authenticated ADMIN redirected to admin

- **WHEN** `authStore.user.roles` includes `ADMIN` and the user navigates to `/login`
- **THEN** `<GuestOnlyRoute>` renders `<Navigate to="/admin" replace />`

#### Scenario: Authenticated STOCK redirected to products admin

- **WHEN** `authStore.user.roles` is `['STOCK']` and the user navigates to `/login`
- **THEN** `<GuestOnlyRoute>` renders `<Navigate to="/admin/productos" replace />`

#### Scenario: Authenticated PEDIDOS redirected to orders admin

- **WHEN** `authStore.user.roles` is `['PEDIDOS']` and the user navigates to `/login`
- **THEN** `<GuestOnlyRoute>` renders `<Navigate to="/admin/pedidos" replace />`

---

### Requirement: Login redirect preserves origin via `from` query parameter

The system SHALL preserve the path from which an unauthenticated user was bounced so that the login page (when implemented in change `auth`) can return the user to the original location.

#### Scenario: Origin preserved on bounce

- **WHEN** an unauthenticated user navigates to `/admin/usuarios`
- **THEN** the redirect URL is `/login?from=/admin/usuarios`

#### Scenario: Origin omitted when no useful path

- **WHEN** an unauthenticated user navigates directly to `/login`
- **THEN** the URL has no `from` parameter (already on login)

---

### Requirement: Refresh failure forces logout and login redirect

The system SHALL ensure that when the axios refresh-token flow fails, the user lands on `/login` with the previous path preserved.

#### Scenario: Refresh failure logs out and redirects

- **WHEN** the response interceptor detects a refresh-token error and calls `authStore.logout()`
- **THEN** on the next render `<ProtectedRoute>` reads `isAuthenticated === false`
- **THEN** the user is redirected to `/login?from=<currentPath>`

#### Scenario: Refresh failure shows session-expired toast

- **WHEN** the refresh failure path runs
- **THEN** a toast with `kind: 'warning'` and message `"Tu sesión expiró"` is published via `uiStore.addToast`
