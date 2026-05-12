# pedidos-frontend Specification

## Purpose
Define el contrato frontend para crear pedidos desde checkout, consultar vistas de pedidos y operar pedidos desde admin alineado con los contratos backend aprobados.
## Requirements
### Requirement: Checkout crea pedido real
El frontend SHALL permitir que un cliente autenticado cree un pedido real desde la pantalla de checkout consumiendo `POST /api/v1/pedidos`.

#### Scenario: Crear pedido desde checkout
- **WHEN** el cliente confirma checkout con carrito valido, forma de pago y direccion seleccionada si corresponde
- **THEN** el frontend envia los items del carrito al backend usando el contrato de creacion de pedidos
- **THEN** muestra estado de carga mientras la mutacion esta pendiente

#### Scenario: Confirmacion exitosa
- **WHEN** el backend responde `201 Created`
- **THEN** el frontend limpia el carrito persistido
- **THEN** navega a `/pedidos/{id}` o muestra una confirmacion con el identificador del pedido si el detalle aun no esta disponible

#### Scenario: Error de creacion
- **WHEN** el backend rechaza la creacion por stock, direccion, forma de pago o validacion
- **THEN** el frontend muestra un mensaje accionable
- **THEN** conserva el carrito para que el usuario pueda corregirlo

---

### Requirement: Frontend no inventa contratos de pedido
El frontend SHALL consumir solo campos definidos por el contrato backend del change `order-creation`.

#### Scenario: Respuesta compacta
- **WHEN** `POST /api/v1/pedidos` responde `PedidoRead`
- **THEN** el frontend usa solo `id`, `estadoCodigo`, `total`, `costoEnvio` y `createdAt` para la confirmacion inmediata
- **THEN** no asume un contrato de detalle de pedido fuera de este change

---

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
El frontend SHALL reemplazar el placeholder de `/admin/pedidos` por una vista funcional para `ADMIN` y `PEDIDOS`, incluyendo acciones coherentes con la forma de pago del pedido.

#### Scenario: Operador confirma pago offline elegible
- **WHEN** el detalle operativo muestra un pedido `PENDIENTE` con `formaPagoCodigo=EFECTIVO|TRANSFERENCIA`
- **THEN** la interfaz ofrece una accion visible para confirmar el pago offline
- **THEN** al completarse la mutacion se refrescan listado y detalle

#### Scenario: Operador no ve confirmacion offline en MercadoPago
- **WHEN** el detalle operativo muestra un pedido `MERCADOPAGO`
- **THEN** la interfaz no ofrece la accion de confirmacion offline

#### Scenario: Operador recibe feedback de error
- **WHEN** la confirmacion offline falla por permisos, estado invalido o conflicto de negocio
- **THEN** la interfaz muestra un mensaje accionable sin desincronizar la vista

---

### Requirement: Frontend de pedidos consume contratos definidos
El frontend SHALL consumir solamente los campos establecidos por `pedidos-api` para listados y detalles.

#### Scenario: No inventar campos
- **WHEN** se renderizan lista o detalle de pedidos
- **THEN** la UI usa unicamente datos definidos por los contratos `GET /api/v1/pedidos`, `GET /api/v1/pedidos/{id}`, `GET /api/v1/admin/pedidos` y `GET /api/v1/admin/pedidos/{id}`
- **THEN** no deriva datos inexistentes ni redefine reglas de ownership o permisos en cliente

### Requirement: Frontend de pedidos comunica estados de pago sin ambiguedad
El frontend SHALL distinguir estados pendientes segun el metodo de pago para evitar que `PENDIENTE` se interprete como fallo o ausencia de gestion.

#### Scenario: Pedido MercadoPago pendiente
- **WHEN** un pedido usa `MERCADOPAGO` y sigue pendiente de aprobacion
- **THEN** la interfaz comunica que el pago esta pendiente o en proceso segun los datos disponibles

#### Scenario: Pedido offline pendiente
- **WHEN** un pedido usa `EFECTIVO` o `TRANSFERENCIA` y esta `PENDIENTE`
- **THEN** la interfaz comunica que queda pendiente de validacion operativa del pago offline

#### Scenario: Pedido confirmado
- **WHEN** un pedido alcanza `CONFIRMADO`
- **THEN** la interfaz comunica que el pago quedo validado conforme al contrato vigente

