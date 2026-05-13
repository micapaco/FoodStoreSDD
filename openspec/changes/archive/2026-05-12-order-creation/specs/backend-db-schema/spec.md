## ADDED Requirements

### Requirement: Pedido conserva snapshot de direccion
El esquema de base de datos SHALL permitir persistir un snapshot inmutable de la direccion de entrega usada al crear un pedido.

#### Scenario: Columna direccion_snapshot
- **WHEN** se aplica la migracion de `order-creation`
- **THEN** la tabla `pedido` contiene la columna `direccion_snapshot` como `JSONB NULL`

#### Scenario: Columna notas
- **WHEN** se aplica la migracion de `order-creation`
- **THEN** la tabla `pedido` contiene la columna `notas` como `TEXT NULL`

#### Scenario: Pedido con entrega
- **WHEN** un pedido se crea con `direccion_id` no nulo
- **THEN** `direccion_snapshot` guarda los datos completos necesarios para reconstruir la direccion historica

#### Scenario: Pedido con retiro en local
- **WHEN** un pedido se crea con `direccion_id=NULL`
- **THEN** `direccion_snapshot` queda `NULL`
