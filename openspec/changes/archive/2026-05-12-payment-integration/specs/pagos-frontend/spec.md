## ADDED Requirements

### Requirement: Iniciar pago MercadoPago con CardPayment
El frontend SHALL permitir que un cliente inicie el pago MercadoPago de un pedido `PENDIENTE` usando `CardPayment` embebido y consumiendo el contrato backend de pagos.

#### Scenario: Iniciar pago de pedido creado
- **WHEN** el cliente crea o selecciona un pedido `PENDIENTE` con forma de pago `MERCADOPAGO`
- **THEN** el frontend inicializa el SDK de MercadoPago con la public key
- **THEN** renderiza `CardPayment`
- **THEN** obtiene el token requerido por MercadoPago desde el browser
- **THEN** llama `POST /api/v1/pagos/crear` con token, metodo de pago, cuotas, email e identificacion del pagador
- **THEN** no envia datos sensibles de tarjeta al backend

#### Scenario: Estado transitorio no persistido
- **WHEN** el flujo de pago avanza por `processing`, `approved`, `rejected` o `error`
- **THEN** el frontend actualiza `paymentStore`
- **THEN** `paymentStore` no se persiste en localStorage

---

### Requirement: Consultar estado de pago desde backend
El frontend SHALL usar TanStack Query para consultar el estado real de pago desde `GET /api/v1/pagos/{pedido_id}`.

#### Scenario: Feedback post pago
- **WHEN** el callback de `CardPayment` termina o informa un resultado inicial
- **THEN** el frontend consulta el backend por el estado actual
- **THEN** muestra feedback segun `approved`, `rejected`, `pending`, `in_process` o `cancelled`
- **THEN** no confia solo en el callback del SDK para decidir el resultado definitivo

#### Scenario: Pago aprobado
- **WHEN** el backend informa ultimo intento `approved`
- **THEN** el frontend muestra confirmacion de pago exitoso
- **THEN** muestra que el pedido esta confirmado o en actualizacion si el webhook aun no termino

#### Scenario: Pago rechazado o cancelado
- **WHEN** el backend informa ultimo intento `rejected` o `cancelled`
- **THEN** el frontend muestra el `statusDetail` disponible
- **THEN** ofrece reintentar el pago del mismo pedido

#### Scenario: Pago pendiente o en proceso
- **WHEN** el backend informa `pending` o `in_process`
- **THEN** el frontend muestra estado de espera
- **THEN** mantiene polling controlado sin duplicar intentos

---

### Requirement: Frontend no redefine contratos de pago
El frontend SHALL consumir solo campos definidos por los specs backend del change `payment-integration`.

#### Scenario: Contrato no disponible
- **WHEN** el backend no define un campo, endpoint o estado
- **THEN** el frontend no lo inventa
- **THEN** el flujo queda bloqueado hasta coordinar el contrato desde backend
