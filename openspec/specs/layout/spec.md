## ADDED Requirements

### Requirement: PublicLayout renders session-aware chrome with outlet

The system SHALL provide a `<PublicLayout>` component that wraps every public route with session-aware chrome, an `<Outlet />` for page content, a footer, a global toaster and a root error boundary.

#### Scenario: Public layout structure

- **WHEN** any route under `<PublicLayout>` is rendered without an authenticated session
- **THEN** the DOM contains, in order: `<PublicHeader>`, `<main>` with `<Outlet />`, `<Footer>`, `<Toaster>`
- **THEN** the outlet content is wrapped by `<RootErrorBoundary>`

#### Scenario: Authenticated public route structure

- **WHEN** any route under `<PublicLayout>` is rendered with an authenticated session
- **THEN** the DOM contains, in order: `<PrivateHeader>`, `<RoleNav>`, `<main>` with `<Outlet />`, `<Footer>`, `<Toaster>`
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

---

### Requirement: Layout initializes theme before React hydrates

The system SHALL include an inline `<script>` in `public/index.html` (before the React root script) that reads `localStorage.getItem('theme')` and conditionally adds the `light` class to `document.documentElement`.

#### Scenario: Inline script applies light class on reload of private route

- **WHEN** the browser parses `index.html` and `localStorage.theme === 'light'`
- **THEN** `document.documentElement.classList.add('light')` executes synchronously before any React render
- **THEN** no flash of dark theme occurs on private route reload

#### Scenario: Inline script is a no-op when preference is dark or absent

- **WHEN** the browser parses `index.html` and `localStorage.theme` is `'dark'` or absent
- **THEN** no class is added to `document.documentElement`
- **THEN** the page renders in dark mode (global default)

---

### Requirement: PrivateLayout manages light class lifecycle

The system SHALL have `PrivateLayout` add the `light` class to `<html>` on mount and remove it on unmount, so public routes remain dark and private routes default to light.

#### Scenario: Entering private routes applies light theme

- **WHEN** `PrivateLayout` mounts and `localStorage.theme !== 'dark'`
- **THEN** the `light` class is added to `document.documentElement`

#### Scenario: Leaving private routes restores dark theme

- **WHEN** `PrivateLayout` unmounts (user navigates to public route or logs out)
- **THEN** the `light` class is removed from `document.documentElement`

---

### Requirement: ThemeToggle visible only in admin/staff views

The system SHALL render `<ThemeToggle>` in `<PrivateHeader>` only when the user is NOT in client view (i.e., `canUseCart` is false).

#### Scenario: ThemeToggle visible for admin roles

- **WHEN** an authenticated ADMIN/STOCK/PEDIDOS user views a private route
- **THEN** `<ThemeToggle>` is rendered within `<PrivateHeader>`

#### Scenario: ThemeToggle hidden for client view

- **WHEN** a CLIENT (or ADMIN in client view path) views the store
- **THEN** `<ThemeToggle>` is NOT rendered
