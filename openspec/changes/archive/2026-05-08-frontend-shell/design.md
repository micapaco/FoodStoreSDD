# Design — frontend-shell

## Approach

El shell es la capa transversal que sostiene toda la app autenticada del frontend. Se construye sobre **lo que ya dejó el change 03**: `createBrowserRouter` (data mode), 4 stores Zustand, axios con refresh queue y QueryClientProvider. El shell **no reemplaza** ninguno de esos componentes — los **compone**.

Decisiones arquitectónicas clave:

1. **Guards como componentes wrapper, no como `loader` ni `action`**. Aunque el router está en data mode, los guards se implementan como componentes React que renderizan `<Outlet />` o un `<Navigate>`. Razón: el estado de auth vive en Zustand (síncrono, en memoria/localStorage), no requiere fetch. Los `loader` se justifican cuando hay carga de datos remota; aquí no hay. Mantenemos los guards declarativos y testables como componentes puros.
2. **Composición de guards, no AND/OR mágico**. `<RoleRoute roles={['ADMIN', 'STOCK']}>` ya implica autenticación: primero corre `<ProtectedRoute>` por dentro, luego chequea rol. No hay un único guard "configurable" — hay piezas pequeñas que se anidan.
3. **Layout público y privado separados, no condicional dentro de un layout único**. Un layout único con `if (isAuthenticated) ...` es fuente de bugs (header parpadea durante refresh, nav se duplica). Dos layouts permiten tipar la sesión como `User` (no `User | null`) dentro del `<PrivateLayout>`.
4. **Error handling global instalado una sola vez en `main.tsx`**, no por feature. El handler del response interceptor de axios despacha al `uiStore.addToast` y al `authStore.logout` cuando corresponde. Los componentes nunca leen errores Axios crudos — usan `parseHttpError`.
5. **Toaster y ErrorBoundary montados en cada layout**, no en `App.tsx`. Razón: `RouterProvider` no expone un wrapping fácil para todas las rutas, y ambos elementos necesitan acceso al árbol de React y al router. Montarlos en cada layout asegura presencia consistente y permite estilos diferenciados (público vs privado).
6. **Refresh ya está resuelto por axios**. El shell solo agrega: si refresh falla, redirect a `/login?from=<path>`. El interceptor llama `authStore.logout()` y publica un toast "Tu sesión expiró", el guard `<ProtectedRoute>` detecta `!isAuthenticated` en el siguiente render y navega.

## Components affected

### Archivos nuevos

```
frontend/src/
├── app/
│   ├── router.tsx                          ← reescritura completa
│   ├── guards/
│   │   ├── ProtectedRoute.tsx              ← requiere isAuthenticated
│   │   ├── RoleRoute.tsx                   ← requiere uno de los roles dados
│   │   └── GuestOnlyRoute.tsx              ← redirige si ya está autenticado
│   └── layouts/
│       ├── PublicLayout.tsx                ← header público + outlet + footer + toaster + boundary
│       ├── PrivateLayout.tsx               ← header privado + nav rol + outlet + footer + toaster + boundary
│       └── RootErrorBoundary.tsx           ← captura render errors
├── widgets/
│   ├── header/
│   │   ├── PublicHeader.tsx
│   │   └── PrivateHeader.tsx               ← avatar, badge rol, menú logout
│   ├── nav/
│   │   └── RoleNav.tsx                     ← items dinámicos según rol activo
│   ├── footer/
│   │   └── Footer.tsx
│   └── toaster/
│       └── Toaster.tsx                     ← lee uiStore.toasts, render + auto-dismiss
├── shared/
│   ├── lib/
│   │   └── http/
│   │       ├── parseHttpError.ts           ← normaliza AxiosError → AppHttpError
│   │       └── installErrorHandler.ts      ← engancha el handler al response interceptor
│   └── types/
│       └── http.ts                         ← AppHttpError type
└── pages/
    ├── HomePage.tsx                        ← placeholder catálogo
    ├── LoginPage.tsx                       ← placeholder change auth
    ├── RegisterPage.tsx                    ← placeholder change auth
    ├── ProfilePage.tsx                     ← placeholder
    ├── CartPage.tsx                        ← placeholder
    ├── CheckoutPage.tsx                    ← placeholder
    ├── OrdersListPage.tsx                  ← placeholder
    ├── OrderDetailPage.tsx                 ← placeholder
    ├── NotFoundPage.tsx                    ← 404
    ├── ForbiddenPage.tsx                   ← 403
    └── admin/
        ├── AdminDashboardPage.tsx
        ├── ProductsAdminPage.tsx
        ├── CategoriesAdminPage.tsx
        ├── OrdersAdminPage.tsx
        └── UsersAdminPage.tsx
```

### Archivos modificados

- `frontend/src/main.tsx` — agrega llamada a `installErrorHandler()` antes del `createRoot`.

### Archivos no tocados (consumidos)

- `frontend/src/shared/api/axios.ts` — el shell hookea su handler ahí pero no edita el archivo (vía `installErrorHandler` que llama métodos del módulo).
- `frontend/src/shared/stores/*` — solo se consumen, no se modifican.

## Data model changes

Ningún cambio en stores. Se agrega un type en `shared/types/http.ts`:

```ts
export type AppHttpError = {
  status: number          // 0 si no hubo respuesta (network)
  code: string            // 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVER_ERROR' | 'NETWORK' | 'UNKNOWN'
  message: string         // mensaje user-facing en español
  detail?: unknown        // payload original (debug)
}
```

Y se confirma que `Toast` (ya existente en `shared/types/ui`) tiene los campos suficientes: `id, kind: 'success' | 'error' | 'info' | 'warning', message, durationMs?`.

## Routing contract

Mapa completo del shell. Cada fila define ruta, layout, guard y rol(es) requeridos.

| Ruta | Layout | Guard | Roles |
|------|--------|-------|-------|
| `/` | Public | — | público |
| `/login` | Public | GuestOnly | público (rechaza autenticados) |
| `/register` | Public | GuestOnly | público (rechaza autenticados) |
| `/perfil` | Private | Protected + Role | CLIENT |
| `/carrito` | Private | Protected + Role | CLIENT |
| `/checkout` | Private | Protected + Role | CLIENT |
| `/pedidos` | Private | Protected + Role | CLIENT |
| `/pedidos/:id` | Private | Protected + Role | CLIENT |
| `/admin` | Private | Protected + Role | ADMIN |
| `/admin/productos` | Private | Protected + Role | ADMIN, STOCK |
| `/admin/categorias` | Private | Protected + Role | ADMIN |
| `/admin/pedidos` | Private | Protected + Role | ADMIN, PEDIDOS |
| `/admin/usuarios` | Private | Protected + Role | ADMIN |
| `/403` | Public | — | público |
| `*` | Public | — | público (404) |

Reglas de redirect:
- Usuario autenticado entra a `/login` o `/register` → redirect a la home según su rol primario:
  - ADMIN → `/admin`
  - STOCK → `/admin/productos`
  - PEDIDOS → `/admin/pedidos`
  - CLIENT → `/`
- Usuario no autenticado entra a ruta privada → redirect a `/login?from=<path>` para volver luego.
- Usuario autenticado con rol insuficiente → redirect a `/403`.

## Error handling contract

`parseHttpError(error: unknown): AppHttpError`:

| Input | status | code | message |
|-------|--------|------|---------|
| AxiosError sin response | 0 | NETWORK | "Sin conexión con el servidor" |
| AxiosError 401 | 401 | UNAUTHORIZED | "Tu sesión expiró" |
| AxiosError 403 | 403 | FORBIDDEN | "No tenés permiso para esta acción" |
| AxiosError 404 | 404 | NOT_FOUND | "Recurso no encontrado" |
| AxiosError 422 | 422 | VALIDATION | mensaje del backend |
| AxiosError 5xx | 5xx | SERVER_ERROR | "Error del servidor, intentá de nuevo" |
| Otro (Error o desconocido) | 0 | UNKNOWN | mensaje genérico |

`installErrorHandler()`:
- Se llama una sola vez en `main.tsx` antes de montar React.
- Registra un handler en el response interceptor existente: cuando el refresh ya falló y se llamó `logout()`, se agrega un `addToast({ kind: 'warning', message: 'Tu sesión expiró' })`.
- Para 5xx no transitorios, agrega toast `{ kind: 'error' }` automáticamente.
- Para 403, agrega toast `{ kind: 'error', message: 'Sin permisos' }`.
- 401 con refresh exitoso → silencioso (el caller nunca ve el error).
- Errores de validación (422) NO se publican como toast global — los maneja la feature porque suelen ir asociados a campos de formulario.

## Risks and tradeoffs

**Riesgo 1 — Cuando llegue auth, podría querer cambiar el shape del store.**
Mitigación: el `authStore` ya está definido y aceptado en el change 03. Si `auth` necesita un campo nuevo, será un MODIFIED del spec `frontend-state-stores`, no del shell. El shell solo lee `isAuthenticated`, `user.roles`, `accessToken` — campos garantizados por el contrato actual.

**Riesgo 2 — Toaster montado en dos layouts duplica toasts si la app navega entre layouts mientras hay un toast activo.**
Mitigación: el toaster lee del store global; el toast tiene un `id` único. Si dos `<Toaster />` están montados simultáneamente (no debería ocurrir porque solo hay un layout activo), se renderizaría duplicado. El test verifica que solo hay un layout activo a la vez.

**Riesgo 3 — Race condition entre refresh y navegación.**
Si una request 401 dispara refresh y mientras tanto el usuario navega, podría redirigir a `/login` por un instante antes de que termine refresh. Mitigación: el interceptor ya tiene la queue de promesas (change 03). El guard `<ProtectedRoute>` lee `isAuthenticated`, que solo cambia a `false` cuando `logout()` se llama, no durante el refresh. Refresh exitoso no toca `isAuthenticated`.

**Riesgo 4 — Error boundary no atrapa errores async.**
Por diseño, React error boundary solo atrapa errores de render. Errores async (en queries, mutations, useEffect) deben ser manejados por TanStack Query o `try/catch`. El shell no intenta resolver esto a nivel boundary; lo cubre el handler global de errores HTTP.

**Tradeoff — guards como componentes vs `loader`s.**
- Guards como componentes: simples, testables como cualquier componente, no requieren conocer `react-router` data APIs, fácil de migrar a declarative mode si hiciera falta.
- Loaders: integran mejor con suspense y data fetching, pero acoplan rutas a fetchers y el estado de auth aquí es síncrono.
Elegimos componentes wrapper. Si en el futuro se introduce data fetching crítico de boot (ej. preloading sesión desde un cookie httpOnly), se puede mover a un `loader` sin romper specs.

**Tradeoff — pages como placeholders.**
El shell crea archivos `*Page.tsx` con render mínimo (`<h1>` + "pendiente"). Alternativa: dejar las rutas con `element={null}` y crear los componentes recién en sus changes. Elegimos placeholders porque permiten validar el shell end-to-end (navegación + guards + layouts) sin esperar otros changes. Los archivos quedan listos para que el feature los reemplace con lógica.

## Validation strategy

- Tests unitarios de guards (`ProtectedRoute`, `RoleRoute`, `GuestOnlyRoute`) con `MemoryRouter` y un `authStore` mockeado: usuario sin token, con token + rol correcto, con token + rol insuficiente.
- Tests del helper `parseHttpError` con AxiosError simulados de todos los códigos.
- Smoke test manual: navegar a cada ruta del mapa, sin sesión, con sesión CLIENT, con sesión ADMIN. Verificar redirects correctos.
- Lint + tsc strict deben pasar.
