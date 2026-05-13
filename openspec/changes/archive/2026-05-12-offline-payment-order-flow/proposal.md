## Why

`EFECTIVO` y `TRANSFERENCIA` existen en el catalogo de formas de pago desde cambios anteriores, pero el contrato vigente solo define `PENDIENTE -> CONFIRMADO` por aprobacion de MercadoPago. Eso deja pedidos offline sin una salida formal de `PENDIENTE` y genera confusion operativa en panel y negocio.

## What Changes

- Formalizar que `CONFIRMADO` sigue significando "pago validado" dentro del contrato actual del proyecto.
- Definir un flujo especifico para que `ADMIN` o `PEDIDOS` confirmen pagos offline de pedidos con `formaPagoCodigo=EFECTIVO|TRANSFERENCIA`.
- Permitir que esa confirmacion autorizada ejecute la transicion `PENDIENTE -> CONFIRMADO`, descuente stock y registre historial de forma atomica.
- Mantener prohibida la transicion manual generica a `CONFIRMADO` por `PATCH /pedidos/{id}/estado`.
- Extender la vista operativa de pedidos para exponer la accion correcta solo cuando aplique y mostrar mensajes menos ambiguos para pagos offline.
- Dejar fuera de alcance comprobantes, conciliacion bancaria, devoluciones y reembolsos.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `pedidos-api`: agrega el contrato de confirmacion de pago offline y precisa la excepcion autorizada para `PENDIENTE -> CONFIRMADO`.
- `pedidos-frontend`: agrega accion operativa para confirmar pagos offline y mensajes de estado alineados con el nuevo flujo.

## Impact

- Backend: modulo `pedidos`, reglas FSM, servicios, schemas, router, historial y tests.
- Frontend: panel operativo de pedidos, hooks/mutaciones y textos de estado visibles en checkout/detalle si corresponde.
- Documentacion: `docs/CHANGES.md`, `AGENTS.md` y specs OpenSpec de pedidos.
- Dependencias de roadmap: este change pasa a ser el siguiente frente antes de `order-feedback`.
