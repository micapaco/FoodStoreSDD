## Verification Report: mercadopago-test-account

**Date**: 2026-05-26
**Tasks**: 27/28 complete (11.3 validada manualmente en sesión de prueba)

### Test Results

`npx tsc --noEmit` — ✅ Sin errores TypeScript

No hay suite de tests automatizados para este change. Flujo validado manualmente:
- Pedido creado como PENDIENTE ✅
- Redirect a MercadoPago Sandbox ✅
- Pago con cuenta comprador test (dinero disponible) ✅
- Webhook IPN recibido vía ngrok ✅
- Pedido actualizado a CONFIRMADO automáticamente ✅

### Spec Compliance

| Requisito (proposal.md) | Status | Notas |
|-------------------------|--------|-------|
| Opción "Tarjetas" usa CardPayment brick existente | PASS | Sin cambios al flujo de tarjeta |
| Opción "MercadoPago" usa Checkout Pro (redirect) | PASS | `window.location.href = init_point` |
| Panel test para "Tarjetas" (datos de tarjeta) | PASS | `isTestMode && paymentType === 'card'` |
| Panel test para "MercadoPago" (usuario/contraseña) | PASS | `isTestMode && paymentType === 'account'` |
| "Transferencia" eliminada del selector | PASS | No existe en FORMAS_PAGO |
| Backend: `POST /pagos/preferencia` | PASS | Status 201, rol CLIENT requerido |
| Backend: crea pedido PENDIENTE + preferencia MP | PASS | Operación en un solo UoW |
| Backend: retorna `init_point` | PASS | `PreferenciaResponse.initPoint` |
| Webhook IPN confirma pedido | PASS | Pedido #69 pasó a CONFIRMADO vía webhook |
| `back_urls` apuntan a ruta existente | PASS | `/pedidos/{id}/confirmacion?status=...` |
| `FRONTEND_URL` configurable | PASS | Default `http://localhost:5173`, HTTPS activa `auto_return` |

### Design Coherence

- **D-1 (flujo Checkout Pro)**: FOLLOWED — preferencia → redirect → webhook confirma
- **D-2 (endpoint POST /pagos/preferencia)**: FOLLOWED — separado de `/checkout`, payload y response correctos
- **D-3 (FRONTEND_URL en config)**: FOLLOWED — campo `Settings`, condicional `auto_return` implementado
- **D-4 (create_preference en gateway)**: FOLLOWED — método aislado con `external_reference` agregado post-fix
- **D-5 (flujo frontend)**: FOLLOWED — `paymentType === 'account'` muestra botón, no brick
- **D-6 (OrderConfirmationPage pending/failure)**: FOLLOWED — banners condicionales por `?status`
- **D-7 (webhook reutilizado)**: FOLLOWED — `POST /pagos/webhook` sin cambios

**Desviación documentada**: `external_reference` fue agregado al gateway durante la implementación (no estaba en el diseño original) para permitir que el webhook IPN encuentre el Pago pre-creado. Correcta: el diseño original no contemplaba la pre-creación del Pago, que resultó ser necesaria para el flujo de webhook.

### Summary

- CRITICAL: ninguno
- WARNING: El `MERCADOPAGO_WEBHOOK_SECRET` y el `MERCADOPAGO_ACCESS_TOKEN` deben ser del **usuario vendedor test** para sandbox (no las credenciales del desarrollador real). Documentado en la sesión de prueba.
- SUGGESTION: Agregar `external_reference` al `design.md` como decisión explícita (D-8) para documentar por qué se pre-crea el Pago.

**Verdict**: READY FOR ARCHIVE ✅
