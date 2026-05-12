## ADDED Requirements

### Requirement: Crear pedido desde carrito
El sistema SHALL exponer `POST /api/v1/pedidos` para que un usuario autenticado con rol `CLIENT` cree un pedido desde los items del carrito.

#### Scenario: Crear pedido exitosamente
- **WHEN** un cliente autenticado envia un body valido con al menos un item, forma de pago valida y direccion propia opcional
- **THEN** el sistema crea un `Pedido` con `estado_codigo=PENDIENTE`
- **THEN** el sistema crea un `DetallePedido` por cada item
- **THEN** el sistema crea un `HistorialEstadoPedido` inicial con `estado_desde=NULL` y `estado_hasta=PENDIENTE`
- **THEN** la API responde `201 Created` con `PedidoRead`

#### Scenario: Rechazar usuario sin permisos
- **WHEN** un usuario anonimo o sin rol `CLIENT` intenta crear un pedido
- **THEN** el sistema responde `401 Unauthorized` o `403 Forbidden`
- **THEN** no se persiste ningun pedido

---

### Requirement: Creacion atomica con Unit of Work
El sistema SHALL ejecutar la creacion de pedido, detalles e historial dentro de una unica transaccion gestionada por Unit of Work.

#### Scenario: Rollback ante error de item
- **WHEN** cualquier item del request falla por producto inexistente, no disponible o sin stock
- **THEN** el sistema revierte la transaccion completa
- **THEN** no queda ningun `Pedido`, `DetallePedido` ni `HistorialEstadoPedido` parcial

#### Scenario: Validar stock dentro de la transaccion
- **WHEN** el sistema procesa los items del pedido
- **THEN** valida stock suficiente dentro de la transaccion usando bloqueo de filas o mecanismo equivalente
- **THEN** rechaza el pedido completo si cualquier cantidad supera el stock vigente

---

### Requirement: Snapshots inmutables del pedido
El sistema SHALL capturar snapshots de datos volatiles al crear el pedido.

#### Scenario: Snapshot de producto
- **WHEN** se crea cada `DetallePedido`
- **THEN** el sistema guarda `nombre_snapshot` y `precio_snapshot` con los valores vigentes del producto
- **THEN** cambios posteriores del producto no alteran el detalle historico

#### Scenario: Snapshot de direccion
- **WHEN** el pedido usa direccion de entrega
- **THEN** el sistema guarda `direccion_snapshot` con los datos completos de la direccion al momento de crear el pedido
- **THEN** cambios posteriores de la direccion no alteran el pedido historico

#### Scenario: Retiro en local
- **WHEN** el request usa `direccionId=null`
- **THEN** el sistema permite crear el pedido como retiro en local
- **THEN** `direccion_snapshot` queda `NULL`

---

### Requirement: Reglas de calculo del pedido
El sistema SHALL calcular el total del pedido con los precios snapshot y el costo de envio vigente.

#### Scenario: Calcular total
- **WHEN** se crea un pedido
- **THEN** el total es la suma de `cantidad * precio_snapshot` de todos los detalles mas `costo_envio`
- **THEN** el total persistido no depende de cambios posteriores de precios

#### Scenario: No descontar stock al crear
- **WHEN** el pedido nace en estado `PENDIENTE`
- **THEN** el sistema valida stock disponible pero no descuenta stock
- **THEN** el descuento de stock queda reservado para la transicion futura a `CONFIRMADO`
