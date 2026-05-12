# pedidos-api Specification

## Purpose
Define el contrato backend para creacion atomica de pedidos, calculo de totales, snapshots, ciclo de vida FSM e historial append-only.
## Requirements
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

### Requirement: Confirmar pedido automaticamente por pago aprobado
El sistema SHALL confirmar automaticamente un pedido `PENDIENTE` cuando MercadoPago informa un pago aprobado, y SHALL permitir una confirmacion explicita separada para pagos offline definidos por este change.

#### Scenario: Confirmacion automatica exitosa
- **WHEN** MercadoPago informa estado real `approved` para un pedido `PENDIENTE`
- **THEN** el sistema cambia el pedido a `CONFIRMADO`
- **THEN** descuenta stock de los productos del pedido
- **THEN** inserta un `HistorialEstadoPedido` con `estado_desde=PENDIENTE` y `estado_hasta=CONFIRMADO`
- **THEN** todo ocurre dentro de una unica transaccion

#### Scenario: Confirmacion manual generica rechazada
- **WHEN** un usuario intenta avanzar manualmente un pedido a `CONFIRMADO` mediante el endpoint generico de cambio de estado
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado, stock ni historial

---

### Requirement: Avanzar manualmente estados operativos
El sistema SHALL exponer `PATCH /api/v1/pedidos/{pedido_id}/estado` para que usuarios `ADMIN` o `PEDIDOS` avancen pedidos segun la FSM.

#### Scenario: Confirmado a preparacion
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=EN_PREP` para un pedido `CONFIRMADO`
- **THEN** el sistema cambia el pedido a `EN_PREP`
- **THEN** inserta historial `CONFIRMADO -> EN_PREP`
- **THEN** la API responde `200 OK` con `PedidoRead`

#### Scenario: Preparacion a camino
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=EN_CAMINO` para un pedido `EN_PREP`
- **THEN** el sistema cambia el pedido a `EN_CAMINO`
- **THEN** inserta historial `EN_PREP -> EN_CAMINO`

#### Scenario: Camino a entregado
- **WHEN** un usuario `ADMIN` o `PEDIDOS` envia `nuevoEstado=ENTREGADO` para un pedido `EN_CAMINO`
- **THEN** el sistema cambia el pedido a `ENTREGADO`
- **THEN** inserta historial `EN_CAMINO -> ENTREGADO`

#### Scenario: Transicion invalida
- **WHEN** se solicita un salto, retroceso o transicion no definida por la FSM
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado ni inserta historial

---

### Requirement: Cancelar pedidos con motivo
El sistema SHALL permitir cancelaciones solo en estados definidos por la FSM y SHALL exigir motivo no vacio.

#### Scenario: Cancelar pendiente
- **WHEN** el propietario, `ADMIN` o `PEDIDOS` cancela un pedido `PENDIENTE` con motivo valido
- **THEN** el sistema cambia el pedido a `CANCELADO`
- **THEN** no modifica stock
- **THEN** inserta historial `PENDIENTE -> CANCELADO`
- **THEN** el historial conserva el motivo de cancelacion

#### Scenario: Cancelar confirmado o en preparacion
- **WHEN** `ADMIN` o `PEDIDOS` cancela un pedido `CONFIRMADO` o `EN_PREP` con motivo valido
- **THEN** el sistema cambia el pedido a `CANCELADO`
- **THEN** restaura stock de los productos del pedido
- **THEN** inserta historial hacia `CANCELADO`
- **THEN** el historial conserva el motivo de cancelacion

#### Scenario: Motivo obligatorio
- **WHEN** se solicita cancelar un pedido sin motivo o con motivo en blanco
- **THEN** el sistema responde error de validacion
- **THEN** no cambia estado, stock ni historial

#### Scenario: Cancelacion no permitida
- **WHEN** se intenta cancelar un pedido `EN_CAMINO`, `ENTREGADO` o `CANCELADO`
- **THEN** el sistema responde `409 Conflict`
- **THEN** no cambia estado, stock ni historial

---

### Requirement: Respetar estados terminales
El sistema SHALL impedir cualquier transicion desde estados terminales.

#### Scenario: Entregado terminal
- **WHEN** un pedido esta `ENTREGADO`
- **THEN** cualquier intento de cambiar su estado responde `409 Conflict`

#### Scenario: Cancelado terminal
- **WHEN** un pedido esta `CANCELADO`
- **THEN** cualquier intento de cambiar su estado responde `409 Conflict`

---

### Requirement: Consultar historial cronologico
El sistema SHALL exponer `GET /api/v1/pedidos/{pedido_id}/historial` para consultar el historial append-only de un pedido.

#### Scenario: Propietario consulta historial
- **WHEN** el propietario consulta el historial de su pedido
- **THEN** el sistema responde `200 OK`
- **THEN** retorna los registros ordenados por `created_at ASC`
- **THEN** incluye `motivo` cuando la transicion lo registro

#### Scenario: Operador consulta historial
- **WHEN** un usuario `ADMIN` o `PEDIDOS` consulta el historial de cualquier pedido
- **THEN** el sistema responde `200 OK`

#### Scenario: Cliente consulta historial ajeno
- **WHEN** un cliente consulta el historial de un pedido ajeno
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Historial append-only
- **WHEN** se registra una transicion
- **THEN** el sistema inserta un nuevo `HistorialEstadoPedido`
- **THEN** ninguna capa actualiza o elimina registros existentes de historial

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

### Requirement: Confirmar pagos offline pendientes
El sistema SHALL exponer una operacion dedicada para que usuarios `ADMIN` o `PEDIDOS` confirmen pagos offline de pedidos `PENDIENTE` con `forma_pago_codigo=EFECTIVO|TRANSFERENCIA`.

#### Scenario: Confirmar efectivo pendiente
- **WHEN** un usuario `ADMIN` o `PEDIDOS` confirma un pedido `PENDIENTE` cuya forma de pago es `EFECTIVO`
- **THEN** el sistema cambia el pedido a `CONFIRMADO`
- **THEN** descuenta stock de los productos del pedido
- **THEN** registra historial `PENDIENTE -> CONFIRMADO`
- **THEN** la API responde `200 OK`

#### Scenario: Confirmar transferencia pendiente
- **WHEN** un usuario `ADMIN` o `PEDIDOS` confirma un pedido `PENDIENTE` cuya forma de pago es `TRANSFERENCIA`
- **THEN** el sistema aplica la misma transicion atomica `PENDIENTE -> CONFIRMADO`
- **THEN** conserva trazabilidad del actor operativo que ejecuto la accion

#### Scenario: Rechazar metodo no offline
- **WHEN** se intenta usar la confirmacion offline sobre un pedido `MERCADOPAGO`
- **THEN** el sistema responde `409 Conflict` o `422 Unprocessable Entity`
- **THEN** no cambia estado, stock ni historial

#### Scenario: Rechazar pedido no pendiente
- **WHEN** se intenta confirmar offline un pedido que ya no esta en `PENDIENTE`
- **THEN** el sistema responde `409 Conflict`
- **THEN** no descuenta stock dos veces ni duplica historial

#### Scenario: Rechazar actor sin rol operativo
- **WHEN** un usuario sin rol `ADMIN` ni `PEDIDOS` intenta confirmar un pago offline
- **THEN** el sistema responde `403 Forbidden`

