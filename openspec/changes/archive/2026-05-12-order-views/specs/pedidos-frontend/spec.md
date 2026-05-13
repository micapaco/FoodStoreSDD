## ADDED Requirements

### Requirement: Vista de listado de pedidos del cliente
El frontend SHALL reemplazar el placeholder de `/pedidos` por una vista funcional para que el cliente consulte sus pedidos.

#### Scenario: Cliente ve listado paginado
- **WHEN** un cliente navega a `/pedidos`
- **THEN** la pagina consulta `GET /api/v1/pedidos`
- **THEN** muestra una lista con numero de pedido, fecha, estado, total y cantidad de items
- **THEN** conserva estados de carga, vacio y error accionables

#### Scenario: Cliente filtra por estado
- **WHEN** el cliente selecciona un estado disponible
- **THEN** la vista reconsulta el listado con el filtro correspondiente

#### Scenario: Cliente abre detalle
- **WHEN** el cliente activa la accion de ver un pedido
- **THEN** navega a `/pedidos/{id}`

---

### Requirement: Vista de detalle de pedido propio
El frontend SHALL reemplazar el placeholder de `/pedidos/:id` por una vista de detalle conectada al contrato backend.

#### Scenario: Cliente consulta detalle valido
- **WHEN** un cliente navega a `/pedidos/{id}` de un pedido propio
- **THEN** la pagina consulta `GET /api/v1/pedidos/{id}`
- **THEN** muestra items snapshot, direccion snapshot, estado actual, total, historial y estado de pago

#### Scenario: Cliente no puede ver detalle ajeno
- **WHEN** el backend responde `403 Forbidden`
- **THEN** la interfaz muestra un estado de acceso denegado coherente con el shell existente

#### Scenario: Pedido no encontrado
- **WHEN** el backend responde `404 Not Found`
- **THEN** la vista muestra un estado de recurso inexistente o inaccesible sin romper la navegacion

---

### Requirement: Panel operativo de pedidos
El frontend SHALL reemplazar el placeholder de `/admin/pedidos` por una vista funcional para `ADMIN` y `PEDIDOS`.

#### Scenario: Operador ve pedidos del sistema
- **WHEN** un usuario autorizado navega a `/admin/pedidos`
- **THEN** la pagina consulta `GET /api/v1/admin/pedidos`
- **THEN** muestra tabla o listado denso con estado, cliente, total, fecha y accesos a detalle

#### Scenario: Operador usa filtros
- **WHEN** el operador filtra por estado, rango de fechas o busqueda
- **THEN** la vista reconsulta datos preservando paginacion y sincronizacion con el backend

#### Scenario: Operador abre detalle de gestion
- **WHEN** el operador solicita ver un pedido concreto
- **THEN** la interfaz muestra o navega a un detalle operativo basado en `GET /api/v1/admin/pedidos/{id}`

#### Scenario: Operador ejecuta acciones permitidas
- **WHEN** el detalle operativo muestra un pedido con transiciones manuales validas
- **THEN** la interfaz ofrece avanzar al siguiente estado permitido segun la FSM vigente
- **THEN** tambien permite cancelar pedidos cancelables solicitando motivo obligatorio
- **THEN** reconsulta listado y detalle luego de una mutacion exitosa

---

### Requirement: Frontend de pedidos consume contratos definidos
El frontend SHALL consumir solamente los campos establecidos por `pedidos-api` para listados y detalles.

#### Scenario: No inventar campos
- **WHEN** se renderizan lista o detalle de pedidos
- **THEN** la UI usa unicamente datos definidos por los contratos `GET /api/v1/pedidos`, `GET /api/v1/pedidos/{id}`, `GET /api/v1/admin/pedidos` y `GET /api/v1/admin/pedidos/{id}`
- **THEN** no deriva datos inexistentes ni redefine reglas de ownership o permisos en cliente
