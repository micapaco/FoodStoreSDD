## 1. Base de datos — migración y modelo

- [ ] 1.1 Generar migración Alembic: `alembic revision --autogenerate -m "add_activo_to_usuario"` y verificar script
- [ ] 1.2 Ajustar script si es necesario: `op.add_column` con `server_default='true'`, luego `alter_column` para `NOT NULL`
- [ ] 1.3 Aplicar migración: `alembic upgrade head`
- [ ] 1.4 Agregar campo `activo: bool = Field(default=True, nullable=False)` al modelo `Usuario` en `identidad.py`

## 2. Auth — bloqueo de login para usuarios inactivos

- [ ] 2.1 Actualizar `auth/service.py`: después de verificar credenciales, si `usuario.activo is False` → HTTP 403 "Cuenta desactivada"

## 3. Backend — schemas Pydantic

- [ ] 3.1 Crear `usuarios/schemas.py` con: `UsuarioListItem`, `UsuarioDetailRead`, `UsuarioUpdateRequest`, `CambiarRolesRequest`, `CambiarEstadoRequest`, `UsuarioListResponse`

## 4. Backend — repositorio extendido

- [ ] 4.1 Agregar `list_paginated(q, rol, skip, limit)` a `UsuarioRepository` — ILIKE en nombre+email, join UsuarioRol si hay filtro de rol
- [ ] 4.2 Agregar `count_admins()` — cuenta usuarios activos con rol ADMIN
- [ ] 4.3 Agregar `revocar_todos_tokens(usuario_id)` — UPDATE refresh_token SET revoked_at = NOW() WHERE usuario_id = :id AND revoked_at IS NULL
- [ ] 4.4 Agregar `set_roles(usuario_id, roles)` — borra UsuarioRol del usuario y reinserta los nuevos
- [ ] 4.5 Agregar `get_admin_user_by_id(id)` — get_by_id sin filtro de `deleted_at` (usuarios no tienen soft-delete en este flujo)

## 5. Backend — service layer

- [ ] 5.1 Crear `usuarios/service.py` con función `listar_usuarios(q, rol, page, size, uow)`
- [ ] 5.2 Agregar `obtener_usuario(id, uow)` — 404 si no existe
- [ ] 5.3 Agregar `editar_usuario(id, data, uow)` — 404 y 409 por email duplicado
- [ ] 5.4 Agregar `cambiar_roles(id, roles, uow)` — valida lista no vacía, verifica RN-RB04 (`count_admins`), reemplaza roles, revoca tokens
- [ ] 5.5 Agregar `cambiar_estado(id, activo, uow)` — verifica RN-RB04 si desactiva último ADMIN, revoca tokens si desactiva

## 6. Backend — router admin

- [ ] 6.1 Crear `usuarios/router.py` con prefix `/admin/usuarios`, dependencia `require_role(["ADMIN"])`
- [ ] 6.2 `GET /` → `listar_usuarios`
- [ ] 6.3 `GET /{id}` → `obtener_usuario`
- [ ] 6.4 `PUT /{id}` → `editar_usuario`
- [ ] 6.5 `PATCH /{id}/roles` → `cambiar_roles`
- [ ] 6.6 `PATCH /{id}/estado` → `cambiar_estado`
- [ ] 6.7 Registrar router en `api/v1/__init__.py`

## 7. Frontend — tipos y API

- [ ] 7.1 Crear `entities/usuarios/types.ts` con interfaces TypeScript
- [ ] 7.2 Crear `shared/api/usuarios.ts` con funciones para cada endpoint

## 8. Frontend — hooks TanStack Query

- [ ] 8.1 Crear `shared/hooks/useUsuarios.ts` con: `useUsuariosList`, `useEditarUsuario`, `useCambiarRoles`, `useCambiarEstadoUsuario`

## 9. Frontend — página UsersAdminPage

- [ ] 9.1 Implementar tabla con columnas: nombre completo, email, roles (badges), estado, fecha registro
- [ ] 9.2 Agregar campo de búsqueda por nombre/email y selector de rol
- [ ] 9.3 Implementar paginación
- [ ] 9.4 Modal de edición: campos nombre, apellido, email, teléfono + selector de roles (checkboxes)
- [ ] 9.5 Toggle activo/inactivo por fila con confirmación antes de desactivar
- [ ] 9.6 Manejo de errores: HTTP 409 (último admin), HTTP 422, errores genéricos con toast

## 10. Verificación

- [ ] 10.1 Aplicar migración en BD local y confirmar columna `activo`
- [ ] 10.2 Verificar que login con usuario inactivo retorna 403
- [ ] 10.3 Verificar listado con búsqueda y filtro por rol
- [ ] 10.4 Verificar edición de datos y cambio de roles
- [ ] 10.5 Verificar que intentar degradar al único ADMIN retorna 409
- [ ] 10.6 Verificar desactivación: usuario no puede loguear + tokens revocados
- [ ] 10.7 Build frontend sin errores de TypeScript
