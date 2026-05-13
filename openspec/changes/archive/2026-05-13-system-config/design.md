## Context

`COSTO_ENVIO_V1 = Decimal("50.00")` está hardcodeado en `pedidos/service.py`. No existe tabla de configuración ni endpoints para parámetros operativos. El sistema no tiene forma de activar/desactivar la toma de pedidos ni mostrar mensajes de mantenimiento sin un redespliegue.

## Goals / Non-Goals

**Goals:**
- Tabla `configuracion` con claves semánticas fijas (definidas al seed)
- Endpoints ADMIN para leer y editar parámetros individualmente
- Endpoint público `GET /configuracion/publica` sin auth para que el frontend cliente consuma valores en runtime
- `pedidos/service.py` lee `costo_envio_base` desde la tabla en lugar del literal
- Panel `SystemConfigPage` con formulario tipo-aware por parámetro
- Audit: `updated_by_id` + `updated_at` por fila

**Non-Goals:**
- Parámetros dinámicos / free-form: solo los keys definidos en seed
- Historial de cambios (append-only audit trail) — `updated_at` es suficiente
- Configuración por entorno (eso es `.env`, no esta tabla)
- Roles distintos de ADMIN para editar configuración

## Decisions

### D1 — Módulo `app/modules/config/` (no `configuracion/`)

Nombre corto consistente con el slug del change. El módulo es pequeño: schemas + service + router. No necesita repositorio dedicado — el service usa `uow.session` directamente, igual que `metricas`.

### D2 — Claves fijas definidas en seed, no free-form

Alternativa descartada: tabla libre donde admin puede crear/borrar claves. Demasiado riesgo de claves mal escritas que rompan el sistema. Las claves son: `costo_envio_base` (Decimal), `pedidos_habilitados` (bool), `mensaje_sistema` (str, vacío = sin mensaje).

### D3 — `pedidos/service.py` lee config dentro del UoW existente

`_resolve_costo_envio` pasa de ser un método estático (sin DB) a una función async que consulta `configuracion`. El UoW ya está abierto en el router al momento de crear el pedido, así que no se abre una segunda sesión. La firma del `PedidoCreationService` ya recibe `uow` — solo se agrega la consulta de config dentro del mismo contexto transaccional.

### D4 — Endpoint público `GET /configuracion/publica` sin auth

Devuelve solo las claves que el frontend cliente necesita: `costo_envio_base` y `pedidos_habilitados`. No expone `mensaje_sistema` por ese endpoint (se entrega por separado si se implementa un banner, lo que queda fuera del scope de este change). Riesgo de scraping es mínimo — son datos de negocio, no secretos.

### D5 — Tipo de valor: TEXT en BD, parsing en service

Todos los valores se almacenan como TEXT. El service los parsea al tipo correcto (`Decimal`, `bool`, `str`) al leer. Alternativa descartada: columna JSON o columna tipada — innecesariamente complejo para 3 parámetros.

## Risks / Trade-offs

- **`pedidos/service.py` agrega una query extra por pedido creado** → Query simple por PK, impacto despreciable en escala académica.
- **Valor de `costo_envio_base` corrompido en BD** → El service hace un `try/except` al parsear; si falla, usa el fallback `Decimal("50.00")` y loguea el error.
- **`pedidos_habilitados = false` bloquea creación de pedidos** → El endpoint `POST /pedidos` retorna HTTP 503 con mensaje claro.

## Migration Plan

1. Crear migración Alembic para la tabla `configuracion`
2. Actualizar seed para insertar los 3 parámetros con valores default
3. Implementar módulo `config/`
4. Modificar `pedidos/service.py` para leer `costo_envio_base` de la tabla
5. Implementar `SystemConfigPage`
6. Verificar que crear un pedido con domicilio usa el valor de la tabla
