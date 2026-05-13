## MODIFIED Requirements

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
