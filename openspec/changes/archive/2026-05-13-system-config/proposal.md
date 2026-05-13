## Why

Parámetros operativos como el costo de envío están hardcodeados en el backend (`COSTO_ENVIO_V1 = Decimal("50.00")`), lo que obliga a un redespliegue para cambiarlos. Este change introduce una tabla `configuracion` key-value y un panel admin para que los parámetros del negocio sean ajustables en tiempo real sin tocar código.

## What Changes

- **Nueva tabla** `configuracion` (clave, valor, updated_by_id, updated_at) — almacena los parámetros operativos del sistema
- **Nuevo módulo backend** `app/modules/config/` con endpoints ADMIN para leer y editar parámetros, más un endpoint público para que el frontend consuma valores que necesita en runtime
- **`COSTO_ENVIO_V1` desacoplado** — `pedidos/service.py` lee el costo de envío desde la tabla `configuracion` en vez del literal hardcodeado; el valor seed es $50.00
- **Nueva página** `SystemConfigPage` para que el Admin visualice y edite los parámetros desde el panel
- **Seed actualizado** con los valores iniciales de todos los parámetros

## Capabilities

### New Capabilities

- `system-config-api`: endpoints `GET /admin/configuracion` (lista todos), `PUT /admin/configuracion/{clave}` (edita uno), `GET /configuracion/publica` (sin auth — devuelve solo los valores que el frontend cliente necesita). Audit trail: `updated_by_id` + `updated_at` por fila.
- `system-config-frontend`: `SystemConfigPage` con formulario editable para cada parámetro (tipo-aware: número, bool, texto), feedback inmediato post-save via toast.

### Modified Capabilities

- `backend-db-schema`: nueva tabla `configuracion` (clave PK, valor TEXT NOT NULL, updated_by_id FK → usuario.id nullable, updated_at TIMESTAMPTZ)
- `pedidos-api`: `costo_envio` para entregas a domicilio se obtiene de `configuracion.clave = 'costo_envio_base'` en vez del literal `50.00`

## Impact

- **Backend**: nueva migración Alembic, nuevo módulo `app/modules/config/`, `pedidos/service.py` recibe `UoW` para leer costo de envío
- **Frontend**: nueva página `pages/admin/SystemConfigPage.tsx` (hoy no existe como placeholder)
- **Seed**: insertar valores iniciales en tabla `configuracion` al correr el seed
- **Sin breaking changes para el cliente** — el costo de envío observable por los clientes no cambia (sigue siendo $50 por default), solo el origen del valor cambia
