## ADDED Requirements

### Requirement: CartStore gestiona el estado del carrito client-side
El sistema SHALL proveer un store Zustand (`cartStore`) que gestione el estado del carrito de compras completamente en el cliente, sin interacción con el backend.

#### Scenario: Agregar producto al carrito
- **WHEN** un usuario agrega un producto al carrito con `{ producto_id, nombre, precio, cantidad, imagen_url, exclusiones }`
- **THEN** el producto se agrega a `items[]` en el store
- **THEN** si el producto ya existe en el carrito (mismo `producto_id` y mismas `exclusiones`), se incrementa la cantidad

#### Scenario: Remover producto del carrito
- **WHEN** un usuario remueve un item del carrito
- **THEN** el item se elimina de `items[]`

#### Scenario: Actualizar cantidad de un producto
- **WHEN** un usuario cambia la cantidad de un item en el carrito
- **THEN** la cantidad se actualiza (mínimo 1, máximo 99)

#### Scenario: Limpiar carrito
- **WHEN** un usuario vacía el carrito o completa una compra
- **THEN** todos los items se eliminan de `items[]`

#### Scenario: Persistencia en localStorage
- **WHEN** el usuario agrega o modifica items en el carrito
- **THEN** el estado se persiste automáticamente en localStorage
- **WHEN** el usuario recarga la página
- **THEN** el carrito se restaura desde localStorage

#### Scenario: Cómputo de subtotal
- **WHEN** el store computa `subtotal()`
- **THEN** retorna la suma de `item.precio * item.cantidad` para todos los items

#### Scenario: Cómputo de costo de envío
- **WHEN** el store computa `costoEnvio`
- **THEN** retorna 50.00 si hay al menos 1 item, 0 si el carrito está vacío

#### Scenario: Cómputo de total
- **WHEN** el store computa `total()`
- **THEN** retorna `subtotal() + costoEnvio`

#### Scenario: Partialize de persistencia
- **WHEN** el store persiste su estado en localStorage
- **THEN** solo persiste `items[]`, no los valores computados
