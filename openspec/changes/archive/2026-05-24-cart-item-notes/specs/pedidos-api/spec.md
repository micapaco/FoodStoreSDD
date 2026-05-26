## MODIFIED Requirements

### Requirement: Creacion de pedido con items personalizados
El sistema SHALL aceptar en `POST /api/v1/pedidos` un payload donde cada ítem puede incluir `notas` de preparación opcionales.

#### Scenario: Crear pedido con notas por item
- **WHEN** el cliente envía `POST /api/v1/pedidos` con `items[].notas = "sin sal"`
- **THEN** el sistema persiste `notas` en la columna `notas` de `pedido_item`
- **THEN** el campo `notas` en la respuesta `PedidoItemRead` contiene el texto enviado

#### Scenario: Crear pedido sin notas
- **WHEN** el cliente envía `POST /api/v1/pedidos` sin campo `notas` en un ítem (o `notas = null`)
- **THEN** el sistema persiste `null` en `pedido_item.notas`
- **THEN** la respuesta retorna `notas: null` para ese ítem

#### Scenario: Notas incluidas en respuesta de cocina
- **WHEN** el backend retorna `GET /api/v1/cocina/pedidos`
- **THEN** cada ítem en `PedidoCocinaItemRead` incluye el campo `notas` (string o null)
