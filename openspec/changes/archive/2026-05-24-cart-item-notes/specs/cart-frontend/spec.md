## MODIFIED Requirements

### Requirement: Modal de personalizacion antes de agregar
El sistema SHALL mostrar un modal/dropdown con los ingredientes removibles del producto y un campo de texto libre para notas de preparación antes de agregarlo al carrito.

#### Scenario: Seleccionar exclusiones
- **WHEN** el usuario hace clic en "Agregar al carrito" desde el catalogo o detalle de producto
- **THEN** se muestra un modal con la lista de ingredientes removibles del producto
- **THEN** el usuario puede seleccionar que ingredientes excluir
- **THEN** al confirmar, el producto se agrega al carrito con las exclusiones seleccionadas

#### Scenario: Ingresar notas de preparacion
- **WHEN** el usuario abre el modal de personalización
- **THEN** se muestra un campo de texto libre (textarea o input) para ingresar notas (ej. "sin sal", "extra queso", "término medio")
- **THEN** el campo es opcional — el usuario puede dejarlo vacío
- **THEN** al confirmar, las notas se incluyen en `personalizacion.notas` del ítem agregado

#### Scenario: Agregar sin exclusiones
- **WHEN** el producto no tiene ingredientes removibles
- **THEN** se muestra el modal de personalización igualmente con el campo de notas
- **WHEN** el usuario no ingresa notas y confirma
- **THEN** el producto se agrega directamente al carrito sin notas

### Requirement: Drawer lateral del carrito
El sistema SHALL proveer un drawer lateral (panel deslizante desde la derecha) que muestre el contenido completo del carrito.

#### Scenario: Abrir drawer del carrito
- **WHEN** el usuario hace clic en el indicador/icono del carrito en el header
- **THEN** se abre un drawer desde la derecha con el contenido del carrito

#### Scenario: Listado de items en el drawer
- **WHEN** el drawer esta abierto y el carrito tiene items
- **THEN** se muestra cada item con: nombre, precio unitario, cantidad, foto (thumbnail), exclusiones aplicadas, notas (si existen) y subtotal por item

#### Scenario: Notas visibles en el item del drawer
- **WHEN** un item tiene `personalizacion.notas` no vacío
- **THEN** se muestra el texto de notas en el item (read-only, en modo de visualización)
- **WHEN** un item no tiene notas
- **THEN** no se muestra ningún elemento de notas en ese item

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
