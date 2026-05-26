## Context

`CheckoutPage.tsx` tiene tres opciones de pago: `Tarjetas` (CardPayment brick), `MercadoPago` (cuenta real) y `Efectivo`. La estructura `FORMAS_PAGO` con `value/codigo/tipo` ya está implementada. El componente `MercadoPagoCheckoutPayment` ya recibe `paymentType: 'card' | 'account'` y muestra paneles de prueba condicionales.

Lo que falta: la opción `MercadoPago` actualmente sigue mostrando el CardPayment brick. El objetivo es implementar Checkout Pro real: redirigir al usuario al sitio de MercadoPago donde puede pagar con saldo de cuenta, QR, o cualquier otro método disponible.

## Goals / Non-Goals

**Goals:**
- Implementar Checkout Pro: preferencia → redirect → back_url → webhook confirma
- Opción "Tarjetas" mantiene el flujo existente (CardPayment brick)
- Opción "MercadoPago" redirige a MP; no muestra CardPayment brick
- Panel de credenciales de cuenta test cuando `publicKey.startsWith('TEST-')`
- Backend crea el pedido (PENDIENTE) y la preferencia en una sola operación

**Non-Goals:**
- Cambiar el flujo de "Tarjetas" o el webhook IPN existente
- Guardar el `payment_id` antes del webhook (el pago llega vía IPN)
- Implementar reconciliación manual de pagos abandonados

## Decisions

### D-1: Flujo Checkout Pro end-to-end

```
Usuario confirma pago (opción MercadoPago)
  └→ Frontend: POST /api/v1/pagos/preferencia { pedido_data }
       └→ Backend:
           1. Crea pedido en estado PENDIENTE
           2. Crea preferencia en MP con items + back_urls
           3. Retorna { pedido_id, init_point }
  └→ Frontend: window.location.href = init_point
       └→ Usuario paga en sitio MP con su cuenta
  └→ MP redirige a back_url: /order-confirmation?pedido_id=X&status=approved
  └→ MP envía webhook IPN → POST /api/v1/pagos/webhook (existente)
       └→ Backend actualiza estado del pedido
```

El pedido se crea ANTES del redirect para tener el `pedido_id` disponible en las `back_urls`. Si el usuario abandona el flujo, el pedido queda en PENDIENTE y se puede limpiar asíncronamente (fuera del alcance de este change).

### D-2: Endpoint unificado POST /pagos/preferencia

**Decisión**: Agregar un endpoint específico para Checkout Pro, separado de `/pagos/checkout` (que maneja CardPayment). No se reutiliza el endpoint existente porque:
- El payload es diferente (sin datos de tarjeta)
- La respuesta es diferente (`init_point` en lugar de estado de pago inmediato)
- La lógica de servicio es diferente

**Request**:
```json
{
  "pedido": {
    "sucursal_id": 1,
    "forma_pago_codigo": "MERCADOPAGO",
    "tipo_entrega": "delivery",
    "direccion_id": 5,
    "items": [{ "producto_id": 1, "cantidad": 2, "precio_unitario": 500 }]
  }
}
```

**Response**:
```json
{
  "pedido_id": 42,
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
}
```

### D-3: FRONTEND_URL en configuración backend

**Decisión**: Agregar `FRONTEND_URL: str = "http://localhost:5173"` a `backend/app/core/config.py`. Se usa exclusivamente para construir las `back_urls` de la preferencia:

```
success → {FRONTEND_URL}/order-confirmation?pedido_id={id}&status=approved
failure → {FRONTEND_URL}/order-confirmation?pedido_id={id}&status=failure
pending → {FRONTEND_URL}/order-confirmation?pedido_id={id}&status=pending
```

La variable también se documenta en `backend/.env.example`.

**Alternativa descartada**: hardcodear localhost — impide deployment a staging/producción sin cambiar código.

### D-4: `create_preference` en MercadoPagoGateway

**Decisión**: Agregar método `create_preference` a la clase `MercadoPagoGateway` en `mercadopago_client.py`:

```python
def create_preference(self, items: list[dict], back_urls: dict, notification_url: str) -> dict:
    preference_data = {
        "items": items,
        "back_urls": back_urls,
        "auto_return": "approved",
        "notification_url": notification_url,
    }
    response = self.sdk.preference().create(preference_data)
    return response["response"]
```

Los items se construyen en el service a partir de los detalles del pedido (nombre del producto, precio unitario, cantidad).

### D-5: Flujo frontend — opción MercadoPago

**Decisión**: `MercadoPagoCheckoutPayment` maneja ambas ramas internamente:
- `paymentType === 'card'`: renderiza CardPayment brick (flujo existente sin cambios)
- `paymentType === 'account'`: NO renderiza CardPayment brick; muestra:
  - Panel de credenciales de test (si `isTestMode`)
  - Botón "Pagar con MercadoPago" que invoca `useCrearPreferenciaMercadoPago`
  - Al éxito: `window.location.href = data.init_point`

**Alternativa descartada**: mover la lógica del botón a CheckoutPage — requiere cambiar las props del componente y la estructura de renderizado condicional en la página.

### D-6: OrderConfirmationPage — estado pending

**Decisión**: La página ya lee `pedido_id` de los query params. Se agrega lectura del param `status` para manejar el retorno de MP:
- `status=approved`: flujo normal (ya existente, pedido confirmado)
- `status=pending`: mostrar "Tu pago está siendo procesado. Te notificaremos cuando se confirme."
- `status=failure`: mostrar error con opción de reintentar

### D-7: Reutilización del webhook IPN existente

**Decisión**: El endpoint `POST /api/v1/pagos/webhook` existente NO requiere cambios. MP llama al mismo webhook para pagos de Checkout Pro y de CardPayment. El handler ya extrae el `payment_id` del payload y actualiza el estado del pedido. Sin modificaciones necesarias.

## Risks / Trade-offs

- [Riesgo] El pedido puede quedar en PENDIENTE si el usuario abandona MP sin pagar. → Aceptado: fuera del alcance de este change. Puede limpiarse con un job asíncrono en el futuro.
- [Trade-off] `auto_return: "approved"` en la preferencia hace que MP solo redirija automáticamente si el pago es aprobado. Para failure/pending el usuario debe hacer clic en "Volver". → Aceptado: comportamiento estándar de MP.
- [Riesgo] `FRONTEND_URL` mal configurado rompe las back_urls en producción. → Mitigación: documentar en `.env.example` y en el README de deploy.

## Migration Plan

1. Backend primero: agregar `FRONTEND_URL`, `create_preference` en gateway, schemas, service, endpoint
2. Frontend segundo: api/pagos.ts → usePagos.ts → MercadoPagoCheckoutPayment → OrderConfirmationPage
3. Sin migraciones de BD (el pedido ya existe en estado PENDIENTE, tabla sin cambios)
4. Rollback: revertir el endpoint y el componente; el resto del checkout sigue funcionando
