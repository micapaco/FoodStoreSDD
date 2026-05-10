## Context

El change `profile` es el primer feature de gestión de cuenta después de `auth`. El backend ya tiene `GET /auth/me` funcionando con el usuario autenticado. El frontend tiene el placeholder `ProfilePage` y la ruta `/perfil` ya protegida con `ProtectedRoute` y `RoleRoute` (rol CLIENT) desde `frontend-shell`.

Lo que falta:
- Endpoints para modificar datos personales y cambiar contraseña
- UI de perfil con formularios de edición y cambio de contraseña
- Validaciones de negocio (email único, password policy, verificación de contraseña actual)

**Dependencias cumplidas**: `auth` ✅ (JWTs, authStore, /auth/me), `frontend-shell` ✅ (ruta /perfil, guards, layout privado)

## Goals / Non-Goals

**Goals:**
- Backend: `PUT /auth/me` para actualizar nombre, apellido, teléfono (email queda para cambio de contraseña u otro flujo)
- Backend: `PUT /auth/change-password` con validación de contraseña actual, política de seguridad, y hash con bcrypt
- Frontend: `ProfilePage` con vista de datos personales + modo edición inline
- Frontend: sección de cambio de contraseña con validaciones client-side y server-side
- Frontend: hook `useProfile` con mutaciones TanStack Query

**Non-Goals:**
- No se implementa verificación de email (cambio de email requiere confirmación — queda para change futuro)
- No se implementa avatar/foto de perfil
- No se implementa eliminación de cuenta
- No se implementa historial de actividad del perfil
- No se implementa UI de administración de perfiles (eso es `admin-users`)

## Decisions

### D-01: Reutilizar módulo `auth` existente (vs. crear módulo `profile` separado)

**Decisión**: los nuevos endpoints se agregan al router existente `app/modules/auth/router.py` y al `AuthService` existente.

**Rationale**: los endpoints son extensiones naturales del recurso `/auth/me`. Crear un módulo separado `profile` para solo 2 endpoints introduce sobrecarga de archivos sin beneficio real. `AuthService` ya maneja la sesión del usuario.

**Alternativa descartada**: módulo `profile/` separado con su propio router, service y repository. Innecesario para 2 endpoints que operan sobre el mismo recurso (`current_user`).

### D-02: Endpoints bajo `/auth/` (vs. `/profile/`)

**Decisión**: los endpoints se montan como `PUT /auth/me` y `PUT /auth/change-password`, manteniendo el prefijo `/auth/`.

**Rationale**: el recurso `me` ya está en `/auth/me` (GET). Es consistente tener PUT en la misma ruta. El endpoint de cambio de contraseña también es una operación de autenticación/cuenta. Agruparlo bajo `/auth/` evita crear un nuevo prefijo `/profile/` para solo 2 endpoints.

**Alternativa descartada**: `PUT /api/v1/profile` — más RESTful semánticamente, pero introduce un nuevo prefijo y requiere crear un router separado. No aporta valor real.

### D-03: PUT vs PATCH para actualización de perfil

**Decisión**: se usa `PUT /auth/me` con envío del objeto completo.

**Rationale**: el perfil es un recurso pequeño (nombre, apellido, teléfono). No hay ganancia real con PATCH parcial. PUT es más simple y evita discusiones sobre merge semantics.

### D-04: Cambio de contraseña en endpoint separado (vs. PUT /auth/me con password)

**Decisión**: endpoint dedicado `PUT /auth/change-password` con request body `{ current_password, new_password, confirm_password }`.

**Rationale**: cambiar contraseña tiene reglas de negocio distintas a editar perfil (verificar contraseña actual, política de seguridad, no reutilización). Mezclarlo en el mismo endpoint complica la validación y el schema.

### D-05: Política de contraseña

**Decisión**:
- Mínimo 8 caracteres (validación server-side y client-side)
- No puede ser igual a la contraseña actual
- No puede contener el email del usuario
- Se hashea con bcrypt (cost≥12) antes de persistir
- `passlib.password_policy.PasswordPolicy` (opcional) — puede ser validación manual sin librería extra

**Rationale**: cumple con los requisitos de US-063 sin agregar dependencias nuevas. La validación manual evita instalar una librería de password policy que solo se usa en este endpoint.

**Alternativa descartada**: instalar `zxcvbn` para medir fortaleza. Overkill para este proyecto.

### D-06: Error al cambiar contraseña — mensaje genérico

**Decisión**: si la contraseña actual es incorrecta, se devuelve 403 con mensaje genérico "Contraseña actual incorrecta" (sin diferenciar si el usuario existe o no).

**Rationale**: consistente con la política de auth de no revelar información sobre la existencia de cuentas (RN-05 del change `auth`).

### D-07: Frontend — ProfilePage con vista y edición en misma página (no modal)

**Decisión**: la página de perfil tiene dos secciones:
1. **Datos personales**: vista con texto + botón "Editar" que convierte los campos en inputs inline (no modal). Un solo botón "Guardar cambios".
2. **Cambio de contraseña**: sección separada debajo, siempre en modo formulario, con campo current_password, new_password, confirm_password y botón "Cambiar contraseña".

**Rationale**: modal para edición de perfil agrega complejidad de estado extra. La edición inline mantiene el contexto visual y es más simple de implementar con TanStack Form.

### D-08: Formularios con TanStack Form + validadores built-in

**Decisión**: se usa TanStack Form con validadores `onBlur` y `onChange` (built-in, sin zod). El hook `useProfile` maneja las mutaciones TanStack Query.

**Rationale**: consistente con la decisión del change `auth`. El proyecto ya definió usar TanStack Form. Los validadores built-in alcanzan para los campos del perfil (required, min length, email format, password match).

**Alternativa descartada**: usar zod para los schemas de validación. No necesario para formularios simples; agregar zod solo para esto sería overkill.

### D-09: Cache de datos de perfil

**Decisión**: la ProfilePage usa `useQuery(['profile', 'me'])` con staleTime 5 minutos. Después de editar perfil, se invalida la query con `invalidateQueries(['profile', 'me'])` para refrescar los datos. Después de cambiar contraseña, se muestra toast de éxito y se mantiene la sesión (no se fuerza logout).

**Rationale**: el perfil cambia poco, 5 minutos de staleTime evita refetches innecesarios. Invalidar tras edición asegura que la vista refleje los cambios inmediatamente. No forzar logout tras cambio de contraseña es mejor UX — el access token sigue siendo válido hasta su expiración.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|-----------|
| **PUT /auth/me** podría incluir campos que no deben modificarse (roles, is_active) | El schema `UpdateProfileRequest` solo expone los campos permitidos. El service valida explícitamente qué campos se actualizan. |
| **Cambio de email sin verificación**: el usuario podría poner un email que no le pertenece | El schema permite cambio de email, pero se documenta que en producción requeriría verificación. Para el TPI se acepta como tradeoff. |
| **Rate limiting en change-password**: un atacante podría brute-forcer la contraseña actual | Se aplica `@limiter.limit("10/minute")` al endpoint, igual que en login. |
| **Contraseña nueva igual a la actual**: el usuario podría "cambiar" a la misma contraseña | Validación explícita en service: `new_password == current_password` → error 422. |

## Migration Plan

1. No hay migraciones de BD (no se modifican tablas).
2. Backend: agregar endpoints en `app/modules/auth/router.py` + lógica en `app/modules/auth/service.py`.
3. Validar en Swagger que los 2 endpoints nuevos aparecen con schemas correctos.
4. Frontend: reemplazar `ProfilePage.tsx` placeholder con implementación real.
5. Crear `shared/hooks/useProfile.ts` con mutaciones.
6. Verificar flujo completo: login → /perfil → editar datos → cambiar contraseña → logout → login con nueva contraseña.

**Rollback**: revertir código. No hay cambios en BD ni dependencias externas.

## Open Questions

- *(ninguna — todos los contratos están definidos en las historias de usuario US-061, US-062, US-063)*
