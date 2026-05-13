## ADDED Requirements

### Requirement: Costo de envío configurable
The system SHALL read the delivery cost for `POST /api/v1/pedidos` from the `configuracion` table (key `costo_envio_base`) instead of a hardcoded constant.
If the key is missing or its value cannot be parsed as Decimal, the system SHALL fall back to `50.00` and log the error.
Orders with `direccion_id = NULL` (pickup) continue to have `costo_envio = 0.00` regardless of configuration.

#### Scenario: Pedido con domicilio usa valor de configuración
- **WHEN** `costo_envio_base` is set to `"75.00"` and a client creates an order with a delivery address
- **THEN** the created order has `costo_envio = 75.00`

#### Scenario: Pedido de retiro no aplica costo
- **WHEN** a client creates a pickup order (`direccion_id = null`) regardless of `costo_envio_base` value
- **THEN** the created order has `costo_envio = 0.00`

#### Scenario: Fallback si clave ausente
- **WHEN** `costo_envio_base` is missing from the `configuracion` table
- **THEN** the system uses `50.00` as the delivery cost and the order is created successfully
