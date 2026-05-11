## MODIFIED Requirements

### Requirement: Route map covers all functional areas of the app

The system SHALL define a single route map at `frontend/src/app/router.tsx` that contains every URL the user can reach: public pages, auth pages, client area, admin area and error pages.

#### Scenario: Public catalog reachable at root

- **WHEN** any user navigates to `/`
- **THEN** the catalog placeholder page renders inside the public layout
- **THEN** no auth check is performed

#### Scenario: Auth pages exist for guests

- **WHEN** any user navigates to `/login` or `/register`
- **THEN** the corresponding placeholder page renders inside the public layout

#### Scenario: Client area routes exist

- **WHEN** the route map is inspected
- **THEN** routes `/perfil`, `/direcciones`, `/carrito`, `/checkout`, `/pedidos` and `/pedidos/:id` are defined under the private layout

#### Scenario: Admin area routes exist

- **WHEN** the route map is inspected
- **THEN** routes `/admin`, `/admin/productos`, `/admin/categorias`, `/admin/pedidos` and `/admin/usuarios` are defined under the private layout

#### Scenario: Error routes exist

- **WHEN** any user navigates to a path not declared in the map
- **THEN** the 404 page renders inside the public layout
- **WHEN** any user navigates to `/403`
- **THEN** the forbidden page renders inside the public layout

---

### Requirement: Each route is bound to the correct guard

The system SHALL associate every route with a guard so the route can only be entered under the documented conditions.

#### Scenario: Public routes have no guard

- **WHEN** routes `/`, `/403` or `*` (404) are evaluated
- **THEN** they render without any guard wrapper

#### Scenario: Guest-only routes reject authenticated users

- **WHEN** routes `/login` and `/register` are declared
- **THEN** they are wrapped with `<GuestOnlyRoute>`

#### Scenario: Client routes require CLIENT role

- **WHEN** routes `/perfil`, `/direcciones`, `/carrito`, `/checkout`, `/pedidos`, `/pedidos/:id` are declared
- **THEN** they are wrapped with `<ProtectedRoute>` plus `<RoleRoute roles={['CLIENT']}>`

#### Scenario: Admin route requires ADMIN role

- **WHEN** route `/admin` is declared
- **THEN** it is wrapped with `<ProtectedRoute>` plus `<RoleRoute roles={['ADMIN']}>`

#### Scenario: Stock route accepts ADMIN or STOCK

- **WHEN** route `/admin/productos` is declared
- **THEN** it is wrapped with `<RoleRoute roles={['ADMIN', 'STOCK']}>`

#### Scenario: Categories route requires ADMIN only

- **WHEN** route `/admin/categorias` is declared
- **THEN** it is wrapped with `<RoleRoute roles={['ADMIN']}>`

#### Scenario: Orders admin route accepts ADMIN or PEDIDOS

- **WHEN** route `/admin/pedidos` is declared
- **THEN** it is wrapped with `<RoleRoute roles={['ADMIN', 'PEDIDOS']}>`

#### Scenario: Users admin route requires ADMIN only

- **WHEN** route `/admin/usuarios` is declared
- **THEN** it is wrapped with `<RoleRoute roles={['ADMIN']}>`
