## 1. Base de datos — migración y modelo

- [x] 1.1 Crear migración Alembic `0012_add_configuracion_table` con tabla `configuracion (clave PK, valor TEXT NOT NULL, updated_by_id FK nullable, updated_at TIMESTAMPTZ)`
- [x] 1.2 Agregar modelo SQLModel `Configuracion` en `app/db/models/` (nuevo archivo o en `identidad.py`)
- [x] 1.3 Aplicar migración: `alembic upgrade head` — **ACCIÓN MANUAL REQUERIDA**: ejecutar `alembic upgrade head` en el directorio `backend/`

## 2. Seed

- [x] 2.1 Agregar inserción idempotente de los 3 parámetros en el seed: `costo_envio_base = "50.00"`, `pedidos_habilitados = "true"`, `mensaje_sistema = ""`

## 3. Backend — módulo config

- [x] 3.1 Crear `app/modules/config/schemas.py` con `ConfigParametro`, `ConfigListResponse`, `ConfigUpdateRequest`
- [x] 3.2 Crear `app/modules/config/service.py` con `listar(uow)`, `obtener(clave, uow)`, `actualizar(clave, valor, usuario_id, uow)`
- [x] 3.3 Crear `app/modules/config/router.py` con `GET /admin/configuracion` y `PUT /admin/configuracion/{clave}` (require_role ADMIN) + `GET /configuracion/publica` (sin auth)
- [x] 3.4 Registrar router en `api/v1/__init__.py`

## 4. Pedidos — costo de envío configurable

- [x] 4.1 Convertir `_resolve_costo_envio` de método estático a función async que recibe `uow` y lee `costo_envio_base` de la tabla `configuracion`
- [x] 4.2 Agregar bloqueo en `crear_pedido`: si `pedidos_habilitados = "false"` → raise `ServiceUnavailableError` (HTTP 503)
- [x] 4.3 Asegurar que `ServiceUnavailableError` existe en `app/core/exceptions.py` y retorna 503

## 5. Frontend — tipos y API

- [x] 5.1 Crear `entities/config/types.ts` con `ConfigParametro`, `ConfigListResponse`, `ConfigUpdateRequest`, `ConfigPublicaResponse`
- [x] 5.2 Crear `shared/api/config.ts` con `getConfigAdminApi`, `updateConfigApi`, `getConfigPublicaApi`
- [x] 5.3 Crear `shared/hooks/useConfig.ts` con `useConfigAdmin`, `useUpdateConfig`, `useConfigPublica`

## 6. Frontend — SystemConfigPage

- [x] 6.1 Crear `pages/admin/SystemConfigPage.tsx` con formulario de 3 campos: `costo_envio_base` (número), `pedidos_habilitados` (toggle), `mensaje_sistema` (texto)
- [x] 6.2 Guardar individualmente cada parámetro via `PUT /admin/configuracion/{clave}` con toast de éxito / error inline
- [x] 6.3 Mostrar banner de advertencia visible cuando `pedidos_habilitados = false`
- [x] 6.4 Agregar ruta `/admin/configuracion` en el router y link en la navegación admin

## 7. Verificación

- [ ] 7.1 Aplicar migración y verificar seed inserta los 3 parámetros
- [ ] 7.2 Verificar `GET /admin/configuracion` retorna los 3 parámetros con valores correctos
- [ ] 7.3 Verificar `PUT /admin/configuracion/costo_envio_base` actualiza el valor y un pedido nuevo usa ese valor
- [ ] 7.4 Verificar `PUT /admin/configuracion/pedidos_habilitados` con `"false"` → `POST /pedidos` retorna 503
- [ ] 7.5 Verificar `GET /configuracion/publica` sin token retorna 200
- [ ] 7.6 Verificar que un no-ADMIN recibe 403 en los endpoints admin
- [ ] 7.7 Build TypeScript sin errores
