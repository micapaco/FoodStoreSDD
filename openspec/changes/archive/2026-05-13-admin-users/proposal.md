## Why

El sistema tiene usuarios registrados y roles RBAC pero no expone endpoints ni UI para que el Admin gestione cuentas: no puede listar usuarios, editar datos, cambiar roles ni desactivar cuentas. Sin esto el Admin no puede cumplir sus responsabilidades operativas (US-053, US-054, US-055).

## What Changes

- **Backend**: nuevo módulo `usuarios` con router admin — listado paginado con búsqueda y filtro por rol, edición de datos, asignación de roles (protegido: no degradar al último ADMIN), activación/desactivación con revocación de refresh tokens
- **Backend**: migración Alembic para agregar columna `activo BOOLEAN NOT NULL DEFAULT TRUE` a la tabla `usuario`
- **Backend**: actualizar `auth/service.py` para bloquear login con HTTP 403 si `activo = false`
- **Frontend**: implementar `UsersAdminPage` (actualmente placeholder) con tabla paginada, búsqueda, filtro por rol y acciones inline de edición y desactivación

## Capabilities

### New Capabilities

- `admin-usuarios-api`: Endpoints REST bajo `/api/v1/admin/usuarios` — listado paginado con filtros, detalle, edición de datos, cambio de roles y toggle activo. Solo accesible con rol ADMIN.
- `admin-usuarios-frontend`: Página `/admin/usuarios` con tabla de usuarios, búsqueda full-text, filtro por rol, paginación y acciones de editar / activar-desactivar.

### Modified Capabilities

- `auth-api`: Login ahora valida `activo = false` y retorna 403 "Cuenta desactivada" si el usuario está inactivo.
- `backend-db-schema`: Tabla `usuario` recibe columna `activo BOOLEAN NOT NULL DEFAULT TRUE` vía migración Alembic.

## Impact

- **Nuevo**: `backend/app/modules/usuarios/schemas.py`, `service.py`, `router.py`
- **Nuevo**: `backend/app/db/migrations/` — migración para columna `activo`
- **Modificado**: `backend/app/db/models/identidad.py` — campo `activo` en `Usuario`
- **Modificado**: `backend/app/modules/auth/service.py` — validación `activo` en login
- **Modificado**: `backend/app/modules/usuarios/repository.py` — métodos `list_paginated`, `count_admins`, `revocar_todos_tokens`
- **Modificado**: `backend/app/api/v1/__init__.py` — registrar router admin-usuarios
- **Nuevo**: `frontend/src/entities/usuarios/types.ts`
- **Nuevo**: `frontend/src/shared/api/usuarios.ts`
- **Nuevo**: `frontend/src/shared/hooks/useUsuarios.ts`
- **Modificado**: `frontend/src/pages/admin/UsersAdminPage.tsx` — implementación completa (reemplaza placeholder)
