# Proposal: Order FSM

## Summary
Implementar la maquina de estados de pedidos como regla de negocio centralizada, con transiciones manuales para `ADMIN`/`PEDIDOS`, cancelacion con motivo y restauracion atomica de stock cuando corresponda, historial cronologico append-only y proteccion estricta de estados terminales.

## User Stories
- **US-039**: Confirmacion automatica por pago aprobado.
- **US-040**: Transicion `CONFIRMADO -> EN_PREP`.
- **US-041**: Transicion `EN_PREP -> EN_CAMINO`.
- **US-042**: Transicion `EN_CAMINO -> ENTREGADO`.
- **US-043**: Cancelar pedido.
- **US-044**: Auditoria de cambios de estado.

## Scope
- **Backend**: Consolidar la FSM de pedidos en el modulo `pedidos`, reutilizable desde pagos y desde endpoints operativos.
- **Backend**: Mantener `PENDIENTE -> CONFIRMADO` como transicion automatica por pago aprobado, sin habilitarla manualmente.
- **Backend**: Exponer `PATCH /api/v1/pedidos/{id}/estado` para avance manual por roles `ADMIN`/`PEDIDOS`, respetando la FSM.
- **Backend**: Exponer `DELETE /api/v1/pedidos/{id}` o endpoint equivalente ya acordado para cancelacion propia de cliente, limitada a estados permitidos.
- **Backend**: Exponer `GET /api/v1/pedidos/{id}/historial` con historial ordenado cronologicamente.
- **Backend**: Registrar cada transicion en `HistorialEstadoPedido` mediante INSERT append-only.
- **Backend**: Requerir `motivo` para toda cancelacion.
- **Backend**: Restaurar stock atomicamente cuando se cancela un pedido que ya habia descontado stock.
- **Backend**: Rechazar transiciones desde `ENTREGADO` y `CANCELADO`.
- **Backend**: Agregar o ajustar tests de servicio para transiciones validas, invalidas, roles, stock e historial.

## Out of Scope
- Listados y detalle completo de pedidos para panel operativo (`order-views`).
- Timeline visual o frontend de gestion de pedidos.
- Dashboard de metricas o reportes administrativos.
- Refunds, chargebacks o anulaciones en MercadoPago.
- Cambios al flujo de creacion de pedidos salvo integracion necesaria con el servicio FSM.
- Cambios al catalogo o al modelo de stock fuera de las operaciones atomicas de confirmacion/cancelacion.

## Acceptance Criteria
- [x] GIVEN un pago aprobado para un pedido `PENDIENTE`, WHEN el backend lo procesa, THEN el pedido pasa a `CONFIRMADO`, descuenta stock una sola vez y registra historial `PENDIENTE -> CONFIRMADO`.
- [x] GIVEN un usuario `ADMIN` o `PEDIDOS` y un pedido `CONFIRMADO`, WHEN envia `PATCH /api/v1/pedidos/{id}/estado` con `nuevoEstado=EN_PREP`, THEN el pedido cambia a `EN_PREP` y se registra historial.
- [x] GIVEN un pedido `EN_PREP`, WHEN `ADMIN` o `PEDIDOS` lo avanza a `EN_CAMINO`, THEN la transicion se persiste y queda auditada.
- [x] GIVEN un pedido `EN_CAMINO`, WHEN `ADMIN` o `PEDIDOS` lo avanza a `ENTREGADO`, THEN el pedido queda terminal y no admite nuevas transiciones.
- [x] GIVEN una transicion no permitida por la FSM, WHEN se solicita, THEN responde `409 Conflict` y no cambia pedido, stock ni historial.
- [x] GIVEN una cancelacion sin motivo, WHEN se solicita `CANCELADO`, THEN responde `422` o error de validacion equivalente y no persiste cambios.
- [x] GIVEN un pedido `CONFIRMADO` cancelado con motivo, WHEN la cancelacion se procesa, THEN se restaura stock de forma atomica y se registra historial.
- [x] GIVEN un pedido `ENTREGADO` o `CANCELADO`, WHEN se intenta cambiar su estado, THEN responde `409 Conflict`.
- [x] GIVEN un pedido existente, WHEN se consulta su historial, THEN la API devuelve transiciones ordenadas por `created_at ASC`, incluyendo actor usuario o sistema.

## Preparation Notes
- Se buscaron skills para `fastapi`, `sqlmodel postgresql`, `alembic migrations`, `pytest fastapi testing` y `python service layer state machine`.
- No se instalo ninguna skill externa nueva: las candidatas relevantes ya estaban instaladas o no superaban el umbral de confianza del proyecto.
- Se usaran `clean-architecture`, `foodstore-backend`, `foodstore-domain`, `fastapi-python`, `sqlmodel-expert` y `sqlalchemy-alembic-expert-best-practices-code-review` como guias para el apply.
