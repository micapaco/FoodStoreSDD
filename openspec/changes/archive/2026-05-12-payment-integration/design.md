# Design: Payment Integration

## Architectural Approach
Este change es cross-domain, pero el contrato API lo define backend. El backend conserva la direccion `Router -> Service -> UnitOfWork -> Repository -> Model`; MercadoPago queda detras de un gateway/cliente de infraestructura consumido por el service para no filtrar detalles externos hacia routers ni frontend.

La decision de integracion para este change es **Opcion A: CardPayment embebido**. El frontend renderiza `CardPayment`, MercadoPago.js tokeniza los datos sensibles en el browser, y Food Store envia al backend solo el token y metadatos no sensibles necesarios para crear/procesar el pago. No se implementa Checkout Pro con preferencia, `init_point`, `back_urls` ni redireccion fuera del sitio.

El frontend consume solo contratos acordados y mantiene separados el estado transitorio del pago (`paymentStore`) del estado del servidor (TanStack Query). Los datos sensibles de tarjeta nunca llegan al servidor Food Store.

## External Integration Baseline
La documentacion oficial vigente de MercadoPago para pagos online exige `Authorization: Bearer <access_token>` y permite `X-Idempotency-Key` al crear/procesar pagos. Para webhooks, MercadoPago documenta validacion con `x-signature`, `x-request-id` y consulta posterior del recurso notificado; el receptor debe responder `200 OK` o `201 Created` para confirmar recepcion.

El proyecto nombra IPN y webhooks historicamente. Para este change se implementa el endpoint como `webhook` y se evita depender solo del payload entrante: siempre se consulta MercadoPago antes de decidir el estado local.

## API Contract

### `POST /api/v1/pagos/crear`
Protegido para `CLIENT`.

**Request Body:**
```json
{
  "pedidoId": 123,
  "cardToken": "mp_card_token",
  "paymentMethodId": "visa",
  "issuerId": "25",
  "installments": 1,
  "payerEmail": "cliente@example.com",
  "payerIdentificationType": "DNI",
  "payerIdentificationNumber": "12345678"
}
```

`cardToken` lo genera MercadoPago.js en el browser mediante `CardPayment`. `payerIdentificationType` y `payerIdentificationNumber` son datos no sensibles que el Brick devuelve para completar el objeto `payer.identification` exigido por el flujo de pagos con tarjeta. El backend nunca recibe numero de tarjeta, CVV ni fecha de vencimiento.

**Response Body (201 Created):**
```json
{
  "id": 55,
  "pedidoId": 123,
  "mpOrderId": null,
  "mpPaymentId": 987654321,
  "mpStatus": "pending",
  "statusDetail": "pending_waiting_payment",
  "externalReference": "pedido-123-intento-550e8400",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
  "monto": "2450.00",
  "createdAt": "2026-05-12T03:30:00Z",
  "updatedAt": "2026-05-12T03:30:00Z"
}
```

### `POST /api/v1/pagos/webhook`
Publico. Valida firma con `MERCADOPAGO_WEBHOOK_SECRET`.

**Accepted Payload Shape:**
```json
{
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "987654321"
  }
}
```

Tambien debe tolerar parametros de query usados por MercadoPago para firma, por ejemplo `data.id`, porque la firma oficial puede incluir valores de la URL.

**Response Body (200 OK):**
```json
{ "status": "ok" }
```

### `GET /api/v1/pagos/{pedido_id}`
Protegido para propietario del pedido o `ADMIN`.

**Response Body (200 OK):**
```json
{
  "pedidoId": 123,
  "estadoPedido": "PENDIENTE",
  "intentos": [
    {
      "id": 55,
      "mpPaymentId": 987654321,
      "mpStatus": "rejected",
      "statusDetail": "cc_rejected_insufficient_amount",
      "monto": "2450.00",
      "createdAt": "2026-05-12T03:30:00Z",
      "updatedAt": "2026-05-12T03:32:00Z"
    }
  ],
  "ultimoIntento": {
    "id": 55,
    "mpStatus": "rejected",
    "statusDetail": "cc_rejected_insufficient_amount"
  }
}
```

## Backend Details

### Module
Crear `backend/app/modules/pagos/` con:
- `repository.py`: consultas por `pedido_id`, `mp_payment_id`, `external_reference` e intentos ordenados.
- `schemas.py`: `CrearPagoRequest`, `PagoRead`, `PagoStatusResponse`, `WebhookResponse`.
- `service.py`: crear intento, verificar ownership, procesar webhook, consultar estado real, confirmar pedido.
- `router.py`: endpoints HTTP thin.
- `mercadopago_client.py` o gateway equivalente: llamadas a MercadoPago y validacion de firma.

### Persistence
El modelo `Pago` ya existe, pero el change debe verificar si alcanza para los criterios. Probablemente requiere migracion para:
- `monto NUMERIC(10,2) NOT NULL`.
- `status_detail VARCHAR(100) NULL`.
- `mp_order_id VARCHAR(100) NULL` si MercadoPago devuelve una orden asociada al pago.
- `raw_payload JSONB NULL` para auditoria limitada del ultimo estado no sensible.

`external_reference` debe ser unico por intento, no solo por pedido, para respetar RN-PA08. Formato sugerido: `pedido-{pedido_id}-intento-{uuid_corto}`.

### Payment Creation Flow
1. Router valida `CrearPagoRequest`, obtiene usuario actual y abre `async with UnitOfWork()`.
2. Service carga pedido, valida ownership, `estado_codigo=PENDIENTE`, `deleted_at IS NULL` y `forma_pago_codigo=MERCADOPAGO`.
3. Service rechaza crear nuevo intento si ya existe un pago `approved` o un intento pendiente no resuelto para el mismo pedido.
4. Service genera `idempotency_key` UUID y `external_reference` unico.
5. Gateway llama MercadoPago Payments API mediante el SDK oficial con `cardToken`, datos no sensibles del pago, `payer.identification`, monto del pedido y `X-Idempotency-Key`.
6. Service persiste `Pago` con monto, estado MP, ids externos y timestamps dentro del UoW.
7. Si la respuesta autenticada de MercadoPago ya devuelve `approved`, el service confirma el pedido en la misma transaccion de forma idempotente.
8. Router responde `201 Created` con `PagoRead`.

### Webhook Flow
1. Router recibe headers, query params y body; valida firma/origen antes de delegar.
2. Router responde `200 OK` cuando el formato basico y firma son aceptables.
3. Service consulta MercadoPago por `data.id`, `payment_id` u `order_id`; no confia en `status` del payload entrante.
4. Service localiza `Pago` por `mp_payment_id`, `mp_order_id` o `external_reference`.
5. Service actualiza `mp_status`, `status_detail`, `raw_payload` y `updated_at`.
6. Si el estado real es `approved`, el service confirma el pedido dentro del mismo UoW:
   - valida que el pedido siga en `PENDIENTE`;
   - decrementa stock de cada producto del pedido una sola vez;
   - cambia `pedido.estado_codigo` a `CONFIRMADO`;
   - inserta `HistorialEstadoPedido` `PENDIENTE -> CONFIRMADO`.
7. Si el webhook es duplicado o el pedido ya estaba `CONFIRMADO`, no se repite el descuento ni el historial.

### Error Semantics
- `400 Bad Request`: payload webhook malformado o firma invalida cuando corresponde cortar temprano.
- `401 Unauthorized`: crear/consultar pago sin autenticacion.
- `403 Forbidden`: pedido ajeno o rol no permitido.
- `404 Not Found`: pedido o pago inexistente.
- `409 Conflict`: pedido no esta en `PENDIENTE`, ya tiene pago aprobado o intento pendiente bloqueante.
- `422 Unprocessable Entity`: datos de pago incompletos o forma de pago no compatible.
- `502 Bad Gateway`: MercadoPago no responde o responde error no recuperable al crear/consultar.

## Frontend Details
1. Agregar provider/configuracion MercadoPago con `VITE_MERCADOPAGO_PUBLIC_KEY`.
2. Agregar tipos `CrearPagoRequest`, `PagoRead`, `PagoStatusResponse`.
3. Agregar API client para `POST /pagos/crear` y `GET /pagos/{pedidoId}`.
4. Agregar hooks `useCrearPago()` y `usePagoStatus()` con query keys descriptivas.
5. Extender `paymentStore` con `paymentId`, `statusDetail`, `error` y acciones transitorias; no persistirlo.
6. Al crear pedido con `formaPagoCodigo=MERCADOPAGO`, iniciar pago sin limpiar informacion necesaria del flujo.
7. Renderizar MercadoPago `CardPayment`; nunca enviar PAN/CVV/fecha de vencimiento al backend.
8. Agregar feedback interno de estado con reintento para `rejected` y espera para `pending`/`in_process`.
9. Consultar backend despues del callback del SDK antes de mostrar resultado definitivo.

## Verification Strategy
- Backend: compilar Python y agregar tests de service para ownership, reintento, webhook duplicate, approved idempotente y stock.
- Backend: test de firma webhook con `x-signature`/`x-request-id` usando fixture local.
- Backend: test de gateway con cliente MercadoPago falso; no golpear sandbox en tests unitarios.
- Frontend: `npm run build` y tests/manual de estados de UI si existe harness.
- Manual sandbox: crear pedido `PENDIENTE`, iniciar pago, simular/reproducir `approved`, `rejected` y `pending`, verificar tabla `pago`, stock e historial.

## Risks
- `CardPayment` depende del comportamiento del SDK de MercadoPago en sandbox; el apply debe aislarlo para que la UI siga testeable con mocks.
- MercadoPago requiere endpoints publicos para webhooks reales; en local se necesitara tunnel o simulador.
- Confirmar pedido en este change pisa parte del terreno del change `14 - order-fsm`, pero US-046/RN-PA05 exigen que `approved` ya cambie `PENDIENTE -> CONFIRMADO`.
