# Tasks: Payment Integration

## Preparation
- [x] Verificar estado del change `payment-integration`.
- [x] Leer `docs/` y reglas backend/frontend.
- [x] Buscar skills para MercadoPago/FastAPI webhooks.
- [x] Decidir no instalar skills externas por baja relevancia/calidad.
- [x] Crear artefactos iniciales de propuesta.

## Backend
- [x] Revisar el modelo `Pago` contra RN-PA08 y US-047.
- [x] Agregar migracion para campos faltantes de intentos de pago.
- [x] Agregar `mercadopago` a `backend/requirements.txt`.
- [x] Agregar settings `MERCADOPAGO_WEBHOOK_SECRET` y `MERCADOPAGO_NOTIFICATION_URL`.
- [x] Actualizar `.env.example` con variables MercadoPago necesarias.
- [x] Crear modulo `backend/app/modules/pagos/`.
- [x] Implementar gateway MercadoPago Payments API con `cardToken`, idempotency key y validacion de firma.
- [x] Implementar `PagoRepository`.
- [x] Registrar `pagos` en `UnitOfWork`.
- [x] Crear schemas `CrearPagoRequest`, `PagoRead`, `PagoStatusResponse` y `WebhookResponse`.
- [x] Implementar `PagosService.crear_pago()`.
- [x] Implementar `PagosService.obtener_estado_por_pedido()`.
- [x] Implementar `PagosService.procesar_webhook()`.
- [x] Implementar confirmacion automatica `PENDIENTE -> CONFIRMADO` por pago aprobado.
- [x] Descontar stock de forma atomica e idempotente al confirmar.
- [x] Registrar historial append-only de confirmacion automatica.
- [x] Registrar router `/api/v1/pagos`.
- [x] Registrar limitacion de tests backend: el repo aun no tiene harness automatizado para este change.

## Frontend
- [x] Verificar inicializacion de `@mercadopago/sdk-react` con `VITE_MERCADOPAGO_PUBLIC_KEY`.
- [x] Crear tipos TypeScript para pagos.
- [x] Crear API client para pagos.
- [x] Crear hooks TanStack Query para crear pago y consultar estado.
- [x] Extender `paymentStore` sin persistencia.
- [x] Integrar inicio de pago desde confirmacion/checkout para `MERCADOPAGO`.
- [x] Mostrar estados `processing`, `approved`, `rejected`, `pending`, `in_process`, `cancelled`.
- [x] Permitir reintento cuando el ultimo intento este `rejected` o `cancelled`.
- [x] Agregar feedback interno post-pago despues del callback de `CardPayment`.
- [x] Evitar que el frontend infiera contratos no definidos por backend.

## Verification
- [x] Ejecutar compilacion backend.
- [x] Ejecutar tests backend relevantes. N/A: no existe harness de tests backend en el repo.
- [x] Ejecutar `npm run build`.
- [x] Verificar manualmente flujo sandbox MercadoPago con credenciales TEST y CardPayment embebido.
- [x] Validar webhook real recibido via ngrok con `POST /api/v1/pagos/webhook` y respuesta `200 OK`.
- [x] Validar confirmacion idempotente: pago `approved` confirma `PENDIENTE -> CONFIRMADO` y el webhook posterior no duplica descuento ni historial.

## Notes
- No instalar skills externas para este change salvo que aparezca una fuente confiable antes del apply.
- No implementar refunds, chargebacks ni metricas financieras.
- Este change usa `CardPayment` embebido. Checkout Pro con preferencia/redirect queda fuera de alcance.
