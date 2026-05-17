# pagos-api Specification

## Purpose
TBD - created by archiving change payment-integration. Update Purpose after archive.
## Requirements
### Requirement: Crear intento de pago MercadoPago
El sistema SHALL exponer `POST /api/v1/pagos/crear` para que un usuario `CLIENT` cree un intento de pago MercadoPago sobre un pedido propio en estado `PENDIENTE`.

#### Scenario: Crear intento exitoso
- **WHEN** un cliente autenticado envia un request valido para un pedido propio `PENDIENTE` con `forma_pago_codigo=MERCADOPAGO`
- **THEN** el sistema genera un `idempotency_key` unico
- **THEN** el sistema genera un `external_reference` unico por intento
- **THEN** el sistema llama a MercadoPago con token, metodo de pago, cuotas, email, identificacion del pagador e idempotency key
- **THEN** el sistema persiste un `Pago` asociado al pedido
- **THEN** la API responde `201 Created` con `PagoRead`

#### Scenario: Crear intento aprobado inmediatamente
- **WHEN** MercadoPago responde `approved` en la creacion autenticada del pago
- **THEN** el sistema confirma el pedido dentro de la misma transaccion
- **THEN** el webhook posterior del mismo pago no duplica descuento ni historial

#### Scenario: No recibir datos sensibles de tarjeta
- **WHEN** el cliente envia el request de creacion de pago
- **THEN** el backend acepta solo `cardToken` y metadatos no sensibles del pago
- **THEN** el backend no acepta numero de tarjeta, CVV ni fecha de vencimiento

#### Scenario: Rechazar pedido no pagable
- **WHEN** el pedido no existe, no pertenece al cliente, no esta en `PENDIENTE` o no usa `MERCADOPAGO`
- **THEN** el sistema responde con `404`, `403`, `409` o `422` segun corresponda
- **THEN** no crea un intento de pago local

#### Scenario: Evitar intento paralelo bloqueante
- **WHEN** el pedido ya tiene un pago `approved` o un intento `pending`/`in_process`
- **THEN** el sistema responde `409 Conflict`
- **THEN** no crea un nuevo intento hasta que el intento anterior se resuelva

---

### Requirement: Reintentar pago rechazado o cancelado
El sistema SHALL permitir multiples intentos de pago para un mismo pedido cuando el intento anterior fue `rejected` o `cancelled`.

#### Scenario: Reintento de pago rechazado
- **WHEN** un pedido propio sigue en `PENDIENTE` y su ultimo intento esta `rejected`
- **THEN** el cliente puede llamar nuevamente a `POST /api/v1/pagos/crear`
- **THEN** el sistema crea un nuevo `Pago` con nueva `idempotency_key`
- **THEN** conserva el intento anterior sin modificarlo destructivamente

---

### Requirement: Consultar estado de pago por pedido
El sistema SHALL exponer `GET /api/v1/pagos/{pedido_id}` para consultar el estado de pagos de un pedido.

#### Scenario: Propietario consulta estado
- **WHEN** el cliente propietario consulta el pago de su pedido
- **THEN** el sistema responde `200 OK`
- **THEN** incluye estado del pedido, lista de intentos y ultimo intento
- **THEN** incluye monto, estado MP, detalle de estado y fecha de ultimo update

#### Scenario: Rechazar pedido ajeno
- **WHEN** un cliente consulta pagos de un pedido ajeno
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Admin consulta estado
- **WHEN** un usuario `ADMIN` consulta pagos de cualquier pedido
- **THEN** el sistema responde `200 OK`

---

### Requirement: Procesar webhook MercadoPago verificando estado real
El sistema SHALL exponer `POST /api/v1/pagos/webhook` para recibir notificaciones MercadoPago, validar origen y consultar el estado real del recurso antes de persistir cambios.

#### Scenario: Webhook valido
- **WHEN** MercadoPago envia una notificacion con firma valida y `data.id`
- **THEN** el endpoint responde `200 OK`
- **THEN** el sistema consulta MercadoPago por el recurso notificado
- **THEN** el sistema actualiza el intento de pago local con el estado real

#### Scenario: No confiar en el payload entrante
- **WHEN** el payload contiene un `status`
- **THEN** el sistema no usa ese `status` como fuente de verdad
- **THEN** usa el estado devuelto por la consulta autenticada a MercadoPago

#### Scenario: Firma invalida
- **WHEN** la firma u origen de la notificacion no puede validarse
- **THEN** el sistema rechaza el procesamiento
- **THEN** no actualiza ningun pago ni pedido

---

### Requirement: Confirmar pedido por pago aprobado
El sistema SHALL confirmar automaticamente un pedido cuando MercadoPago informa estado real `approved`.

#### Scenario: Pago aprobado
- **WHEN** el estado real de MercadoPago es `approved` y el pedido esta `PENDIENTE`
- **THEN** el sistema actualiza `Pago.mp_status` a `approved`
- **THEN** cambia `Pedido.estado_codigo` a `CONFIRMADO`
- **THEN** descuenta stock de los productos del pedido
- **THEN** inserta un `HistorialEstadoPedido` `PENDIENTE -> CONFIRMADO`
- **THEN** todo ocurre dentro de una unica transaccion

#### Scenario: Webhook duplicado aprobado
- **WHEN** se recibe dos veces la misma notificacion aprobada
- **THEN** el sistema no descuenta stock dos veces
- **THEN** el sistema no inserta historial duplicado

#### Scenario: Pago no aprobado
- **WHEN** el estado real es `rejected`, `pending`, `in_process` o `cancelled`
- **THEN** el sistema actualiza el pago local
- **THEN** el pedido permanece en `PENDIENTE`

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

