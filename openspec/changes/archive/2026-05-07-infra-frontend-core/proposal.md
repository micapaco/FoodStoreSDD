## Why

El proyecto no tiene frontend. Sin la base operativa del frontend (Vite + React + TypeScript + librerías core), ninguna feature de interfaz puede implementarse. Este change establece el casco ejecutable del frontend que todos los changes posteriores (`auth`, `cart`, `pedidos`, etc.) necesitan para construir encima.

## What Changes

- Nuevo proyecto `frontend/` con Vite (SWC) + React 18 + TypeScript strict
- Tailwind CSS v3 configurado con PostCSS y purging de clases en producción
- React Router v6 con scaffold de rutas públicas y privadas (rutas vacías, sin lógica de auth aún)
- TanStack Query `QueryClientProvider` en el App root con defaults razonables (`staleTime`, `retry`, `refetchOnWindowFocus`)
- Axios instance centralizada en `shared/api/axios.ts`:
  - `baseURL` desde `VITE_API_BASE_URL`
  - Interceptor de request: adjunta `Authorization: Bearer <token>` desde `authStore`
  - Interceptor de response: ante 401, intenta refresh con `refreshToken`, actualiza `authStore` y reintenta la petición original
- 4 Zustand stores:
  - `authStore`: `accessToken`, `refreshToken`, `user`, `isAuthenticated` — persiste en localStorage
  - `cartStore`: `items`, acciones CRUD, selectores de totales — persiste en localStorage
  - `paymentStore`: `checkoutStep`, `preferenceId`, `paymentStatus`, `error` — **sin** persistencia (estado transitorio)
  - `uiStore`: `theme`, `sidebarOpen`, `toasts` — persiste solo `theme`
- `frontend/.env.example` con `VITE_API_BASE_URL` y `VITE_MERCADOPAGO_PUBLIC_KEY`
- Estructura Feature-Sliced Design (FSD): `pages/`, `features/`, `shared/`, `entities/`, `widgets/`

## Capabilities

### New Capabilities

- `frontend-app-shell`: Base ejecutable del frontend — Vite, React, TypeScript strict, Tailwind, React Router scaffold, env vars, estructura FSD de carpetas
- `frontend-http-client`: Axios instance con interceptores JWT (attach Bearer + refresh automático en 401)
- `frontend-state-stores`: Los cuatro stores Zustand con sus contratos de estado, acciones y política de persistencia

### Modified Capabilities

<!-- Sin cambios en specs existentes — todos los specs actuales son de backend -->

## Impact

- Crea el directorio `frontend/` desde cero
- Sin cambios en el backend
- Sin cambios en contratos de API (Axios consume la API que ya existe en `openspec/specs/backend-*`)
- Agrega `frontend/.env.example` — el PostToolUse hook sincronizará `frontend/.env` automáticamente cuando se cree
- Dependencia de los changes `04` a `19` sobre este change: sin base frontend, ninguna feature de UI es implementable
