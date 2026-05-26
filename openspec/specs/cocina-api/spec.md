# cocina-api Specification

## Purpose
Define el contrato backend para el Kitchen Display System (KDS): endpoint WebSocket de cocina, endpoint REST de pedidos activos, gestor de conexiones en proceso y emisión de eventos desde el servicio FSM.

## Requirements

### Requirement: Endpoint WebSocket de cocina
El sistema SHALL exponer `WS /api/v1/cocina/ws?token=<JWT>` para que pantallas de cocina reciban eventos en tiempo real.

#### Scenario: Conexión autenticada exitosa
- **WHEN** un cliente con token JWT válido y rol `COCINA`, `PEDIDOS` o `ADMIN` abre el WebSocket
- **THEN** el sistema acepta la conexión y registra el WebSocket en el gestor de conexiones activas

#### Scenario: Conexión sin token
- **WHEN** un cliente abre el WebSocket sin el parámetro `token`
- **THEN** el sistema cierra la conexión con código 4001 antes de aceptarla

#### Scenario: Conexión con token inválido o expirado
- **WHEN** un cliente envía un JWT inválido o expirado en el parámetro `token`
- **THEN** el sistema cierra la conexión con código 4001

#### Scenario: Desconexión limpia
- **WHEN** el cliente cierra el WebSocket normalmente
- **THEN** el sistema elimina el WebSocket del gestor de conexiones sin errores

---

### Requirement: Endpoint REST de pedidos activos de cocina
El sistema SHALL exponer `GET /api/v1/cocina/pedidos` para obtener la lista actual de pedidos en fase de cocina.

#### Scenario: Lista de pedidos activos
- **WHEN** un usuario con rol `COCINA`, `PEDIDOS` o `ADMIN` consulta `GET /api/v1/cocina/pedidos`
- **THEN** el sistema responde `200 OK` con todos los pedidos en estado `CONFIRMADO` o `EN_PREP`
- **THEN** la lista está ordenada por antigüedad ascendente (el que entró primero a `CONFIRMADO`, primero)
- **THEN** cada pedido incluye: `id`, `estado_codigo`, `notas`, `created_at`, lista de `items` con `nombre_snapshot`, `cantidad`, `personalizacion`, y `timestamp_entrada_cocina` (created_at del historial con `estado_hasta=CONFIRMADO`)

#### Scenario: Sin pedidos activos
- **WHEN** no hay pedidos en `CONFIRMADO` ni `EN_PREP`
- **THEN** el sistema responde `200 OK` con lista vacía

#### Scenario: Acceso denegado
- **WHEN** un usuario con rol `CLIENT` o `STOCK` consulta el endpoint
- **THEN** el sistema responde `403 Forbidden`

---

### Requirement: Gestor de conexiones WebSocket en proceso
El sistema SHALL mantener un gestor de conexiones singleton (`ConnectionManager`) que administra el conjunto de WebSockets activos de cocina.

#### Scenario: Broadcast de evento a conexiones activas
- **WHEN** el servicio FSM emite un evento de cocina tras commitear una transición
- **THEN** el `ConnectionManager` envía el mensaje JSON a todas las conexiones activas de cocina
- **THEN** si una conexión está cerrada, se elimina del conjunto sin propagar el error

#### Scenario: Sin conexiones activas
- **WHEN** se emite un evento y no hay WebSockets conectados
- **THEN** el evento se descarta sin error (best-effort, v1 single-instance)

---

### Requirement: Emisión de eventos desde el servicio FSM
El sistema SHALL emitir eventos al `ConnectionManager` de cocina tras commitear cada transición de estado en la fase de cocina.

#### Scenario: Pedido pasa a CONFIRMADO
- **WHEN** un pedido transiciona de `PENDIENTE` a `CONFIRMADO` (pago aprobado)
- **THEN** el servicio emite el evento `{"type": "PEDIDO_CONFIRMADO", "pedido": <PedidoCocinaRead>}` a las conexiones activas

#### Scenario: Pedido pasa a EN_PREP
- **WHEN** un pedido transiciona de `CONFIRMADO` a `EN_PREP`
- **THEN** el servicio emite `{"type": "PEDIDO_EN_PREPARACION", "pedido_id": <id>}`

#### Scenario: Pedido pasa a EN_CAMINO
- **WHEN** un pedido transiciona de `EN_PREP` a `EN_CAMINO`
- **THEN** el servicio emite `{"type": "PEDIDO_EN_CAMINO", "pedido_id": <id>}`

#### Scenario: Pedido es cancelado en fase de cocina
- **WHEN** un pedido en `CONFIRMADO` o `EN_PREP` es cancelado
- **THEN** el servicio emite `{"type": "PEDIDO_CANCELADO", "pedido_id": <id>}`

---

### Requirement: Autorización de transiciones FSM para rol COCINA
El sistema SHALL validar en el servicio del FSM que el rol `COCINA` solo puede ejecutar las transiciones `CONFIRMADO → EN_PREP` y `EN_PREP → EN_CAMINO`.

#### Scenario: Cocinero toma un pedido
- **WHEN** un usuario con rol `COCINA` envía `nuevoEstado=EN_PREP` para un pedido `CONFIRMADO`
- **THEN** el sistema ejecuta la transición y responde `200 OK`

#### Scenario: Cocinero marca pedido terminado
- **WHEN** un usuario con rol `COCINA` envía `nuevoEstado=EN_CAMINO` para un pedido `EN_PREP`
- **THEN** el sistema ejecuta la transición y responde `200 OK`

#### Scenario: Cocinero intenta transición no autorizada
- **WHEN** un usuario con rol `COCINA` envía `nuevoEstado=ENTREGADO` o cualquier otra transición fuera de su alcance
- **THEN** el sistema responde `403 Forbidden` aunque el endpoint le permita el acceso (`require_role` no es suficiente)

#### Scenario: Auditoría de transición de cocina
- **WHEN** el rol `COCINA` ejecuta una transición válida
- **THEN** se inserta en `HistorialEstadoPedido` con `usuario_id` del cocinero, `estado_desde`, `estado_hasta` y `created_at`
