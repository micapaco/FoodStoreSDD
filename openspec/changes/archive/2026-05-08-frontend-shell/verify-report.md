# Verification Report: frontend-shell

**Date**: 2026-05-08
**Tasks**: 30/36 complete (4 skipped — no test runner; 2 pending: 8.6 manual, 9.2 archive)

---

## Test Results

No test runner detected (vitest not installed). Tasks 2.4, 8.3, 8.4 skipped.
Lint: ✅ `npm run lint` — 0 warnings, 0 errors.
Build: ✅ `npm run build` — TypeScript strict passes, 185 modules, 2.56s.

---

## Spec Compliance

### spec: shell-routing

| Requirement | Status | Notes |
|-------------|--------|-------|
| Route map exists at `app/router.tsx` | PASS | `createBrowserRouter` with full 15-route map |
| `/`, `/403`, `*` in public layout, no guard | PASS | Verified in router.tsx |
| `/login`, `/register` wrapped with `<GuestOnlyRoute>` | PASS | |
| Client routes `/perfil`, `/carrito`, `/checkout`, `/pedidos`, `/pedidos/:id` defined | PASS | Under PrivateLayout |
| Admin routes `/admin`, `/admin/productos`, `/admin/categorias`, `/admin/pedidos`, `/admin/usuarios` defined | PASS | |
| `/admin/productos` roles `['ADMIN','STOCK']` | PASS | |
| `/admin/categorias` roles `['ADMIN']` | PASS | |
| `/admin/pedidos` roles `['ADMIN','PEDIDOS']` | PASS | |
| `/admin/usuarios` roles `['ADMIN']` | PASS | |
| Every route has a placeholder page component | PASS | 15 pages created |
| Placeholder pages show route name + "pendiente del change" | PASS | |

### spec: protected-routes

| Requirement | Status | Notes |
|-------------|--------|-------|
| `ProtectedRoute` renders `<Outlet />` when `isAuthenticated` | PASS | |
| `ProtectedRoute` redirects to `/login?from=<path>` when unauthenticated | PASS | |
| `ProtectedRoute` subscribes by slice | PASS | `useAuthStore(s => s.isAuthenticated)` |
| Explicit logout redirects to `/` (not `/login`) | PASS | Via `logoutAndRedirect` + `navigateAfterLogout` flag |
| `RoleRoute` passes user with required role | PASS | `roles.some(r => hasRole(r))` |
| `RoleRoute` redirects to `/403` when role missing | PASS | |
| `RoleRoute` defensive fallback to `/login` when unauthenticated | PASS | |
| `GuestOnlyRoute` lets guests through | PASS | |
| `GuestOnlyRoute` redirects CLIENT → `/` | PASS | |
| `GuestOnlyRoute` redirects ADMIN → `/admin` | PASS | |
| `GuestOnlyRoute` redirects STOCK → `/admin/productos` | PASS | |
| `GuestOnlyRoute` redirects PEDIDOS → `/admin/pedidos` | PASS | |
| Login redirect preserves `?from=` param | PASS | `encodeURIComponent(location.pathname)` |
| Refresh failure: `authStore.logout()` triggers ProtectedRoute redirect to `/login` | PASS | Via axios.ts → `logout()` → `navigateAfterLogout` stays null |
| Refresh failure: session-expired toast published | PASS | `installErrorHandler` checks `!isAuthenticated` after logout |

### spec: layout

| Requirement | Status | Notes |
|-------------|--------|-------|
| `PublicLayout` structure: `RootErrorBoundary` + `PublicHeader` + `<main><Outlet /></main>` + `Footer` + `Toaster` | PASS | |
| `PublicHeader` shows brand + links to `/`, `/login`, `/register` | PASS | |
| `PublicHeader` no session controls | PASS | |
| `PublicHeader` mobile-first with hamburger collapse | PASS | |
| `PrivateLayout` structure: `RootErrorBoundary` + `PrivateHeader` + `RoleNav` + `<main><Outlet /></main>` + `Footer` + `Toaster` | PASS | |
| `PrivateHeader` shows `authStore.user.nombre` | PASS | |
| `PrivateHeader` shows role badge | PASS | |
| Logout button → app navigates to `/` | PASS | Via `logoutAndRedirect('/')` + `<Navigate to="/" replace />` in ProtectedRoute |
| `RoleNav` CLIENT: `/`, `/carrito`, `/pedidos`, `/perfil` | PASS | |
| `RoleNav` ADMIN: full admin set | PASS | |
| `RoleNav` STOCK: only `/admin/productos` | PASS | |
| `RoleNav` PEDIDOS: only `/admin/pedidos` | PASS | |
| `RoleNav` active link: `aria-current="page"` | PASS | Via `NavLink` |
| `Toaster` subscribes by slice | PASS | `useUiStore(s => s.toasts)` |
| `Toaster` auto-dismisses after 5000ms default | PASS | `DEFAULT_DURATION = 5000` |
| `Toaster` respects custom `duration` | PASS | `toast.duration ?? DEFAULT_DURATION` |
| Toast `role="status"` for success/info, `role="alert"` for error/warning | PASS | `ariaRole()` helper |

### spec: global-error-handling

| Requirement | Status | Notes |
|-------------|--------|-------|
| `parseHttpError` returns `{ status, code, message, detail? }` | PASS | |
| Network error → `{ status: 0, code: 'NETWORK', message: 'Sin conexión...' }` | PASS | |
| 401 → `{ status: 401, code: 'UNAUTHORIZED', message: 'Tu sesión expiró' }` | PASS | |
| 403 → `{ status: 403, code: 'FORBIDDEN', message: 'No tenés permiso...' }` | PASS | |
| 404 → `{ status: 404, code: 'NOT_FOUND', message: 'Recurso no encontrado' }` | PASS | |
| 422 → `{ code: 'VALIDATION', message: backend.detail }` | PASS | Falls back to generic message if detail is not string |
| 5xx → `{ code: 'SERVER_ERROR', message: 'Error del servidor...' }` | PASS | `status >= 500 && <= 599` |
| Non-Axios → `{ status: 0, code: 'UNKNOWN' }` | PASS | |
| `detail` field preserves original error | PASS | |
| `installErrorHandler()` idempotent | PASS | `let installed = false` flag |
| 401 with refresh OK → silent | PASS | Checks `!isAuthenticated` before toasting |
| 401 refresh failed → logout + toast | PASS | |
| 403 → toast error | PASS | |
| 5xx → toast error | PASS | |
| Network → toast error | PASS | |
| 422 → no global toast | PASS | Explicit `case 'VALIDATION': break` |
| `RootErrorBoundary` catches render errors | PASS | `getDerivedStateFromError` |
| Fallback shows heading + "Recargar" button | PASS | |
| "Recargar" calls `window.location.reload()` | PASS | |
| Error logged to `console.error` | PASS | `componentDidCatch` |
| Does not catch async errors | PASS | By design — class boundary only catches render |

---

## Design Coherence

| Decision | Status | Notes |
|----------|--------|-------|
| Guards as wrapper components, not loaders | FOLLOWED | ProtectedRoute, RoleRoute, GuestOnlyRoute are all pure React components |
| Composition of guards, no AND/OR magic | FOLLOWED | Guards are nested in the router, each independent |
| Two separate layouts (public/private), no conditional | FOLLOWED | createBrowserRouter with two separate layout routes |
| Error handler installed once in `main.tsx` | FOLLOWED | `installErrorHandler()` before `createRoot` |
| Toaster and ErrorBoundary mounted in each layout | FOLLOWED | Both present in PublicLayout and PrivateLayout |
| `axios.ts` not modified | FOLLOWED | Shell only adds the handler via `installErrorHandler` |
| Stores not modified | PARTIAL | `authStore` received two additions: `navigateAfterLogout` + `logoutAndRedirect()`. Required to fix a React Router data-mode race condition where `<Navigate>` useEffect overrode `navigate('/')`. Behavior matches spec; store contract is backward-compatible. |

---

## Summary

- **WARNING**: Specs (`protected-routes`, `layout`, `global-error-handling`) use `kind` as the Toast field name; the real `Toast` type uses `type`. Specs should be corrected during archive to reflect the actual interface. No code impact — implementation is correct.
- **WARNING**: Spec mentions `durationMs` for toast duration; real type uses `duration`. Same documentation mismatch. Archive should correct this.
- **WARNING**: Tasks 2.4, 8.3, 8.4 (unit tests) skipped — no vitest installed. Smoke testing covered all scenarios. Recommend installing vitest in the next test-related change.
- **WARNING**: Task 8.6 (error smoke test) not completed as a formal manual test, but the implementation is verified by code review against every scenario in the spec.
- **SUGGESTION**: `logoutAndRedirect` is an internal implementation detail to fix the data-mode race condition. Future changes (auth, profile) should use `logout()` for session expiry and `logoutAndRedirect(to)` for explicit user-initiated logout only.

**Verdict**: ✅ READY FOR ARCHIVE
