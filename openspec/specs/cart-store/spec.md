## ADDED Requirements

### Requirement: CartStore gestiona el estado del carrito client-side
El sistema SHALL proveer un store Zustand (`cartStore`) que gestione el estado del carrito de compras completamente en el cliente, sin interaccion con el backend.

#### Scenario: Agregar producto al carrito
- **WHEN** un usuario agrega un producto al carrito con `{ producto_id, nombre, precio, cantidad, imagen_url, exclusiones, notas }`
- **THEN** el producto se agrega a `items[]` en el store
- **THEN** si el producto ya existe en el carrito (mismo `producto_id`, mismas `exclusiones` Y mismas `notas`), se incrementa la cantidad
- **THEN** si el mismo producto tiene distintas `notas`, se agrega como un ítem separado
- **THEN** la cantidad total del producto en el carrito no supera el stock disponible ni el maximo de 99 unidades

#### Scenario: Remover producto del carrito
- **WHEN** un usuario remueve un item del carrito
- **THEN** el item se elimina de `items[]`

#### Scenario: Actualizar cantidad de un producto
- **WHEN** un usuario cambia la cantidad de un item en el carrito
- **THEN** la cantidad se actualiza (minimo 1, maximo 99 y maximo stock disponible del producto)

#### Scenario: Limitar cantidad por stock disponible
- **WHEN** un usuario intenta agregar o incrementar un producto por encima del stock disponible
- **THEN** el store mantiene la cantidad maxima permitida para ese producto
- **THEN** no se crean cantidades negativas ni cantidades mayores a 99

#### Scenario: Limpiar carrito
- **WHEN** un usuario vacia el carrito o completa una compra
- **THEN** todos los items se eliminan de `items[]`

#### Scenario: Persistencia en localStorage
- **WHEN** el usuario agrega o modifica items en el carrito
- **THEN** el estado se persiste automaticamente en localStorage
- **WHEN** el usuario recarga la pagina
- **THEN** el carrito se restaura desde localStorage
- **THEN** items persistidos sin campo `notas` se tratan como `notas = ''` sin romper

#### Scenario: Computo de subtotal
- **WHEN** el store computa `subtotal()`
- **THEN** retorna la suma de `item.precio * item.cantidad` para todos los items

#### Scenario: Computo de costo de envio
- **WHEN** el store computa `costoEnvio`
- **THEN** retorna 50.00 si hay al menos 1 item, 0 si el carrito esta vacio

#### Scenario: Computo de total
- **WHEN** el store computa `total()`
- **THEN** retorna `subtotal() + costoEnvio`

#### Scenario: Partialize de persistencia
- **WHEN** el store persiste su estado en localStorage
- **THEN** solo persiste `items[]`, no los valores computados

### Requirement: Personalizacion incluye notas de preparacion
El tipo `Personalizacion` SHALL incluir un campo opcional `notas?: string` que representa instrucciones libres de preparación por ítem.

#### Scenario: Personalizacion con notas
- **WHEN** el usuario ingresa `notas` al agregar un producto
- **THEN** `personalizacion.notas` contiene el texto ingresado
- **THEN** `notas` viaja en el payload de checkout dentro de `personalizacion`

#### Scenario: Personalizacion sin notas
- **WHEN** el usuario agrega un producto sin completar el campo de notas
- **THEN** `personalizacion.notas` es `undefined` o string vacío
- **THEN** el sistema lo trata como ausencia de nota y no envía texto vacío al backend
