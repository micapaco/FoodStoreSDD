## ADDED Requirements

### Requirement: Listar pedidos propios paginados
El sistema SHALL exponer `GET /api/v1/pedidos` para que un usuario autenticado con rol `CLIENT` consulte un listado paginado de sus propios pedidos.

#### Scenario: Cliente lista sus pedidos
- **WHEN** un cliente autenticado solicita `GET /api/v1/pedidos`
- **THEN** el sistema responde `200 OK`
- **THEN** retorna solo pedidos cuyo `usuario_id` coincide con el usuario autenticado
- **THEN** cada item incluye numero de pedido, fecha, estado actual, total y cantidad de items

#### Scenario: Orden y paginacion
- **WHEN** el cliente consulta sus pedidos con `page` y `size`
- **THEN** el sistema responde con `items`, `total`, `page`, `size` y `pages`
- **THEN** los pedidos se ordenan por fecha descendente

#### Scenario: Filtrar por estado
- **WHEN** el cliente envia `estado=<codigo_estado>`
- **THEN** el sistema retorna solo pedidos propios que coinciden con ese estado

---

### Requirement: Consultar detalle de pedido propio
El sistema SHALL exponer `GET /api/v1/pedidos/{pedido_id}` para que un cliente consulte el detalle completo de un pedido propio.

#### Scenario: Cliente consulta detalle propio
- **WHEN** el propietario consulta `GET /api/v1/pedidos/{pedido_id}`
- **THEN** el sistema responde `200 OK`
- **THEN** retorna items con snapshots, cantidades y personalizacion
- **THEN** retorna direccion snapshot, estado actual, total, historial cronologico y estado de pago visible

#### Scenario: Cliente no consulta pedido ajeno
- **WHEN** un cliente solicita el detalle de un pedido que no le pertenece
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Pedido inexistente
- **WHEN** se consulta un pedido inexistente o no visible para el actor
- **THEN** el sistema responde `404 Not Found` cuando corresponda al contrato de lectura segura

---

### Requirement: Listar pedidos para operacion
El sistema SHALL exponer `GET /api/v1/admin/pedidos` para usuarios `ADMIN` o `PEDIDOS`, con filtros y paginacion orientados a gestion operativa.

#### Scenario: Operador lista todos los pedidos
- **WHEN** un usuario `ADMIN` o `PEDIDOS` solicita `GET /api/v1/admin/pedidos`
- **THEN** el sistema responde `200 OK`
- **THEN** retorna pedidos de todos los clientes

#### Scenario: Filtros operativos
- **WHEN** el operador envia filtros por `estado`, `desde`, `hasta` o busqueda por numero de pedido o nombre de cliente
- **THEN** el sistema aplica esos filtros sin romper la paginacion

#### Scenario: Usuario sin rol operativo
- **WHEN** un usuario sin rol `ADMIN` ni `PEDIDOS` consulta `GET /api/v1/admin/pedidos`
- **THEN** el sistema responde `403 Forbidden`

---

### Requirement: Consultar detalle operativo de cualquier pedido
El sistema SHALL exponer `GET /api/v1/admin/pedidos/{pedido_id}` para que usuarios `ADMIN` o `PEDIDOS` consulten el detalle completo de cualquier pedido.

#### Scenario: Operador consulta detalle completo
- **WHEN** un usuario `ADMIN` o `PEDIDOS` solicita el detalle de un pedido existente
- **THEN** el sistema responde `200 OK`
- **THEN** retorna snapshots de items, direccion snapshot, historial completo, datos del cliente y estado de pago

#### Scenario: Operador consulta pedido inexistente
- **WHEN** el pedido solicitado no existe
- **THEN** el sistema responde `404 Not Found`
