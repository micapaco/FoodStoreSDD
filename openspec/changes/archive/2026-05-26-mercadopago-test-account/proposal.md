## Why

El profesor necesita demostrar el flujo completo de pago con una cuenta MercadoPago real (sandbox). El flujo actual solo soporta pago con tarjeta (CardPayment brick). Para pagar con saldo de cuenta MP se necesita Checkout Pro: el usuario es redirigido al sitio de MercadoPago, inicia sesión con su cuenta comprador y completa el pago desde ahí.

## What Changes

- Se agrega la opción **"MercadoPago"** en el checkout (además de "Tarjetas" y "Efectivo"); se elimina "Transferencia"
- La opción **"Tarjetas"** usa el flujo existente (CardPayment brick); el panel de datos de prueba se muestra cuando `VITE_MERCADOPAGO_PUBLIC_KEY` empieza con `TEST-`
- La opción **"MercadoPago"** usa Checkout Pro:
  1. Frontend llama a `POST /api/v1/pagos/preferencia` con los datos del pedido
  2. Backend crea el pedido (estado PENDIENTE) y una preferencia en MP; retorna `init_point`
  3. Frontend redirige a `init_point`; el usuario paga con su cuenta MP
  4. MP redirige de vuelta a la app; el webhook IPN confirma el pedido
- Panel de prueba para "MercadoPago" en modo test: muestra usuario y contraseña de la cuenta comprador test

## Capabilities

### New Capabilities
- ninguna

### Modified Capabilities
- `pagos-api`: nuevo endpoint `POST /pagos/preferencia` que crea pedido + preferencia MP y retorna `init_point`
- `pagos-frontend`: el checkout reestructura opciones (Tarjetas / MercadoPago / Efectivo), maneja redirect de Checkout Pro y paneles de prueba condicionales

## Impact

**Backend:**
- `backend/app/modules/pagos/mercadopago_client.py` — agregar método `create_preference`
- `backend/app/modules/pagos/schemas.py` — agregar `CrearPreferenciaRequest` y `PreferenciaResponse`
- `backend/app/modules/pagos/service.py` — agregar `crear_preferencia_checkout_pro`
- `backend/app/modules/pagos/router.py` — agregar `POST /pagos/preferencia`
- `backend/app/core/config.py` — agregar `FRONTEND_URL` para construir `back_urls`

**Frontend:**
- `frontend/src/shared/api/pagos.ts` — agregar `crearPreferenciaMercadoPago`
- `frontend/src/shared/hooks/usePagos.ts` — agregar `useCrearPreferenciaMercadoPago`
- `frontend/src/pages/CheckoutPage.tsx` — reestructurar FORMAS_PAGO, flujo de redirect para MP
- `frontend/src/features/pagos/MercadoPagoCheckoutPayment.tsx` — agregar panel test para cuenta
- `frontend/src/pages/OrderConfirmationPage.tsx` — manejar estado `pending` en retorno de MP
- `frontend/.env.example` — documentar `VITE_MERCADOPAGO_PUBLIC_KEY` modo test
