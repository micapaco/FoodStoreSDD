# Proposal: Payment Integration

## Summary
Implementar la integracion de pagos con MercadoPago usando `CardPayment` embebido para pedidos `PENDIENTE`, registrando intentos de pago idempotentes, procesando webhooks firmados, consultando el estado real en MercadoPago y habilitando feedback de pago en frontend.

## User Stories
- **US-045**: Iniciar proceso de pago.
- **US-046**: Procesar webhook de pago.
- **US-047**: Consultar estado de pago.
- **US-048**: Reintentar pago rechazado.
- **US-072**: Feedback de estado de pago al volver o finalizar el flujo MercadoPago.

## Scope
- **Backend**: Agregar modulo `pagos` con router, service, repository y schemas.
- **Backend**: Exponer `POST /api/v1/pagos/crear` para crear un intento de pago de un pedido propio en `PENDIENTE` con token generado por MercadoPago.js.
- **Backend**: Generar `idempotency_key` UUID por intento y enviarlo a MercadoPago como `X-Idempotency-Key`.
- **Backend**: Persistir cada intento de pago asociado a `pedido_id`, incluyendo identificadores MP, estado, detalle, monto y referencia externa.
- **Backend**: Exponer `POST /api/v1/pagos/webhook` publico, validar firma/origen y responder `200 OK` sin filtrar informacion sensible.
- **Backend**: Al recibir webhook, consultar el estado real del recurso en MercadoPago antes de actualizar `Pago`.
- **Backend**: En `approved`, ejecutar la confirmacion automatica del pedido dentro del UoW, incluyendo descuento atomico de stock y registro de historial.
- **Backend**: Exponer `GET /api/v1/pagos/{pedido_id}` para consultar el ultimo estado y los intentos de pago visibles por propietario o `ADMIN`.
- **Frontend**: Integrar `CardPayment` de MercadoPago en browser sin enviar datos sensibles de tarjeta al servidor Food Store.
- **Frontend**: Usar `paymentStore` para estado transitorio del flujo y TanStack Query para estado del servidor.
- **Frontend**: Mostrar feedback interno post-pago para estados `approved`, `rejected`, `pending`, `in_process` y `cancelled`, con reintento cuando corresponda.

## Out of Scope
- Avance manual de estados posteriores a `CONFIRMADO` (`CONFIRMADO -> EN_PREP -> EN_CAMINO -> ENTREGADO`).
- Cancelacion operativa con restauracion de stock fuera del caso de rechazo/cancelacion de pago.
- Dashboard administrativo de pagos o metricas financieras.
- Refunds, chargebacks y conciliacion contable.
- Soporte productivo multi-cuenta/OAuth de MercadoPago.
- Checkout Pro con preferencia, `init_point`, `back_urls` o redireccion fuera del sitio.

## Acceptance Criteria
- [ ] GIVEN un cliente autenticado con un pedido propio en `PENDIENTE`, WHEN inicia pago desde `CardPayment`, THEN el backend crea un intento con `idempotency_key` unico y llama a MercadoPago sin exponer secretos al frontend.
- [ ] GIVEN un pedido que ya tiene un intento rechazado o cancelado, WHEN el cliente reintenta, THEN se crea un nuevo intento con nueva `idempotency_key` sin borrar el anterior.
- [ ] GIVEN un webhook valido de MercadoPago, WHEN se recibe, THEN el endpoint valida firma/origen, responde `200 OK` y consulta el estado real antes de persistir cambios.
- [ ] GIVEN un pago `approved`, WHEN se procesa, THEN el pedido pasa de `PENDIENTE` a `CONFIRMADO`, se descuenta stock una sola vez y se agrega historial append-only.
- [ ] GIVEN un pago `rejected`, `pending`, `in_process` o `cancelled`, WHEN se procesa, THEN se actualiza `Pago` y el pedido permanece `PENDIENTE`.
- [ ] GIVEN webhooks duplicados o reintentos HTTP, WHEN llegan dos veces, THEN no producen cobros, descuentos de stock ni historiales duplicados.
- [ ] GIVEN un usuario consulta pagos de un pedido ajeno, WHEN no es `ADMIN`, THEN recibe `403 Forbidden`.
- [ ] GIVEN el frontend termina el flujo `CardPayment`, WHEN renderiza feedback, THEN consulta el backend y muestra un estado accionable sin inventar el resultado desde el callback del SDK.

## Preparation Notes
- Se buscaron skills para `mercadopago python sdk`, `mercadopago react sdk` y `fastapi webhooks`.
- No se instalo ninguna skill externa: los resultados relevantes para MercadoPago estaban por debajo del umbral de calidad del proyecto.
- Se usaran `clean-architecture`, `foodstore-backend`, `foodstore-frontend` y `foodstore-domain` como skills rectoras para el apply.
