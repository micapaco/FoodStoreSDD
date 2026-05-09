## 1. Backend — Módulo usuarios

- [x] 1.1 Crear `app/modules/usuarios/model.py` — modelos `Usuario` y `UsuarioRol` con SQLModel (mapear tablas existentes, no crear nuevas columnas)
- [x] 1.2 Crear `app/modules/usuarios/repository.py` — `UsuarioRepository` extendiendo `BaseRepository[Usuario]`. Métodos: `get_by_email(email)`, `get_with_roles(user_id)`
- [x] 1.3 Registrar el módulo `usuarios` en el `UnitOfWork` (`app/core/uow.py`) como propiedad `self.usuarios`

## 2. Backend — Módulo refreshtokens

- [x] 2.1 Crear `app/modules/refreshtokens/model.py` — modelo `RefreshToken` con campos: `id`, `token_hash CHAR(64)`, `usuario_id`, `family_id UUID`, `expires_at TIMESTAMPTZ`, `revoked_at TIMESTAMPTZ NULL`, `created_at`
- [x] 2.2 Crear `app/modules/refreshtokens/repository.py` — `RefreshTokenRepository`. Métodos: `get_by_hash(hash)`, `revoke(token)`, `revoke_family(family_id)`, `create(token_data)`
- [x] 2.3 Registrar el módulo `refreshtokens` en el `UnitOfWork`

## 3. Backend — Core JWT y dependencias

- [x] 3.1 Agregar variables de entorno al `.env.example`: `SECRET_KEY`, `ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES=30`, `REFRESH_TOKEN_EXPIRE_DAYS=7`
- [x] 3.2 Actualizar `app/core/config.py` (Settings) con los 4 campos de auth
- [x] 3.3 Crear `app/core/security.py` — funciones: `create_access_token(data, expires_delta)`, `create_refresh_token()` (UUID v4), `hash_token(token)` (SHA-256), `verify_token(token, secret_key)` (retorna claims o lanza excepción)
- [x] 3.4 Crear `app/core/deps.py` — dependency `get_current_user(token: str = Depends(oauth2_scheme)) -> Usuario`. Decodifica JWT → carga usuario desde BD vía UoW → retorna.
- [x] 3.5 Crear `require_role(roles: list[str])` en `app/core/deps.py` — factory que retorna Callable. Llama `get_current_user`, verifica roles, lanza HTTP 403 si insuficiente.

## 4. Backend — Módulo auth (service y router)

- [x] 4.1 Crear `app/modules/auth/schemas.py` — `LoginRequest`, `RegisterRequest`, `TokenResponse`, `UserResponse` (sin password_hash)
- [x] 4.2 Crear `app/modules/auth/service.py` — `AuthService` con métodos: `register(data, uow)`, `login(data, uow)`, `refresh(refresh_token, uow)`, `logout(refresh_token, current_user, uow)`, `me(current_user)`
  - `register`: verifica email único, hashea password con bcrypt (cost≥12), crea usuario, asigna rol CLIENT automáticamente
  - `login`: busca usuario por email, verifica password, emite access + refresh token. Mensaje de error genérico (no diferencia email/password)
  - `refresh`: busca token por hash, verifica no revocado/expirado, emite nuevo par con mismo family_id, revoca el anterior. Si está revocado → revoca familia completa (replay attack)
  - `logout`: busca token por hash, marca `revoked_at = now()`
- [x] 4.3 Crear `app/modules/auth/router.py` — endpoints con prefijo `/api/v1/auth`:
  - `POST /register` → 201 UserResponse
  - `POST /login` → 200 TokenResponse. Aplicar `@limiter.limit("5/15minutes")`
  - `POST /refresh` → 200 TokenResponse
  - `POST /logout` → 204. Requiere `Depends(get_current_user)`
  - `GET /me` → 200 UserResponse. Requiere `Depends(get_current_user)`
- [x] 4.4 Registrar el router de auth en `app/api/v1/__init__.py` (equiv. a app/main.py en este proyecto)

## 5. Backend — Validación y tests manuales

- [x] 5.1 Verificar en Swagger (`/docs`) que los 5 endpoints aparecen con schemas correctos
- [x] 5.2 Probar flujo completo: register → login → access protected endpoint → refresh → logout → verificar token revocado
- [x] 5.3 Verificar rate limiting: 6 intentos de login fallidos → HTTP 429 con Retry-After
- [x] 5.4 Verificar replay attack: usar un refresh token dos veces → segunda vez retorna 401 y revoca familia

## 6. Frontend — Páginas de auth

- [x] 6.1 Validación inline sin zod (no instalado) — TanStack Form built-in validators en LoginPage y RegisterPage
- [x] 6.2 Crear `LoginPage` en `pages/LoginPage.tsx` — formulario TanStack Form, campo email + password, botón submit con loading state. En error: toast. En éxito: navegar a `?from=` o `/`
- [x] 6.3 Crear `RegisterPage` en `pages/RegisterPage.tsx` — formulario TanStack Form, campos nombre + apellido + email + password + confirmarPassword con cross-field validation. En éxito: toast + navegar a `/login`. En error: toast con mensaje de API
- [x] 6.4 `/login` y `/register` ya existen como rutas públicas en `app/router.tsx` bajo `GuestOnlyRoute`. `ProtectedRoute` NO las envuelve.

## 7. Frontend — Hook useAuth

- [x] 7.1 Crear `shared/hooks/useAuth.ts` — exporta `useLogin()`, `useRegister()`, `useLogout()`, `useRehydrateUser()` usando `useMutation`/`useEffect` de TanStack Query / React
- [x] 7.2 Crear `shared/api/auth.ts` — funciones: `loginApi(data)`, `registerApi(data)`, `refreshApi(refreshToken)`, `logoutApi(refreshToken)`, `meApi()`. Todas usan la instancia Axios compartida.

## 8. Frontend — Interceptor 401 y authStore

- [x] 8.1 Interceptor 401 completamente implementado en `api/axios.ts` desde el change frontend-shell. Lógica: 401 → refreshApi → retry. Si refresh falla → logoutAndRedirect.
- [x] 8.2 `authStore.partialize` incluye `accessToken`, `refreshToken`, `user`, `isAuthenticated`
- [x] 8.3 `useRehydrateUser()` en `main.tsx` → `AppBootstrap` llama `/auth/me` en mount si `accessToken` existe

## 9. Frontend — Pruebas manuales

- [x] 9.1 Flujo de registro: completar form → cuenta creada → redirige a /login
- [x] 9.2 Flujo de login: credenciales válidas → tokens en store → navega a /
- [x] 9.3 Flujo de login inválido: error toast sin revelar campo
- [x] 9.4 Flujo de refresh automático: con access token expirado, hacer una request → interceptor renueva el token transparentemente → request exitosa
- [x] 9.5 Flujo de logout: click en logout → tokens limpios → redirige a /
- [x] 9.6 Ruta protegida sin token: acceder a /admin → redirige a /login?from=/admin
- [x] 9.7 Verificar persistencia: login → recargar página → usuario sigue autenticado
