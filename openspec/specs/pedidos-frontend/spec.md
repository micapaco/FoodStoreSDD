# pedidos-frontend Specification

## Purpose
Define el contrato frontend para crear pedidos desde checkout, consultar vistas de pedidos y operar pedidos desde admin alineado con los contratos backend aprobados.
## Requirements
### Requirement: Checkout crea pedido real
El frontend SHALL permitir que un cliente autenticado cree un pedido real desde checkout consumiendo `POST /api/v1/pedidos`, y SHALL reflejar la modalidad de entrega elegida en el resumen previo a confirmar.
Cuando `pedidos_habilitados=false`, el frontend SHALL bloquear la confirmacion antes de llamar al backend y explicar que el local no esta aceptando pedidos.
Cuando la forma de pago sea `MERCADOPAGO`, el frontend SHALL mostrar el formulario de pago en checkout antes de navegar a la confirmacion.
El checkout SHALL mostrar exclusiones seleccionadas por nombre cuando existan, pero SHALL NOT mostrar ingredientes incluidos.
El carrito persistido SHALL aislarse por usuario autenticado.

#### Scenario: Crear pedido de entrega a domicilio
- **WHEN** el cliente confirma checkout con direccion de entrega seleccionada
- **THEN** el frontend envia esa direccion en el contrato de creacion de pedidos
- **THEN** muestra costo de envio y total coherentes con la modalidad de entrega

#### Scenario: Crear pedido de retiro en local
- **WHEN** el cliente selecciona retiro en local
- **THEN** el frontend envia `direccionId=null`
- **THEN** muestra costo de envio `0` y un total coherente con el subtotal antes de confirmar

#### Scenario: Confirmacion exitosa con exclusiones
- **WHEN** el backend responde `201 Created` y el pedido contiene productos con exclusiones
- **THEN** el frontend muestra las exclusiones por nombre en la confirmacion o resumen inmediato disponible
- **THEN** limpia el carrito persistido
- **THEN** navega a `/pedidos/{id}` o muestra una confirmacion con el identificador del pedido si el detalle aun no esta disponible

#### Scenario: Pedidos deshabilitados antes de confirmar
- **WHEN** `pedidos_habilitados=false` en la configuracion publica
- **THEN** el frontend deshabilita o bloquea la accion final de crear pedido
- **AND** muestra un mensaje claro sin vaciar el carrito

#### Scenario: Error de creacion
- **WHEN** el backend rechaza la creacion por stock, direccion, forma de pago, validacion o `503`
- **THEN** el frontend muestra un mensaje accionable
- **THEN** conserva el carrito para que el usuario pueda corregirlo o esperar reapertura

#### Scenario: MercadoPago se paga desde checkout
- **WHEN** el cliente selecciona `MERCADOPAGO` y el carrito/direccion son validos
- **THEN** el frontend muestra el formulario de MercadoPago dentro de checkout
- **AND** no navega a la confirmacion hasta recibir respuesta del intento de pago

#### Scenario: MercadoPago rechazado conserva carrito
- **WHEN** MercadoPago devuelve un intento `rejected` o `cancelled`
- **THEN** el frontend muestra el rechazo en checkout
- **AND** conserva el carrito para que el cliente pueda reintentar o elegir otra forma de pago

#### Scenario: Cambio de usuario no hereda carrito
- **WHEN** un usuario agrega productos al carrito y luego inicia sesion otro usuario en el mismo navegador
- **THEN** el carrito local cambia de propietario
- **AND** el nuevo usuario no ve los items del usuario anterior

#### Scenario: ADMIN ve carrito en vista cliente
- **WHEN** un usuario `ADMIN` navega rutas cliente desde "Ver como cliente"
- **THEN** el shell muestra navegacion de cliente, boton de carrito y acceso a checkout
- **AND** mantiene disponible una accion para volver a `Panel admin`

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
El frontend SHALL reemplazar el placeholder de `/pedidos/:id` por una vista de detalle conectada al contrato backend y coherente con la modalidad del pedido.
Los items con exclusiones SHALL mostrarlas por nombre, no como IDs crudos.

#### Scenario: Cliente consulta detalle con entrega a domicilio
- **WHEN** un cliente navega a `/pedidos/{id}` de un pedido propio con direccion de entrega
- **THEN** la pagina muestra items snapshot, exclusiones por nombre, direccion snapshot, estado actual, costo de envio, total, historial y estado de pago

#### Scenario: Cliente consulta detalle de retiro en local
- **WHEN** un cliente navega a `/pedidos/{id}` de un pedido propio con `direccionSnapshot=NULL`
- **THEN** la pagina comunica `Retiro en local`
- **THEN** muestra costo de envio `0` y el total persistido por backend

#### Scenario: Cliente no puede ver detalle ajeno
- **WHEN** el backend responde `403 Forbidden`
- **THEN** la interfaz muestra un estado de acceso denegado coherente con el shell existente

#### Scenario: Pedido no encontrado
- **WHEN** el backend responde `404 Not Found`
- **THEN** la vista muestra un estado de recurso inexistente o inaccesible sin romper la navegacion

### Requirement: Panel operativo de pedidos
El frontend SHALL reemplazar el placeholder de `/admin/pedidos` por una vista funcional para `ADMIN` y `PEDIDOS`, incluyendo acciones coherentes con forma de pago y modalidad de cumplimiento.
El detalle operativo SHALL mostrar exclusiones de ingredientes por nombre cuando existan.
El historial operativo SHALL mostrar el motivo de cada transicion cuando exista, incluyendo cancelaciones.

#### Scenario: Operador ve exclusiones de un item
- **WHEN** el detalle operativo muestra un item con `personalizacionDetalle`
- **THEN** la interfaz muestra una linea legible como `Sin queso, sin cebolla`

#### Scenario: Operador ve avance de entrega a domicilio
- **WHEN** el detalle operativo muestra un pedido `EN_PREP` con direccion de entrega
- **THEN** la interfaz ofrece la accion para avanzar a `EN_CAMINO`

#### Scenario: Operador ve cierre directo de retiro en local
- **WHEN** el detalle operativo muestra un pedido `EN_PREP` con retiro en local
- **THEN** la interfaz no ofrece `EN_CAMINO`
- **THEN** ofrece la accion compatible para cerrar el pedido en `ENTREGADO`

#### Scenario: Operador recibe feedback de error por transicion incompatible
- **WHEN** el backend rechaza una transicion por modalidad invalida
- **THEN** la interfaz muestra un mensaje accionable y refresca la vista sin quedar desincronizada

#### Scenario: Operador ve motivo de cancelacion
- **WHEN** el historial del pedido contiene una transicion a `CANCELADO` con `motivo`
- **THEN** la interfaz muestra ese motivo en el detalle operativo

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

