## Why

El proyecto ya puede crear pedidos, cobrar pagos y gobernar su ciclo de vida, pero todavia no ofrece las vistas necesarias para que clientes y operadores consulten esa informacion de forma util. El change `order-views` cierra esa brecha y habilita seguimiento real de pedidos, gestion operativa y lectura consistente del historial ya implementado.

## What Changes

- Cubrir **US-049**, **US-050**, **US-051**, **US-052** y **US-065**.
- Agregar lecturas paginadas de pedidos propios para `CLIENT`, con filtro por estado y orden descendente por fecha.
- Agregar detalle completo de pedido propio, incluyendo items snapshot, direccion snapshot, estado actual, historial y estado de pago visible.
- Agregar lecturas operativas para `ADMIN` y `PEDIDOS` en endpoints administrativos dedicados, con filtros por estado, rango de fechas y busqueda.
- Agregar detalle operativo de cualquier pedido para gestion, incluyendo cliente, pago e historial completo.
- Reemplazar los placeholders frontend de `/pedidos`, `/pedidos/:id` y `/admin/pedidos` por vistas funcionales conectadas al backend.
- Mantener la regla de ownership: clientes solo leen pedidos propios; `ADMIN`/`PEDIDOS` leen vistas operativas segun contrato.

## Capabilities

### New Capabilities

### Modified Capabilities

- `pedidos-api`: ampliar el contrato de pedidos con listados y detalles de lectura para cliente y panel operativo.
- `pedidos-frontend`: ampliar el frontend de pedidos con lista y detalle de cliente, mas panel operativo para `ADMIN`/`PEDIDOS`.

## Impact

- **Backend**: `backend/app/modules/pedidos/` ganara queries de lectura, schemas de resumen/detalle, reglas de ownership y endpoints nuevos de consulta.
- **Frontend**: `frontend/src/pages/OrdersListPage.tsx`, `frontend/src/pages/OrderDetailPage.tsx` y `frontend/src/pages/admin/OrdersAdminPage.tsx` dejaran de ser placeholders.
- **Frontend shared/entities**: se ampliaran tipos y hooks de pedidos, y se consumiran estados de pago/historial ya disponibles.
- **API**: se formalizan rutas de lectura para cliente y administracion sin modificar los flujos de creacion, pago ni FSM archivados.
- **Dependencies**: depende de `order-fsm`, `payment-integration` y `frontend-shell`, todos ya archivados.

