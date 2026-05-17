## MODIFIED Requirements

### Requirement: Snapshots inmutables del pedido
El sistema SHALL capturar snapshots de datos volatiles al crear el pedido.

#### Scenario: Snapshot de producto
- **WHEN** se crea cada `DetallePedido`
- **THEN** el sistema guarda `nombre_snapshot` y `precio_snapshot` con los valores vigentes del producto
- **THEN** cambios posteriores del producto no alteran el detalle historico

#### Scenario: Snapshot de exclusiones de ingredientes
- **WHEN** se crea cada `DetallePedido` con ingredientes excluidos
- **THEN** el sistema guarda `personalizacion` como lista de IDs para compatibilidad tecnica
- **AND** guarda `personalizacion_snapshot` con `{ ingredienteId, nombre }` para cada ingrediente excluido
- **THEN** cambios posteriores del ingrediente no alteran los nombres de exclusiones del pedido historico

#### Scenario: Snapshot de direccion
- **WHEN** el pedido usa direccion de entrega
- **THEN** el sistema guarda `direccion_snapshot` con los datos completos de la direccion al momento de crear el pedido
- **THEN** cambios posteriores de la direccion no alteran el pedido historico

#### Scenario: Retiro en local
- **WHEN** el request usa `direccionId=null`
- **THEN** el sistema permite crear el pedido como retiro en local
- **THEN** `direccion_snapshot` queda `NULL`

### Requirement: Consultar detalle de pedido propio
El sistema SHALL exponer `GET /api/v1/pedidos/{pedido_id}` para que un cliente consulte el detalle completo de un pedido propio.
Los items de detalle SHALL incluir `personalizacion` como IDs y `personalizacionDetalle` como lista legible de ingredientes excluidos.

#### Scenario: Cliente consulta detalle propio
- **WHEN** el propietario consulta `GET /api/v1/pedidos/{pedido_id}`
- **THEN** el sistema responde `200 OK`
- **THEN** retorna items con snapshots, cantidades, `personalizacion` y `personalizacionDetalle`
- **THEN** retorna direccion snapshot, estado actual, total, historial cronologico y estado de pago visible

#### Scenario: Cliente consulta pedido antiguo sin snapshot de exclusiones
- **WHEN** el detalle contiene IDs en `personalizacion` pero no tiene `personalizacion_snapshot`
- **THEN** el sistema intenta resolver nombres actuales de ingredientes por ID
- **AND** si un nombre no puede resolverse, retorna una etiqueta fallback `Ingrediente #<id>`

#### Scenario: Cliente no consulta pedido ajeno
- **WHEN** un cliente solicita el detalle de un pedido que no le pertenece
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Pedido inexistente
- **WHEN** se consulta un pedido inexistente o no visible para el actor
- **THEN** el sistema responde `404 Not Found` cuando corresponda al contrato de lectura segura

### Requirement: Consultar detalle operativo de cualquier pedido
El sistema SHALL exponer `GET /api/v1/admin/pedidos/{pedido_id}` para que usuarios `ADMIN` o `PEDIDOS` consulten el detalle completo de cualquier pedido.
Los items de detalle SHALL incluir exclusiones legibles para evitar ambiguedad operativa.

#### Scenario: Operador consulta detalle completo
- **WHEN** un usuario `ADMIN` o `PEDIDOS` solicita el detalle de un pedido existente
- **THEN** el sistema responde `200 OK`
- **THEN** retorna snapshots de items, `personalizacionDetalle`, direccion snapshot, historial completo, datos del cliente y estado de pago

#### Scenario: Operador consulta pedido inexistente
- **WHEN** el pedido solicitado no existe
- **THEN** el sistema responde `404 Not Found`
