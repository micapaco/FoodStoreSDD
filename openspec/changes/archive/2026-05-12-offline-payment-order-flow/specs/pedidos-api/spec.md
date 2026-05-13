## MODIFIED Requirements

### Requirement: Confirmar pedido automaticamente por pago aprobado
El sistema SHALL confirmar automaticamente un pedido `PENDIENTE` cuando MercadoPago informa un pago aprobado, y SHALL permitir una confirmacion explicita separada para pagos offline definidos por este change.

#### Scenario: Confirmacion automatica exitosa
- **WHEN** MercadoPago informa estado real `approved` para un pedido `PENDIENTE`
- **THEN** el sistema cambia el pedido a `CONFIRMADO`
- **THEN** descuenta stock de los productos del pedido
- **THEN** inserta un `HistorialEstadoPedido` con `estado_desde=PENDIENTE` y `estado_hasta=CONFIRMADO`
- **THEN** todo ocurre dentro de una unica transaccion

#### Scenario: Confirmacion manual generica rechazada
- **WHEN** un usuario intenta avanzar manualmente un pedido a `CONFIRMADO` mediante el endpoint generico de cambio de estado
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado, stock ni historial

---

## ADDED Requirements

### Requirement: Confirmar pagos offline pendientes
El sistema SHALL exponer una operacion dedicada para que usuarios `ADMIN` o `PEDIDOS` confirmen pagos offline de pedidos `PENDIENTE` con `forma_pago_codigo=EFECTIVO|TRANSFERENCIA`.

#### Scenario: Confirmar efectivo pendiente
- **WHEN** un usuario `ADMIN` o `PEDIDOS` confirma un pedido `PENDIENTE` cuya forma de pago es `EFECTIVO`
- **THEN** el sistema cambia el pedido a `CONFIRMADO`
- **THEN** descuenta stock de los productos del pedido
- **THEN** registra historial `PENDIENTE -> CONFIRMADO`
- **THEN** la API responde `200 OK`

#### Scenario: Confirmar transferencia pendiente
- **WHEN** un usuario `ADMIN` o `PEDIDOS` confirma un pedido `PENDIENTE` cuya forma de pago es `TRANSFERENCIA`
- **THEN** el sistema aplica la misma transicion atomica `PENDIENTE -> CONFIRMADO`
- **THEN** conserva trazabilidad del actor operativo que ejecuto la accion

#### Scenario: Rechazar metodo no offline
- **WHEN** se intenta usar la confirmacion offline sobre un pedido `MERCADOPAGO`
- **THEN** el sistema responde `409 Conflict` o `422 Unprocessable Entity`
- **THEN** no cambia estado, stock ni historial

#### Scenario: Rechazar pedido no pendiente
- **WHEN** se intenta confirmar offline un pedido que ya no esta en `PENDIENTE`
- **THEN** el sistema responde `409 Conflict`
- **THEN** no descuenta stock dos veces ni duplica historial

#### Scenario: Rechazar actor sin rol operativo
- **WHEN** un usuario sin rol `ADMIN` ni `PEDIDOS` intenta confirmar un pago offline
- **THEN** el sistema responde `403 Forbidden`
