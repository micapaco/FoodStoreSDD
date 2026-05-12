## ADDED Requirements

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
