## Why

Los usuarios registrados no tienen forma de ver su perfil, editar sus datos personales ni cambiar su contraseña. El endpoint `GET /auth/me` existe (del change `auth`), pero no hay UI de perfil ni endpoints para modificar datos. Sin este change, el usuario queda "atrapado" con los datos que ingresó al registrarse y no puede mantener su información actualizada.

## What Changes

- **Backend — `PUT /api/v1/auth/me`**: endpoint para actualizar datos personales del usuario autenticado (nombre, apellido, teléfono). Validación de que el email no esté duplicado si se modifica.
- **Backend — `PUT /api/v1/auth/change-password`**: endpoint para cambiar contraseña. Requiere contraseña actual + nueva contraseña con validaciones (mínimo 8 chars, no igual a la actual, no igual al email). La contraseña actual debe verificarse antes de aplicar el cambio.
- **Backend — módulo `usuarios` extendido**: el `UsuarioRepository` ya existe del change `auth`. Se extiende con `update(user_id, data)` y `change_password(user_id, new_password_hash)`.
- **Frontend — `ProfilePage`**: página con vista de datos personales (nombre, email, roles, fecha de registro) y modo edición inline.
- **Frontend — formulario de edición**: campos editables con TanStack Form + validación. Soporta cambio de email con advertencia (requiere verificación futura).
- **Frontend — formulario de cambio de contraseña**: modal/sección separada con campos current_password, new_password, confirm_password. Validación: new_password !== current_password, mín 8 caracteres, confirmación debe coincidir.
- **Frontend — ruta `/perfil`**: ya existe como placeholder en `frontend-shell`. Solo se reemplaza el placeholder por la página real.
- **Frontend — hook `useProfile`**: mutaciones TanStack Query para update profile y change password. Invalidación de `GET /auth/me` tras update.

## Capabilities

### New Capabilities
- `profile-api`: Endpoints REST de perfil — `PUT /auth/me` (actualizar datos personales), `PUT /auth/change-password` (cambio de contraseña con validación). Schemas UpdateProfileRequest, ChangePasswordRequest, validaciones de negocio.
- `profile-frontend`: UI de perfil — ProfilePage con vista/edición de datos, formulario de cambio de contraseña, hook `useProfile` con mutaciones TanStack Query.

### Modified Capabilities
- *(ninguna — `auth-api` ya define `GET /auth/me`, los nuevos endpoints son extensiones propias de `profile-api`)*

## Impact

- **Backend**: se extiende `app/modules/auth/router.py` con 2 nuevos endpoints. Se agrega lógica en `AuthService`. No se requieren nuevas tablas ni migraciones.
- **Frontend**: se reemplaza `src/pages/ProfilePage.tsx` (placeholder) con implementación real. Nuevo `shared/hooks/useProfile.ts`. Nuevos schemas compartidos si aplica.
- **API**: contrato nuevo en `PUT /auth/me` y `PUT /auth/change-password` bajo el prefijo `/api/v1`.
- **Dependencias**: sin nuevas dependencias. Backend ya tiene `passlib[bcrypt]`. Frontend ya tiene `@tanstack/react-form` y `@tanstack/react-query`.
