## MODIFIED Requirements

### Requirement: Checkout crea pedido real
El frontend SHALL permitir que un cliente autenticado cree un pedido real desde checkout consumiendo `POST /api/v1/pedidos`, y SHALL reflejar la modalidad de entrega elegida en el resumen previo a confirmar.

#### Scenario: Crear pedido de entrega a domicilio
- **WHEN** el cliente confirma checkout con direccion de entrega seleccionada
- **THEN** el frontend envia esa direccion en el contrato de creacion de pedidos
- **THEN** muestra costo de envio y total coherentes con la modalidad de entrega

#### Scenario: Crear pedido de retiro en local
- **WHEN** el cliente selecciona retiro en local
- **THEN** el frontend envia `direccionId=null`
- **THEN** muestra costo de envio `0` y un total coherente con el subtotal antes de confirmar

#### Scenario: Confirmacion exitosa
- **WHEN** el backend responde `201 Created`
- **THEN** el frontend limpia el carrito persistido
- **THEN** navega a `/pedidos/{id}` o muestra una confirmacion con el identificador del pedido si el detalle aun no esta disponible

#### Scenario: Error de creacion
- **WHEN** el backend rechaza la creacion por stock, direccion, forma de pago o validacion
- **THEN** el frontend muestra un mensaje accionable
- **THEN** conserva el carrito para que el usuario pueda corregirlo

---

### Requirement: Vista de detalle de pedido propio
El frontend SHALL reemplazar el placeholder de `/pedidos/:id` por una vista de detalle conectada al contrato backend y coherente con la modalidad del pedido.

#### Scenario: Cliente consulta detalle con entrega a domicilio
- **WHEN** un cliente navega a `/pedidos/{id}` de un pedido propio con direccion de entrega
- **THEN** la pagina muestra items snapshot, direccion snapshot, estado actual, costo de envio, total, historial y estado de pago

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

---

### Requirement: Panel operativo de pedidos
El frontend SHALL reemplazar el placeholder de `/admin/pedidos` por una vista funcional para `ADMIN` y `PEDIDOS`, incluyendo acciones coherentes con forma de pago y modalidad de cumplimiento.

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
