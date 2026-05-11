# Change Proposal — frontend-shell

## Why

El change `infra-frontend-core` dejó la app con scaffolding técnico (Vite, TS strict, Tailwind, React Router data mode con outlets vacíos, TanStack Query, axios con interceptor JWT y refresh queue, 4 stores Zustand). Lo que **no existe todavía** es el "tejido transversal" que sostiene la experiencia del usuario:

- No hay protección de rutas: cualquiera puede navegar a `/admin` o `/perfil`.
- No hay control por rol: un `CLIENT` podría entrar a rutas de `ADMIN` si las tipeara.
- No hay layout base: header, navegación, footer y main viven sueltos cuando aparezcan páginas.
- No hay manejo global de errores HTTP: cada feature tendría que reinventar mensajes de 401/403/500.
- No hay sistema de toasts visible (el `uiStore` tiene `toasts: Toast[]`, pero nadie los renderiza).
- No hay error boundary: un error en un componente rompe toda la app sin feedback.

Sin este shell, ningún feature posterior (auth, catálogo, pedidos, panel admin) puede integrarse de manera consistente. Cada feature tendría que duplicar lógica de protección, layout y errores. La rúbrica del proyecto exige UX cuidada (skeletons, toasts, empty states, modales de confirmación) — esto se construye una sola vez, en el shell.

Las historias de usuario US-000e (sesión expira → refresh transparente), US-066 (rutas protegidas por rol), US-067 (UI consistente con header/nav/footer), US-075 y US-076 (manejo de errores y feedback global) dependen de este change.

## What Changes

- **Guards de ruta declarativos**: componentes `<ProtectedRoute>` (requiere auth) y `<RoleRoute>` (requiere uno o más roles) que envuelven `<Outlet />`. Si no autenticado → redirect a `/login`. Si autenticado pero rol insuficiente → redirect a `/403` o página de "sin permisos".
- **Guard de rutas para invitados**: `<GuestOnlyRoute>` para `/login` y `/register` — un usuario autenticado que entra a `/login` debe ir a su home según rol.
- **Layout público y privado**: `<PublicLayout>` con header simple + outlet + footer; `<PrivateLayout>` con header autenticado (avatar, logout, badge de rol), nav lateral por rol y outlet. Ambos renderizan toasts y error boundary.
- **Mapa de rutas completo del sistema**: catálogo `/`, login, registro, perfil, carrito, checkout, pedidos cliente y rutas admin segmentadas por rol. Cada ruta usa el guard correspondiente.
- **Manejo global de errores HTTP**: helper `parseHttpError(error)` que normaliza errores Axios a un shape `{ status, code, message }` y handler que dispara toast + acción según código (401 → logout silencioso, 403 → toast "sin permisos", 5xx → toast "error del servidor"). Integrado al response interceptor.
- **Sistema de toasts renderizado**: componente `<Toaster />` que lee `uiStore.toasts` y los muestra con timeout. Montado una vez en cada layout.
- **Error boundary global**: `<RootErrorBoundary>` que captura errores de render, muestra fallback con botón "recargar" y reportea (logger).
- **Refresh transparente ya existente**: el axios interceptor del change 03 ya hace refresh + queue. El shell solo agrega: cuando refresh falla → además de `logout()`, redirect a `/login` con `?from=<currentPath>` para reintentar luego.
- **Stores ya existentes (no recrear)**: `authStore`, `uiStore`, `cartStore`, `paymentStore` quedan tal como están. El shell solo los **consume**.

## Capabilities

### New Capabilities

- **shell-routing** — Mapa completo de rutas de la app con su jerarquía pública/privada y la asignación rol → ruta. Define qué ruta existe y bajo qué guard.
- **protected-routes** — Mecanismo de guards para rutas privadas y por rol. Define el comportamiento ante usuario no autenticado, autenticado sin rol suficiente y refresh fallido.
- **layout** — Layouts público y privado, header con sesión, navegación adaptativa por rol, footer y montaje de elementos transversales (toaster, error boundary).
- **global-error-handling** — Captura, normalización y feedback de errores HTTP y de render. Integra el response interceptor de axios con el sistema de toasts y el error boundary.

### Modified Capabilities

Ninguna. Las specs `frontend-app-shell`, `frontend-http-client` y `frontend-state-stores` del change 03 quedan estables. Este change agrega capabilities nuevas sin alterar las existentes.

## Impact

**Frontend (todos los archivos nuevos)**:

- `frontend/src/app/router.tsx` — reescritura completa con todas las rutas y guards aplicados.
- `frontend/src/app/guards/ProtectedRoute.tsx` — guard de autenticación.
- `frontend/src/app/guards/RoleRoute.tsx` — guard por rol.
- `frontend/src/app/guards/GuestOnlyRoute.tsx` — guard inverso (solo invitados).
- `frontend/src/app/layouts/PublicLayout.tsx` — layout público (header simple, outlet, footer, toaster, error boundary).
- `frontend/src/app/layouts/PrivateLayout.tsx` — layout autenticado (header con sesión, nav por rol, outlet, toaster, error boundary).
- `frontend/src/app/layouts/RootErrorBoundary.tsx` — error boundary de aplicación.
- `frontend/src/widgets/header/PublicHeader.tsx` y `PrivateHeader.tsx` — encabezados.
- `frontend/src/widgets/nav/RoleNav.tsx` — nav lateral con items según rol.
- `frontend/src/widgets/footer/Footer.tsx` — footer básico.
- `frontend/src/widgets/toaster/Toaster.tsx` — render de `uiStore.toasts`.
- `frontend/src/shared/lib/http/parseHttpError.ts` — normaliza errores Axios.
- `frontend/src/shared/lib/http/installErrorHandler.ts` — instala handler global en el response interceptor.
- `frontend/src/pages/NotFoundPage.tsx`, `ForbiddenPage.tsx` — placeholders 404 y 403.
- Páginas placeholders mínimas para cada ruta del mapa (sólo título + "pendiente del change X") — el shell valida ruteo, no implementa features.

**Backend**: ninguno. El shell no toca el backend.

**Specs**: 4 nuevas (`shell-routing`, `protected-routes`, `layout`, `global-error-handling`).

**Dependencias**:
- `infra-frontend-core` (archivado) — provee scaffolding, stores y axios con refresh queue.
- `auth` (pendiente) — el shell NO bloquea a `auth`. Construye guards contra el `authStore` ya existente. Cuando `auth` llene el store con datos reales, los guards funcionan sin cambios.

**Riesgos**: bajos. El shell no introduce dependencias nuevas. Toda la lógica vive en el frontend y se valida con navegación manual + tests unitarios de guards.
