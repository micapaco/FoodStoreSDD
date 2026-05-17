## MODIFIED Requirements

### Requirement: ADMIN como superrol operativo
El backend SHALL permitir que `ADMIN` satisfaga dependencias de rol de menor alcance, incluyendo endpoints de cliente, porque el proyecto trata admin como rol abarcador.

#### Scenario: ADMIN accede endpoint cliente
- **WHEN** un endpoint requiere rol `CLIENT`
- **AND** el usuario autenticado tiene rol `ADMIN`
- **THEN** la dependencia de autorizacion permite continuar
- **AND** las reglas de ownership del caso de uso siguen aplicando sobre el usuario autenticado

### Requirement: Crear pedido con pago MercadoPago desde checkout
El backend SHALL exponer un caso de uso atomico para que el checkout cree un pedido `MERCADOPAGO` junto con su intento de pago, evitando pedidos pendientes sin intento trazable.

#### Scenario: Pago aprobado crea y confirma pedido
- **WHEN** un cliente envia datos validos de pedido y tarjeta para MercadoPago
- **THEN** el sistema crea el pedido con forma de pago `MERCADOPAGO`
- **AND** registra el intento de pago con `externalReference` e `idempotencyKey`
- **AND** si MercadoPago devuelve `approved`, confirma el pedido y descuenta stock

#### Scenario: Pago pendiente conserva pedido trazable
- **WHEN** MercadoPago devuelve `pending` o `in_process`
- **THEN** el sistema conserva el pedido en `PENDIENTE`
- **AND** el pedido tiene un intento de pago asociado visible por estado de pago

#### Scenario: Pago rechazado no deja pedido pendiente
- **WHEN** MercadoPago devuelve `rejected` o `cancelled`
- **THEN** el sistema registra el intento de pago
- **AND** cancela automaticamente el pedido con un motivo tecnico legible
- **AND** el frontend puede conservar el carrito para reintento

#### Scenario: Forma de pago incompatible
- **WHEN** el request del pedido no usa `formaPagoCodigo=MERCADOPAGO`
- **THEN** el sistema rechaza la operacion porque el endpoint es especifico de MercadoPago
