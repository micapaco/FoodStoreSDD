## Why

El sistema ya permite crear pedidos con `direccion_id=NULL` para representar `retiro en local`, pero los contratos heredados siguen tratandolos como si fueran entregas a domicilio: cobran costo de envio y fuerzan el paso operativo `EN_PREP -> EN_CAMINO`. Eso introduce inconsistencias de negocio visibles para cliente y administracion.

## What Changes

- Formalizar que `direccion_id=NULL` identifica pedidos de retiro en local dentro del contrato actual.
- Definir que los pedidos de retiro en local persisten `costo_envio=0` y calculan `total=subtotal`.
- Mantener el costo de envio vigente para pedidos con direccion de entrega.
- Ajustar la FSM operativa para que retiro en local no use `EN_CAMINO`; desde `EN_PREP` se cierra en `ENTREGADO` al concretarse la entrega en mostrador.
- Mantener `EN_PREP -> EN_CAMINO -> ENTREGADO` para entregas a domicilio.
- Extender las vistas de checkout, detalle y panel operativo para mostrar totales y acciones coherentes con la modalidad del pedido.
- Dejar fuera de alcance una nueva etapa `LISTO_PARA_RETIRO`, tarifas configurables y reglas de logistica externas al dominio actual.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `pedidos-api`: precisa calculo de costo para retiro en local y bifurca las transiciones operativas segun modalidad de entrega.
- `pedidos-frontend`: ajusta checkout, detalle y panel operativo para reflejar retiro en local sin costo de envio ni paso `EN_CAMINO`.

## Impact

- Backend: modulo `pedidos`, calculo de totales, validacion FSM, historial y tests.
- Frontend: checkout, detalle de pedido y panel operativo de admin/pedidos.
- Documentacion: `docs/CHANGES.md`, `AGENTS.md` de coordinacion y specs OpenSpec de pedidos.
- Dependencias de roadmap: este change queda antes de `order-feedback`, porque el feedback posterior al checkout debe heredar totales y modalidad correctos.
