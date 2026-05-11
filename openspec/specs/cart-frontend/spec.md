## ADDED Requirements

### Requirement: Indicador visual de items en el carrito
El sistema SHALL mostrar un badge con la cantidad total de items en el carrito, visible en el header de la aplicación para usuarios autenticados.

#### Scenario: Badge en el header
- **WHEN** el carrito tiene items
- **THEN** el header muestra un badge con la cantidad total de items
- **WHEN** el carrito está vacío
- **THEN** el badge no se muestra (o muestra 0)

---

### Requirement: Drawer lateral del carrito
El sistema SHALL proveer un drawer lateral (panel deslizante desde la derecha) que muestre el contenido completo del carrito.

#### Scenario: Abrir drawer del carrito
- **WHEN** el usuario hace clic en el indicador/icono del carrito en el header
- **THEN** se abre un drawer desde la derecha con el contenido del carrito

#### Scenario: Listado de items en el drawer
- **WHEN** el drawer está abierto y el carrito tiene items
- **THEN** se muestra cada item con: nombre, precio unitario, cantidad, foto (thumbnail), exclusiones aplicadas, y subtotal por item

#### Scenario: Controles de cantidad en el drawer
- **WHEN** el usuario ve un item en el drawer
- **THEN** puede incrementar o decrementar la cantidad (mínimo 1, máximo 99)

#### Scenario: Exclusiones visibles en el item
- **WHEN** un item tiene ingredientes excluidos
- **THEN** se muestran etiquetas "Sin {nombre_ingrediente}" en el item

#### Scenario: Resumen de totales en el drawer
- **WHEN** el drawer está abierto
- **THEN** se muestra: subtotal (suma items), costo de envío ($50.00), y total (subtotal + envío)

#### Scenario: Botón Ir al checkout
- **WHEN** el carrito tiene al menos 1 item
- **THEN** el drawer muestra un botón "Ir al checkout" que navega a `/checkout`

#### Scenario: Estado vacío del carrito
- **WHEN** el drawer está abierto y el carrito está vacío
- **THEN** se muestra un mensaje "Tu carrito está vacío" con un link para ir al catálogo

#### Scenario: Cerrar drawer
- **WHEN** el usuario hace clic fuera del drawer o en el botón de cerrar
- **THEN** el drawer se cierra

---

### Requirement: Modal de personalización antes de agregar
El sistema SHALL mostrar un modal/dropdown con los ingredientes removibles del producto antes de agregarlo al carrito.

#### Scenario: Seleccionar exclusiones
- **WHEN** el usuario hace clic en "Agregar al carrito" desde el catálogo o detalle de producto
- **THEN** se muestra un modal con la lista de ingredientes removibles del producto
- **THEN** el usuario puede seleccionar qué ingredientes excluir
- **THEN** al confirmar, el producto se agrega al carrito con las exclusiones seleccionadas

#### Scenario: Agregar sin exclusiones
- **WHEN** el producto no tiene ingredientes removibles
- **THEN** se agrega directamente al carrito sin mostrar el modal de personalización
