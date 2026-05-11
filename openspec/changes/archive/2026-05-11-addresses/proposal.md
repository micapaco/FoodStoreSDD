## Why

Los clientes necesitan gestionar direcciones de entrega reutilizables para no reescribir datos en cada compra y para habilitar un selector de dirección en el checkout.

## What Changes

- Se agrega un módulo de direcciones de entrega (CRUD) con ownership por usuario autenticado.
- Se soporta marcar una dirección como **principal** y garantizar unicidad por usuario.
- Se expone un selector/listado simple consumible por el frontend en el flujo de checkout.

## Capabilities

### New Capabilities
- `addresses-api`: Endpoints REST para CRUD de direcciones del usuario + set principal.
- `addresses-frontend`: UI/queries para listar, crear, editar, eliminar y marcar principal.

### Modified Capabilities
- `shell-routing`: Agregar navegación/route para “Mis Direcciones” (CLIENT) y acceso desde el shell.

## Impact

- Backend: nuevo módulo feature-first `app/modules/direcciones/` (router/service/repository/schemas/model) y posibles ajustes menores de UoW para exponer repo.
- Frontend: nueva página/feature “Mis Direcciones” + TanStack Query hooks y formularios.
- API: nuevos endpoints bajo `/api/v1/direcciones` (protegidos).
