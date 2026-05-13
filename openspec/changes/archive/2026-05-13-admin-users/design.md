## Context

El módulo `usuarios` existe parcialmente — tiene modelo (`identidad.py`) y repositorio básico (`get_by_email`, `get_with_roles`), pero sin schemas Pydantic, service ni router. El rol ADMIN existe en la BD pero no hay endpoints que permitan al Admin gestionar cuentas. El campo `activo` no existe en el modelo ni en la BD — requiere migración.

El frontend tiene `UsersAdminPage.tsx` como placeholder y la ruta `/admin/usuarios` ya registrada en el router.

## Goals / Non-Goals

**Goals:**
- Exponer endpoints `GET/PUT/PATCH` bajo `/api/v1/admin/usuarios` con RBAC ADMIN
- Migrar BD para agregar `activo BOOLEAN NOT NULL DEFAULT TRUE` a `usuario`
- Bloquear login de usuarios inactivos con HTTP 403
- Implementar `UsersAdminPage` con tabla paginada, búsqueda, filtro por rol y acciones
- Proteger regla RN-RB04: no degradar al último ADMIN del sistema

**Non-Goals:**
- Crear nuevos roles más allá de los 4 fijos existentes
- Endpoint de reset de contraseña por parte del Admin
- Gestión de sesiones activas (más allá de revocar refresh tokens)
- Bulk actions (activar/desactivar múltiples usuarios a la vez)

## Decisions

### D1 — Migración Alembic para `activo`

`activo BOOLEAN NOT NULL DEFAULT TRUE` se agrega vía migración — no se usa `server_default` en SQLModel porque la columna debe estar disponible inmediatamente para rows existentes. La migración setea `DEFAULT TRUE` para backfill atómico de filas existentes antes de agregar la constraint `NOT NULL`.

**Alternativa descartada**: `Optional[bool]` con nullable — semánticamente incorrecto; un usuario siempre tiene un estado de activación.

### D2 — Revocación de tokens al editar roles o desactivar

Al cambiar roles o desactivar un usuario, el service hace `UPDATE refresh_token SET revoked_at = NOW() WHERE usuario_id = :id AND revoked_at IS NULL`. Esto fuerza re-login en el próximo ciclo de refresh — no invalida el access token vigente (dura máx. 30 min, costo aceptable).

**Alternativa descartada**: Bloquear en cada request vía BD — agrega latencia a cada petición autenticada; el modelo de 30 min es el trade-off establecido en el sistema.

### D3 — Protección del último ADMIN (RN-RB04)

En el service, antes de ejecutar `cambiar_roles` o `desactivar`, se verifica `count_admins()`. Si el usuario objetivo es el único con rol ADMIN y la operación lo degradaría, se retorna HTTP 409. La verificación es atómica dentro del UoW para evitar race conditions.

### D4 — Paginación del listado admin

El endpoint acepta `q` (búsqueda por nombre/email via ILIKE), `rol` (filtro por código de rol) y `page`/`size`. El repositorio usa un `SELECT COUNT(*)` separado para el total — no cursor-based, ya que el volumen de usuarios admin es bajo.

### D5 — Flujo cross-domain (backend primero)

Backend define el contrato primero. Frontend consume exactamente los campos expuestos por los endpoints. Si falta un campo en la respuesta, no se improvisa en frontend — se ajusta el schema backend.

## Risks / Trade-offs

- **Race condition en last-admin check**: si dos admins se degradan simultáneamente, `count_admins()` puede devolver 2 para ambos y ambos procedan. Mitigación: verificación dentro de la misma transacción UoW.
- **Access token sigue válido 30 min post-desactivación**: aceptado — es el trade-off del modelo JWT stateless. Documentado en design.
- **Listado sin soft-delete de usuarios**: `deleted_at` no está implementado para usuarios en el flujo actual; la "baja" es mediante `activo=false`. No confundir con soft-delete del catálogo.

## Migration Plan

1. Generar migración Alembic: `alembic revision --autogenerate -m "add_activo_to_usuario"`
2. Verificar script generado — confirmar `op.add_column` con `server_default='true'` y luego `alter_column` para agregar `NOT NULL`
3. Aplicar: `alembic upgrade head`
4. Rollback: `alembic downgrade -1` — elimina la columna

## Open Questions

- ¿El Admin puede editar su propio nombre/email o solo el de otros usuarios? → Asumimos que sí puede editar cualquier usuario incluyendo a sí mismo, pero no puede quitarse el rol ADMIN si es el último.
- ¿Hay paginación en el listado de usuarios en el frontend, o se cargan todos? → Paginación obligatoria según US-053.
