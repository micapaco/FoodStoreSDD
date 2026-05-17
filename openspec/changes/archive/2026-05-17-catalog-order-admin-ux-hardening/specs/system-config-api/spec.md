## MODIFIED Requirements

### Requirement: Endpoint público de configuración
The system SHALL expose `GET /api/v1/configuracion/publica` without authentication to return client-facing parameters.
Response: `{ costo_envio_base: number, pedidos_habilitados: boolean, mensaje_sistema: string }`.

#### Scenario: Cliente lee configuracion publica
- **WHEN** any user (authenticated or not) sends `GET /configuracion/publica`
- **THEN** the system returns HTTP 200 with the current values of `costo_envio_base`, `pedidos_habilitados`, and `mensaje_sistema`

### Requirement: Bloqueo de creación de pedidos cuando pedidos_habilitados=false
The system SHALL block `POST /api/v1/pedidos` when the `pedidos_habilitados` configuration parameter is `"false"`.
Response: HTTP 503 with message "El local no esta aceptando pedidos en este momento."

#### Scenario: Pedido bloqueado por configuracion
- **WHEN** `pedidos_habilitados` is set to `"false"` and a client attempts `POST /pedidos`
- **THEN** the system returns HTTP 503 with the appropriate message

#### Scenario: Pedido permitido cuando habilitado
- **WHEN** `pedidos_habilitados` is `"true"` and a client submits a valid order
- **THEN** the system processes the order normally
