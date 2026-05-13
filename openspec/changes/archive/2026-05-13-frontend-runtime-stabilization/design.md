## Context

El backend cumple el contrato de auth (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/me`). El error observado en navegador era causado por configuración frontend: `VITE_API_BASE_URL` no existía porque `frontend/.env` no estaba creado. En Vite, una request relativa como `/api/v1/auth/login` puede ser proxied a `localhost:8000` por `vite.config.ts`, pero una request a `/auth/login` no coincide con el proxy.

También apareció una inconsistencia propia de estado persistido: `authStore` persistía `user` completo, pero versiones previas o estados parciales podían no traer `roles`. Cualquier componente que ejecutara `user.roles.includes(...)` rompía antes de que `/auth/me` pudiera rehidratar.

## Goals / Non-Goals

**Goals:**
- Hacer que el HTTP client funcione desde cero con o sin `frontend/.env`.
- Blindar el consumo de roles ante estado persistido incompleto.
- Evitar redirects post-login hacia rutas que el rol autenticado no puede acceder.
- Mantener build/lint verdes.

**Non-Goals:**
- Cambiar contrato backend de auth.
- Cambiar RBAC o permisos existentes.
- Implementar nuevas pantallas admin.
- Resolver optimización de bundle/chunk splitting.

## Decisions

### D1 - Fallback de API base a `/api/v1`

`axios.ts` define `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'`. En desarrollo, el proxy de Vite ya redirige `/api` a `http://localhost:8000`, por lo que el fallback funciona sin `.env`. En producción se sigue usando `VITE_API_BASE_URL`.

### D2 - Normalización centralizada de roles

`authStore` agrega `getSafeUserRoles()` y normaliza `user.roles` tanto al hacer `login()` como al migrar estado persistido. Los componentes consumen ese helper cuando necesitan evaluar permisos visuales.

### D3 - Resolución explícita de ruta post-login

`resolvePostLoginPath(roles, requestedPath)` permite volver al `from` solo si el rol puede acceder a esa ruta. Si no, redirige al home por rol (`ADMIN -> /admin`, `STOCK -> /admin/productos`, `PEDIDOS -> /admin/pedidos`, `CLIENT -> /`).

### D4 - Fixes de build sin cambios funcionales

Los errores TypeScript del dashboard se resuelven adaptando formatters de Recharts a tipos `unknown`/`ValueType` y el warning de checkout se corrige eliminando una suscripción no usada.

## Verification

- `npm.cmd run build`
- `npm.cmd run lint`
- `GET http://localhost:8000/api/v1/health`
- `POST http://localhost:8000/api/v1/auth/login`
- `GET http://localhost:5173/api/v1/health`
- `POST http://localhost:5173/api/v1/auth/login`
- Registro + login + `/auth/me` vía proxy de Vite para usuario `CLIENT`
