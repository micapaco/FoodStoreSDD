## Why

Food Store no tiene display de cocina ni rol Cocinero: la operación de preparación está completamente absorbida por el rol `PEDIDOS`, que accede al listado general de pedidos sin una vista dedicada ni actualización en tiempo real. Sin una pantalla KDS, los cocineros no tienen visibilidad inmediata de qué preparar ni en qué orden, lo que introduce errores operativos y retrasos en la preparación de pedidos pagados.

## What Changes

- Nuevo rol `COCINA` en el catálogo de roles (seed idempotente) y tabla RBAC actualizada
- Endpoint WebSocket `WS /api/v1/cocina/ws?token=<JWT>` para push de eventos en tiempo real hacia pantallas de cocina conectadas
- Endpoint REST `GET /api/v1/cocina/pedidos` para carga inicial y fallback por polling
- Eventos emitidos desde el servicio FSM al commitear transiciones: `PEDIDO_CONFIRMADO`, `PEDIDO_EN_PREPARACION`, `PEDIDO_EN_CAMINO`, `PEDIDO_CANCELADO`
- Autorización de las transiciones `CONFIRMADO → EN_PREP` y `EN_PREP → EN_CAMINO` para el rol `COCINA` en el servicio del FSM (validación en servicio, no solo en `require_role`)
- Pantalla `/cocina` (KDS) en frontend: dos columnas por estado ("Por preparar" / "En preparación"), tarjetas con ítems, exclusiones, notas del cliente y timer de urgencia
- Timer visual por tiempo transcurrido desde entrada a cocina: normal (<10 min), advertencia (10–20 min, naranja), urgente (>20 min, rojo)
- Alerta sonora y flash visual al llegar `PEDIDO_CONFIRMADO` (Web Audio API, sin archivos externos, toggle ON/OFF persistido)
- Resiliencia: si el WebSocket se cae, el KDS activa polling a `GET /api/v1/cocina/pedidos` cada 30 s y vuelve al modo push al reconectar
- Guard de ruta: `/cocina` accesible solo para roles `COCINA`, `PEDIDOS` y `ADMIN`

## Capabilities

### New Capabilities

- `cocina-api`: Endpoints de cocina — WebSocket push, REST fallback, gestor de conexiones en proceso (asyncio), emisión de eventos desde el FSM, autorización de transiciones para `COCINA`
- `cocina-frontend`: Pantalla KDS en `/cocina` — columnas por estado, tarjetas de pedido, timer de urgencia, alerta sonora, resiliencia WebSocket/polling, guard de ruta

### Modified Capabilities

- `pedidos-api`: Las transiciones `CONFIRMADO → EN_PREP` y `EN_PREP → EN_CAMINO` ahora autorizan al rol `COCINA` además de `PEDIDOS` y `ADMIN`; el servicio FSM emite eventos al gestor de conexiones de cocina tras cada transición
- `auth-rbac`: Nuevo rol `COCINA` en la tabla de roles y seed idempotente; actualización de la tabla RBAC de autorización

## Impact

- **Backend**: Nuevo router `cocina` (WebSocket + REST), gestor de conexiones singleton en `app/core/` o `app/modules/cocina/`, modificación del servicio FSM de pedidos para emitir eventos, nuevo seed para `Rol(codigo='COCINA')`
- **Frontend**: Nueva página `CocinaPage` en `src/pages/cocina/`, hook `useKDS` (WebSocket + estado de pedidos), integración con `RoleNav`/`AdminSidebar` para mostrar acceso según rol
- **No requiere tablas nuevas**: reutiliza `Pedido`, `DetallePedido`, `HistorialEstadoPedido`, `Producto`
- **Infraestructura**: Agrega WebSocket al stack (FastAPI lo soporta nativamente); la v1 es single-instance con pub/sub en proceso. Multi-instancia requeriría Redis Pub/Sub (fuera de scope v1)
- **Sin estados nuevos en el FSM**: el cocinero usa los estados existentes `EN_PREP` y `EN_CAMINO`
