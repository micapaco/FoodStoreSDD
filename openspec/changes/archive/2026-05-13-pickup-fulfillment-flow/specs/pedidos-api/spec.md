## MODIFIED Requirements

### Requirement: Reglas de calculo del pedido
El sistema SHALL calcular el total del pedido con precios snapshot y un costo de envio coherente con la modalidad de cumplimiento.

#### Scenario: Entrega a domicilio conserva costo de envio
- **WHEN** se crea un pedido con `direccionId` valido
- **THEN** el sistema conserva el costo de envio vigente para entrega a domicilio
- **THEN** el total persistido es la suma de `cantidad * precio_snapshot` mas `costo_envio`

#### Scenario: Retiro en local no cobra envio
- **WHEN** se crea un pedido con `direccionId=null`
- **THEN** el sistema persiste `costo_envio=0`
- **THEN** el total persistido equivale al subtotal de items

#### Scenario: Total inmutable tras crear el pedido
- **WHEN** el pedido ya fue creado
- **THEN** cambios posteriores de precios o reglas de presentacion no alteran `subtotal`, `costo_envio` ni `total`

#### Scenario: No descontar stock al crear
- **WHEN** el pedido nace en estado `PENDIENTE`
- **THEN** el sistema valida stock disponible pero no descuenta stock
- **THEN** el descuento de stock queda reservado para la transicion futura a `CONFIRMADO`

---

### Requirement: Avanzar manualmente estados operativos
El sistema SHALL exponer `PATCH /api/v1/pedidos/{pedido_id}/estado` para que usuarios `ADMIN` o `PEDIDOS` avancen pedidos segun la FSM y la modalidad de cumplimiento.

#### Scenario: Confirmado a preparacion
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=EN_PREP` para un pedido `CONFIRMADO`
- **THEN** el sistema cambia el pedido a `EN_PREP`
- **THEN** inserta historial `CONFIRMADO -> EN_PREP`
- **THEN** la API responde `200 OK` con `PedidoRead`

#### Scenario: Entrega a domicilio pasa a camino
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=EN_CAMINO` para un pedido `EN_PREP` con direccion de entrega
- **THEN** el sistema cambia el pedido a `EN_CAMINO`
- **THEN** inserta historial `EN_PREP -> EN_CAMINO`

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

#### Scenario: Transicion invalida
- **WHEN** se solicita un salto, retroceso o transicion no definida por la FSM
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado ni inserta historial
