## ADDED Requirements

### Requirement: Confirmar pedido automaticamente por pago aprobado
El sistema SHALL confirmar automaticamente un pedido `PENDIENTE` cuando el dominio de pagos informa un pago aprobado.

#### Scenario: Confirmacion automatica exitosa
- **WHEN** MercadoPago informa estado real `approved` para un pedido `PENDIENTE`
- **THEN** el sistema cambia el pedido a `CONFIRMADO`
- **THEN** descuenta stock de los productos del pedido
- **THEN** inserta un `HistorialEstadoPedido` con `estado_desde=PENDIENTE` y `estado_hasta=CONFIRMADO`
- **THEN** todo ocurre dentro de una unica transaccion

#### Scenario: Confirmacion duplicada
- **WHEN** llega nuevamente el mismo pago aprobado y el pedido ya esta `CONFIRMADO`
- **THEN** el sistema no descuenta stock otra vez
- **THEN** el sistema no inserta historial duplicado

#### Scenario: Confirmacion manual rechazada
- **WHEN** un usuario intenta avanzar manualmente un pedido a `CONFIRMADO`
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado, stock ni historial

---

### Requirement: Avanzar manualmente estados operativos
El sistema SHALL exponer `PATCH /api/v1/pedidos/{pedido_id}/estado` para que usuarios `ADMIN` o `PEDIDOS` avancen pedidos segun la FSM.

#### Scenario: Confirmado a preparacion
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=EN_PREP` para un pedido `CONFIRMADO`
- **THEN** el sistema cambia el pedido a `EN_PREP`
- **THEN** inserta historial `CONFIRMADO -> EN_PREP`
- **THEN** la API responde `200 OK` con `PedidoRead`

#### Scenario: Preparacion a camino
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=EN_CAMINO` para un pedido `EN_PREP`
- **THEN** el sistema cambia el pedido a `EN_CAMINO`
- **THEN** inserta historial `EN_PREP -> EN_CAMINO`

#### Scenario: Camino a entregado
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=ENTREGADO` para un pedido `EN_CAMINO`
- **THEN** el sistema cambia el pedido a `ENTREGADO`
- **THEN** inserta historial `EN_CAMINO -> ENTREGADO`

#### Scenario: Transicion invalida
- **WHEN** se solicita un salto, retroceso o transicion no definida por la FSM
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado ni inserta historial

---

### Requirement: Cancelar pedidos con motivo
El sistema SHALL permitir cancelaciones solo en estados definidos por la FSM y SHALL exigir motivo no vacio.

#### Scenario: Cancelar pendiente
- **WHEN** el propietario, `ADMIN` o `PEDIDOS` cancela un pedido `PENDIENTE` con motivo valido
- **THEN** el sistema cambia el pedido a `CANCELADO`
- **THEN** no modifica stock
- **THEN** inserta historial `PENDIENTE -> CANCELADO`
- **THEN** el historial conserva el motivo de cancelacion

#### Scenario: Cancelar confirmado o en preparacion
- **WHEN** `ADMIN` o `PEDIDOS` cancela un pedido `CONFIRMADO` o `EN_PREP` con motivo valido
- **THEN** el sistema cambia el pedido a `CANCELADO`
- **THEN** restaura stock de los productos del pedido
- **THEN** inserta historial hacia `CANCELADO`
- **THEN** el historial conserva el motivo de cancelacion

#### Scenario: Motivo obligatorio
- **WHEN** se solicita cancelar un pedido sin motivo o con motivo en blanco
- **THEN** el sistema responde error de validacion
- **THEN** no cambia estado, stock ni historial

#### Scenario: Cancelacion no permitida
- **WHEN** se intenta cancelar un pedido `EN_CAMINO`, `ENTREGADO` o `CANCELADO`
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado, stock ni historial

---

### Requirement: Respetar estados terminales
El sistema SHALL impedir cualquier transicion desde estados terminales.

#### Scenario: Entregado terminal
- **WHEN** un pedido esta `ENTREGADO`
- **THEN** cualquier intento de cambiar su estado responde `409 Conflict`

#### Scenario: Cancelado terminal
- **WHEN** un pedido esta `CANCELADO`
- **THEN** cualquier intento de cambiar su estado responde `409 Conflict`

---

### Requirement: Consultar historial cronologico
El sistema SHALL exponer `GET /api/v1/pedidos/{pedido_id}/historial` para consultar el historial append-only de un pedido.

#### Scenario: Propietario consulta historial
- **WHEN** el propietario consulta el historial de su pedido
- **THEN** el sistema responde `200 OK`
- **THEN** retorna los registros ordenados por `created_at ASC`
- **THEN** incluye `motivo` cuando la transicion lo registro

#### Scenario: Operador consulta historial
- **WHEN** un usuario `ADMIN` o `PEDIDOS` consulta el historial de cualquier pedido
- **THEN** el sistema responde `200 OK`

#### Scenario: Cliente consulta historial ajeno
- **WHEN** un cliente consulta el historial de un pedido ajeno
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Historial append-only
- **WHEN** se registra una transicion
- **THEN** el sistema inserta un nuevo `HistorialEstadoPedido`
- **THEN** ninguna capa actualiza o elimina registros existentes de historial
