## Why

Auth es el primer feature funcional real del sistema. Sin ella no hay ownership de recursos, roles ni rutas protegidas en ninguna capa. El backend (infra-backend-core + infra-database) y el shell del frontend están completos — este es el momento natural para implementar la capa de autenticación end-to-end.

## What Changes

- **Backend — módulo `auth`**: endpoints POST /api/v1/auth/register, POST /api/v1/auth/login, POST /api/v1/auth/refresh, POST /api/v1/auth/logout, GET /api/v1/auth/me. Incluye rate limiting específico (5 intentos / 15 min) en login.
- **Backend — módulo `refreshtokens`**: modelo `RefreshToken` en BD (token_hash SHA-256, expires_at, revoked_at). Rotación en cada refresh. Detección de replay attack (familia de tokens): si se detecta reuso de un token ya utilizado, se revocan TODOS los tokens del usuario.
- **Backend — módulo `usuarios`**: modelo `Usuario` + `UsuarioRol` (pivot M:M). Rol CLIENT asignado automáticamente en el servicio de registro — nunca viene del request. RBAC con dependency `require_role()` inyectada por router.
- **Frontend — páginas y formularios**: `LoginPage` y `RegisterPage` con formularios TanStack Form + validación zod. Flujo completo: completar form → llamar API → guardar tokens en authStore → navegar.
- **Frontend — hook `useAuth`**: abstracción sobre TanStack Query para login, logout, register. Actualización de authStore desde las mutaciones.
- **Frontend — interceptor 401**: el interceptor de Axios ya existe en frontend-shell. Este change lo activa: detecta 401, llama POST /auth/refresh, reintenta la request original. Si el refresh falla → logout automático.

## Capabilities

### New Capabilities

- `auth-api`: Contratos REST del módulo auth — los 5 endpoints, schemas (RegisterRequest, LoginRequest, TokenResponse, UserResponse), status codes y comportamiento de error seguro (sin diferenciar email/password incorrecto).
- `auth-tokens`: Ciclo de vida de los tokens JWT — access token (30 min, HS256, claims userId/email/roles), refresh token (7 días, UUID v4 opaco, almacenado como hash SHA-256 en BD). Rotación, revocación y detección de replay attack.
- `auth-rbac`: Sistema RBAC — 4 roles fijos (ADMIN, STOCK, PEDIDOS, CLIENT), dependency `get_current_user()`, dependency `require_role([Rol.X])`, respuestas 401/403, lista de rutas públicas.
- `auth-frontend`: UI de autenticación — LoginPage, RegisterPage, formularios con validación, hook `useAuth`, integración con authStore, activación del interceptor 401/refresh en Axios.

### Modified Capabilities

*(ninguna — auth es todo nuevo)*

## Impact

- **Backend**: nuevos módulos `app/modules/auth/`, `app/modules/refreshtokens/`, `app/modules/usuarios/`. Variables de entorno necesarias: `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`.
- **Frontend**: nuevas páginas `LoginPage`, `RegisterPage` bajo `/login` y `/register` (rutas públicas ya definidas en frontend-shell). Activación del interceptor 401 en `api/axios.ts`.
- **Dependencias existentes**: `python-jose`, `passlib[bcrypt]`, `slowapi` ya instaladas en `requirements.txt`. Sin nuevas dependencias de backend. Frontend: sin cambios en `package.json`.
- **Base de datos**: tablas `Usuario`, `Rol`, `UsuarioRol`, `RefreshToken` ya creadas por la migración de `infra-database`. Seed ya inserta los 4 roles y el usuario admin. Este change NO modifica el esquema.
