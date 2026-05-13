# cart-frontend Specification

## Purpose
Define client cart UI behavior and cart state feedback.
## Requirements
### Requirement: Indicador visual de items en el carrito
El sistema SHALL mostrar un badge con la cantidad total de items en el carrito, visible en el header de la aplicacion solo para usuarios con rol unico `CLIENT`.

#### Scenario: Badge en el header
- **WHEN** el carrito tiene items y el usuario autenticado tiene rol unico `CLIENT`
- **THEN** el header muestra un badge con la cantidad total de items
- **THEN** el badge se actualiza inmediatamente cuando se agrega, quita o modifica un item
- **WHEN** el carrito esta vacio
- **THEN** el badge no se muestra (o muestra 0)

#### Scenario: Operational role does not see cart button
- **WHEN** an ADMIN, STOCK, or PEDIDOS user is authenticated
- **THEN** the private header does not show the cart button or cart drawer trigger

### Requirement: Feedback al agregar productos
El sistema SHALL mostrar una notificacion cuando un producto se agrega al carrito desde el catalogo o desde el detalle.

#### Scenario: Agregado exitoso
- **WHEN** el usuario agrega un producto disponible al carrito
- **THEN** se muestra una notificacion "Producto agregado al carrito."
- **THEN** la notificacion ofrece una accion para navegar a `/carrito`

#### Scenario: Cantidad en detalle de producto
- **WHEN** el usuario esta en el detalle publico de un producto disponible
- **THEN** puede seleccionar la cantidad a agregar antes de confirmar
- **THEN** la cantidad seleccionable esta limitada por el stock restante y por el maximo de 99 unidades
- **THEN** confirmar el agregado genera una sola notificacion para toda la cantidad agregada

#### Scenario: Sin stock restante
- **WHEN** el usuario intenta agregar un producto cuya cantidad restante ya esta en el carrito
- **THEN** se muestra una advertencia indicando que ya agrego todo el stock disponible
- **THEN** el boton de agregado queda deshabilitado cuando no hay stock restante

### Requirement: Drawer lateral del carrito
El sistema SHALL proveer un drawer lateral (panel deslizante desde la derecha) que muestre el contenido completo del carrito.

#### Scenario: Abrir drawer del carrito
- **WHEN** el usuario hace clic en el indicador/icono del carrito en el header
- **THEN** se abre un drawer desde la derecha con el contenido del carrito

#### Scenario: Listado de items en el drawer
- **WHEN** el drawer esta abierto y el carrito tiene items
- **THEN** se muestra cada item con: nombre, precio unitario, cantidad, foto (thumbnail), exclusiones aplicadas, y subtotal por item

#### Scenario: Controles de cantidad en el drawer
- **WHEN** el usuario ve un item en el drawer
- **THEN** puede incrementar o decrementar la cantidad (minimo 1, maximo 99 y maximo stock disponible del producto)

#### Scenario: Exclusiones visibles en el item
- **WHEN** un item tiene ingredientes excluidos
- **THEN** se muestran etiquetas "Sin {nombre_ingrediente}" en el item

#### Scenario: Resumen de totales en el drawer
- **WHEN** el drawer esta abierto
- **THEN** se muestra: subtotal (suma items), costo de envio ($50.00), y total (subtotal + envio)

#### Scenario: Boton Ir al checkout
- **WHEN** el carrito tiene al menos 1 item
- **THEN** el drawer muestra un boton "Ir al checkout" que navega a `/checkout`

#### Scenario: Estado vacio del carrito
- **WHEN** el drawer esta abierto y el carrito esta vacio
- **THEN** se muestra un mensaje "Tu carrito esta vacio" con un link para ir al catalogo

#### Scenario: Cerrar drawer
- **WHEN** el usuario hace clic fuera del drawer o en el boton de cerrar
- **THEN** el drawer se cierra

### Requirement: Modal de personalizacion antes de agregar
El sistema SHALL mostrar un modal/dropdown con los ingredientes removibles del producto antes de agregarlo al carrito.

#### Scenario: Seleccionar exclusiones
- **WHEN** el usuario hace clic en "Agregar al carrito" desde el catalogo o detalle de producto
- **THEN** se muestra un modal con la lista de ingredientes removibles del producto
- **THEN** el usuario puede seleccionar que ingredientes excluir
- **THEN** al confirmar, el producto se agrega al carrito con las exclusiones seleccionadas

#### Scenario: Agregar sin exclusiones
- **WHEN** el producto no tiene ingredientes removibles
- **THEN** se agrega directamente al carrito sin mostrar el modal de personalizacion

