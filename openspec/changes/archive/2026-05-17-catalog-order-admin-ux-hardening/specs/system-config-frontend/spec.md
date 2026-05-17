## MODIFIED Requirements

### Requirement: Indicador de pedidos desactivados
When `pedidos_habilitados` is `false`, the frontend SHALL display a prominent warning indicating that order creation is currently disabled.
The public/customer experience SHALL allow catalog browsing and cart editing, but SHALL prevent checkout confirmation.

#### Scenario: Banner visible cuando pedidos desactivados
- **WHEN** `pedidos_habilitados` is `false`
- **THEN** public and private customer layouts show a visible warning banner "El local no esta aceptando pedidos en este momento"
- **AND** if `mensaje_sistema` is present, the banner also includes that message

#### Scenario: Catalogo sigue navegable
- **WHEN** `pedidos_habilitados` is `false`
- **THEN** the customer can browse products and manage cart items

#### Scenario: Checkout bloqueado por configuracion
- **WHEN** `pedidos_habilitados` is `false` and the customer reaches checkout
- **THEN** the final create-order action is disabled or blocked with a clear message
- **AND** the frontend does not empty the cart
