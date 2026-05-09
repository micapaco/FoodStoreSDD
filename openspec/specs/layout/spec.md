## ADDED Requirements

### Requirement: PublicLayout renders public chrome with outlet

The system SHALL provide a `<PublicLayout>` component that wraps every public route with a public header, an `<Outlet />` for page content, a footer, a global toaster and a root error boundary.

#### Scenario: Public layout structure

- **WHEN** any route under `<PublicLayout>` is rendered
- **THEN** the DOM contains, in order: `<PublicHeader>`, `<main>` with `<Outlet />`, `<Footer>`, `<Toaster>`
- **THEN** the outlet content is wrapped by `<RootErrorBoundary>`

#### Scenario: Public header has no session controls

- **WHEN** `<PublicHeader>` renders
- **THEN** it shows the brand and links to `/`, `/login` and `/register`
- **THEN** it does not show user avatar, role badge or logout

#### Scenario: Public layout is mobile-first

- **WHEN** the viewport width is below the `md` breakpoint
- **THEN** the public layout collapses navigation into a mobile-friendly arrangement (hamburger or stacked links)

---

### Requirement: PrivateLayout renders authenticated chrome with role nav

The system SHALL provide a `<PrivateLayout>` component that wraps every private route with a private header, a role-aware navigation, an `<Outlet />`, a footer, the global toaster and a root error boundary.

#### Scenario: Private layout structure

- **WHEN** any route under `<PrivateLayout>` is rendered for an authenticated user
- **THEN** the DOM contains: `<PrivateHeader>`, `<RoleNav>`, `<main>` with `<Outlet />`, `<Footer>`, `<Toaster>`
- **THEN** the outlet content is wrapped by `<RootErrorBoundary>`

#### Scenario: Private header shows session info

- **WHEN** `<PrivateHeader>` renders for an authenticated user
- **THEN** it shows the user name (`authStore.user.nombre`)
- **THEN** it shows a badge with the active role
- **THEN** it shows a logout button that calls `authStore.logout()` and navigates to `/`

#### Scenario: Logout clears session and redirects

- **WHEN** the user clicks logout in `<PrivateHeader>`
- **THEN** `authStore.logout()` is called
- **THEN** the app navigates to `/`
- **THEN** the next render uses `<PublicLayout>` because `isAuthenticated` is now `false`

---

### Requirement: RoleNav renders navigation items based on user role

The system SHALL provide a `<RoleNav>` component that exposes only the navigation items relevant to the user's roles.

#### Scenario: CLIENT sees client items

- **WHEN** `authStore.user.roles` is `['CLIENT']`
- **THEN** `<RoleNav>` shows links to `/`, `/carrito`, `/pedidos`, `/perfil`
- **THEN** no admin links are shown

#### Scenario: ADMIN sees full admin nav

- **WHEN** `authStore.user.roles` includes `ADMIN`
- **THEN** `<RoleNav>` shows links to `/admin`, `/admin/productos`, `/admin/categorias`, `/admin/pedidos`, `/admin/usuarios`

#### Scenario: STOCK sees stock subset

- **WHEN** `authStore.user.roles` is `['STOCK']`
- **THEN** `<RoleNav>` shows only the link to `/admin/productos`
- **THEN** no users, categorias or pedidos admin links are shown

#### Scenario: PEDIDOS sees orders subset

- **WHEN** `authStore.user.roles` is `['PEDIDOS']`
- **THEN** `<RoleNav>` shows only the link to `/admin/pedidos`

#### Scenario: Active link is visually marked

- **WHEN** the current route matches a link in `<RoleNav>`
- **THEN** the link uses an `aria-current="page"` attribute and an active visual style

---

### Requirement: Toaster renders uiStore toasts and auto-dismisses them

The system SHALL provide a `<Toaster>` component that subscribes to `uiStore.toasts` and renders each toast with its kind-specific style and an auto-dismiss timer.

#### Scenario: Toast renders with kind style

- **WHEN** a toast with `kind: 'error'` is added to `uiStore.toasts`
- **THEN** `<Toaster>` renders a toast with the error style (red/danger variant)

#### Scenario: Toast auto-dismisses after timeout

- **WHEN** a toast is added without `durationMs`
- **THEN** the toast is removed via `uiStore.removeToast(id)` after a default timeout (5000 ms)

#### Scenario: Toast respects custom duration

- **WHEN** a toast is added with `durationMs: 10000`
- **THEN** the toast is removed after 10000 ms

#### Scenario: Toaster subscribes by slice

- **WHEN** `<Toaster>` consumes the store
- **THEN** it subscribes via `useUiStore(s => s.toasts)` (slice selector, no full-store access)

#### Scenario: Toasts are accessible

- **WHEN** a toast is rendered
- **THEN** the toast container uses `role="status"` for info/success and `role="alert"` for error/warning
- **THEN** focus is not stolen from the current element
