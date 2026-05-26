## MODIFIED Requirements

### Requirement: Avanzar manualmente estados operativos
El sistema SHALL exponer `PATCH /api/v1/pedidos/{pedido_id}/estado` para que usuarios `ADMIN`, `PEDIDOS` o `COCINA` avancen pedidos segun la FSM y la modalidad de cumplimiento. El endpoint acepta los tres roles en `require_role`, pero la validación de qué transición puede ejecutar cada rol vive en el servicio del FSM.

#### Scenario: Confirmado a preparacion — roles PEDIDOS o ADMIN
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=EN_PREP` para un pedido `CONFIRMADO`
- **THEN** el sistema cambia el pedido a `EN_PREP`
- **THEN** inserta historial `CONFIRMADO -> EN_PREP`
- **THEN** la API responde `200 OK` con `PedidoRead`

#### Scenario: Confirmado a preparacion — rol COCINA
- **WHEN** un usuario `COCINA` envia `nuevoEstado=EN_PREP` para un pedido `CONFIRMADO`
- **THEN** el sistema cambia el pedido a `EN_PREP`
- **THEN** inserta historial `CONFIRMADO -> EN_PREP` con `usuario_id` del cocinero
- **THEN** la API responde `200 OK` con `PedidoRead`

#### Scenario: En preparacion a camino — roles PEDIDOS o ADMIN
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=EN_CAMINO` para un pedido `EN_PREP` con direccion de entrega
- **THEN** el sistema cambia el pedido a `EN_CAMINO`
- **THEN** inserta historial `EN_PREP -> EN_CAMINO`

#### Scenario: En preparacion a camino — rol COCINA
- **WHEN** un usuario `COCINA` envia `nuevoEstado=EN_CAMINO` para un pedido `EN_PREP`
- **THEN** el sistema cambia el pedido a `EN_CAMINO`
- **THEN** inserta historial `EN_PREP -> EN_CAMINO` con `usuario_id` del cocinero

#### Scenario: Entrega a domicilio cierra desde camino
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=ENTREGADO` para un pedido `EN_CAMINO`
- **THEN** el sistema cambia el pedido a `ENTREGADO`
- **THEN** inserta historial `EN_CAMINO -> ENTREGADO`

#### Scenario: Retiro en local cierra desde preparacion
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=ENTREGADO` para un pedido `EN_PREP` con `direccionId=null`
- **THEN** el sistema cambia el pedido a `ENTREGADO`
- **THEN** inserta historial `EN_PREP -> ENTREGADO`

#### Scenario: Retiro en local no admite en camino
- **WHEN** se solicita `nuevoEstado=EN_CAMINO` para un pedido `EN_PREP` con `direccionId=null`
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado ni inserta historial

#### Scenario: Entrega a domicilio no salta el despacho
- **WHEN** se solicita `nuevoEstado=ENTREGADO` para un pedido `EN_PREP` con direccion de entrega
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado ni inserta historial

#### Scenario: Rol COCINA intenta transicion fuera de su alcance
- **WHEN** un usuario `COCINA` solicita `nuevoEstado=ENTREGADO` o cualquier transicion distinta de `EN_PREP` o `EN_CAMINO`
- **THEN** el sistema responde `403 Forbidden`
- **THEN** no cambia estado ni inserta historial

#### Scenario: Transicion invalida
- **WHEN** se solicita un salto, retroceso o transicion no definida por la FSM
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado ni inserta historial
