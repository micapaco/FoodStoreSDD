## Context

El stack base está completo: FastAPI con middleware global, manejo de errores RFC 7807 y rate limiting (slowapi) en `infra-backend-core`; PostgreSQL con SQLModel, Alembic, `BaseRepository[T]`, `UnitOfWork` y seed con los 4 roles + usuario admin en `infra-database`; React + Zustand + TanStack Query + Axios con interceptores en `infra-frontend-core`; shell de navegación, guards `ProtectedRoute`, stores `authStore`/`uiStore` y layout completo en `frontend-shell`.

Las tablas `Usuario`, `Rol`, `UsuarioRol` y `RefreshToken` ya existen en el esquema. El seed ya insertó los 4 roles (`ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT`) y el usuario administrador. No hay cambios al esquema de BD ni migraciones nuevas.

## Goals / Non-Goals

**Goals:**
- Implementar los 5 endpoints REST de auth (`/register`, `/login`, `/refresh`, `/logout`, `/me`) en FastAPI siguiendo la arquitectura Router → Service → UoW → Repository → Model.
- JWT access token (30 min, HS256) + refresh token (UUID v4, 7 días, almacenado como SHA-256 en `RefreshToken`).
- Rotación de refresh tokens en cada uso. Detección y defensa ante replay attack: si se detecta un token ya usado, revocar toda la familia del usuario.
- RBAC: dependency `get_current_user()` + `require_role([Rol.X])` inyectadas en routers. 401 = sin token / expirado, 403 = token válido pero rol insuficiente.
- Rate limiting en `/auth/login`: 5 intentos / IP / 15 minutos usando `@limiter.limit()` del slowapi ya configurado.
- Frontend: LoginPage y RegisterPage con TanStack Form + validación zod. Hook `useAuth` sobre TanStack Query. Activación del interceptor 401→refresh en `api/axios.ts`.

**Non-Goals:**
- No implementar cambio de contraseña ni recuperación de password (change `profile`).
- No implementar gestión de usuarios admin (change `admin-users`).
- No agregar campos ni tablas al esquema de BD — todo ya existe en la migración.
- No implementar OAuth/SSO.
- No implementar `httpOnly` cookies para el refresh token — se almacena en Zustand con `partialize` y `localStorage` según la arquitectura definida.

## Decisions

### D-01: Estructura de módulos en backend

**Decisión**: tres módulos separados — `app/modules/auth/`, `app/modules/refreshtokens/` y `app/modules/usuarios/`.

**Rationale**: `auth` coordina el flujo de autenticación; `refreshtokens` encapsula la lógica de ciclo de vida del token (rotación, replay detection); `usuarios` encapsula el modelo y repositorio de Usuario/UsuarioRol. Esta separación permite que en el change `admin-users` se extienda `usuarios` sin tocar `auth`.

**Alternativa descartada**: un solo módulo `auth/` con todo. Mezclaría demasiadas responsabilidades y acoplaría la gestión de usuarios al flujo de autenticación.

### D-02: Almacenamiento del refresh token

**Decisión**: el refresh token viaja como string opaco (UUID v4) en el cuerpo de la respuesta. En BD se guarda el hash SHA-256 (`token_hash CHAR(64)`). El `revoked_at` es NULL si está activo.

**Rationale**: nunca almacenar el token en claro en BD (principio de mínima exposición). El hash SHA-256 es suficiente para comparar sin costo de bcrypt. Si la BD se compromete, los tokens hasheados son inútiles sin el original.

**Alternativa descartada**: usar `bcrypt` para el hash del refresh token. Overhead innecesario — el token ya es un UUID v4 con 122 bits de entropía.

### D-03: Estrategia de replay attack

**Decisión**: cada `RefreshToken` tiene un campo `family_id` (UUID). Cuando se hace refresh, el token viejo se marca `revoked_at = now()` y se crea un token nuevo con el mismo `family_id`. Si llega un token ya revocado, el servicio busca por `family_id` y revoca TODOS los tokens de esa familia (RN-AU05).

**Rationale**: detectar replay attack sin mantener estado adicional en memoria. La familia permite identificar si el atacante está usando un token viejo de una sesión legítima.

**Alternativa descartada**: revocar TODOS los tokens del usuario. Demasiado agresivo — si el usuario tiene sesiones en múltiples dispositivos, las cierra todas aunque el replay sea solo de una.

### D-04: Dependency de autenticación en FastAPI

**Decisión**: dos dependencies reutilizables en `app/core/deps.py`:
- `get_current_user(token: str = Depends(oauth2_scheme)) -> Usuario` — valida el JWT, carga el usuario desde BD, retorna.
- `require_role(roles: list[str]) -> Callable` — factory que retorna una dependency que llama `get_current_user` y verifica que el usuario tenga al menos uno de los roles requeridos.

**Rationale**: patrón idiomático de FastAPI. Los routers inyectan las dependencies con `Depends()` — limpio, testeable y consistente.

**Alternativa descartada**: middleware HTTP global que valide tokens antes de llegar al router. No permite granularidad por endpoint ni acceso al objeto usuario tipado dentro del handler.

### D-05: Cómo el frontend activa el interceptor 401

**Decisión**: el interceptor de Axios ya existe en `api/axios.ts` (del change `frontend-shell`). Este change activa la lógica de refresh: cuando respuesta es 401, llama `POST /auth/refresh` con el refresh token del store, actualiza el accessToken en `authStore`, y reintenta la request original. Si el refresh también falla (401/token expirado), llama `authStore.logout()`.

**Rationale**: el interceptor ya fue diseñado con este flujo en mente en `frontend-shell`. Solo falta el endpoint real para activarlo.

**Alternativa descartada**: usar `@tanstack/react-query` para el refresh automático. El interceptor de Axios es más adecuado porque actúa antes de que la query/mutation falle, permitiendo retry transparente.

### D-06: Formularios de login y registro

**Decisión**: TanStack Form con `@tanstack/zod-form-adapter` para validación. Schemas zod definidos en `shared/schemas/auth.ts`. Feedback inmediato de errores por campo.

**Rationale**: consistent con el stack declarado en `infra-frontend-core`. TanStack Form evita re-renders innecesarios y separa la lógica de validación del componente.

## Risks / Trade-offs

- **[Riesgo] Refresh token en localStorage**: puede ser leído por XSS. → Mitigación: rotación agresiva (cada refresh invalida el anterior) + detección de replay + scope limitado (solo /auth/refresh lo necesita). En este proyecto el tradeoff está aceptado por la arquitectura ya definida.
- **[Riesgo] Access token stateless post-logout**: un access token emitido sigue válido hasta su expiración (30 min) aunque el usuario haga logout. → Mitigación: expiración corta (30 min) reduce la ventana. La invalidación inmediata requeriría una lista negra en Redis, que no está en el stack.
- **[Riesgo] Replay attack en familia única**: revocar solo la familia es menos agresivo que revocar todo el usuario. Si el atacante logra un refresh antes que el usuario legítimo, puede crear una nueva familia. → Mitigación: ventana de ataque pequeña (el token original es opaco, de un solo uso).

## Migration Plan

No hay migraciones nuevas. El esquema de BD ya existe. Pasos de deploy:

1. Asegurarse de que `alembic upgrade head` ya fue ejecutado (crea tablas y seed data).
2. Agregar al `.env`: `SECRET_KEY`, `ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES=30`, `REFRESH_TOKEN_EXPIRE_DAYS=7`.
3. Implementar y testear backend con `uvicorn app.main:app --reload`.
4. Implementar frontend — el interceptor se activa automáticamente al tener el endpoint real.

**Rollback**: dado que no hay cambios al esquema, un rollback implica solo revertir el código. Los datos de `RefreshToken` pueden truncarse sin impacto (usuarios deben re-loguearse).

## Open Questions

*(ninguna — todos los contratos, esquema y reglas de negocio están definidos en `docs/Integrador.txt` e `docs/Historias_de_usuario.txt`)*
