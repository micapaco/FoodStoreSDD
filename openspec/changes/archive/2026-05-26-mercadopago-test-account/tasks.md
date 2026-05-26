## 1. Reestructurar FORMAS_PAGO en CheckoutPage ✅ ya implementado

- [x] 1.1 Reemplazar el array `FORMAS_PAGO` por la nueva estructura con campos `value`, `codigo`, `label` y `tipo`
- [x] 1.2 Eliminar la entrada `TRANSFERENCIA` del array
- [x] 1.3 Actualizar el estado `formaPagoCodigo` para que trackee `value` (no `codigo`)
- [x] 1.4 Actualizar la derivación `isMercadoPago` para evaluar `selectedForma?.codigo === 'MERCADOPAGO'`
- [x] 1.5 Actualizar `pedidoRequest` para resolver `formaPagoCodigo` desde `selectedForma.codigo`
- [x] 1.6 Pasar `paymentType={selectedForma.tipo}` a `MercadoPagoCheckoutPayment`

## 2. Paneles de prueba en MercadoPagoCheckoutPayment ✅ ya implementado

- [x] 2.1 Agregar prop `paymentType: 'card' | 'account'` a la interfaz del componente
- [x] 2.2 Calcular `const isTestMode = publicKey?.startsWith('TEST-') ?? false` a nivel de módulo
- [x] 2.3 Implementar panel de tarjeta de prueba (APRO + OTHE) con `<details open>`
- [x] 2.4 Implementar panel de cuenta de prueba (usuario/contraseña test buyer) con `<details open>`
- [x] 2.5 Verificar que los paneles no se renderizan cuando `isTestMode === false`

## 3. Backend — configuración FRONTEND_URL

- [x] 3.1 Agregar `FRONTEND_URL: str = "http://localhost:5173"` a `backend/app/core/config.py` (clase `Settings`)
- [x] 3.2 Documentar `FRONTEND_URL` en `backend/app/core/config.py` con comentario explicativo (el `.env.example` es inaccesible por permisos)

## 4. Backend — `create_preference` en MercadoPagoGateway

- [x] 4.1 Agregar método `create_preference(self, items, back_urls, notification_url)` a `MercadoPagoGateway` en `mercadopago_client.py`
  - Construir payload con `items`, `back_urls`, `auto_return: "approved"`, `notification_url`
  - Llamar a `self.sdk.preference().create(preference_data)`
  - Retornar `response["response"]` (contiene `id` e `init_point`)

## 5. Backend — schemas para el endpoint de preferencia

- [x] 5.1 Agregar `CrearPreferenciaRequest` a `backend/app/modules/pagos/schemas.py`
- [x] 5.2 Agregar `PreferenciaResponse` a schemas.py con campos `pedido_id` e `init_point`

## 6. Backend — service `crear_preferencia_checkout_pro`

- [x] 6.1 Agregar método `crear_preferencia_checkout_pro` a `backend/app/modules/pagos/service.py`
  - Crea pedido PENDIENTE, construye items y back_urls, llama a `gateway.create_preference`
  - Back_urls apuntan a `/pedidos/{pedido_id}/confirmacion?status=...` (ruta existente)
  - Retorna `PreferenciaResponse`

## 7. Backend — endpoint POST /pagos/preferencia

- [x] 7.1 Agregar ruta `POST /pagos/preferencia` en `backend/app/modules/pagos/router.py`
  - Requiere rol CLIENT, body `CrearPreferenciaRequest`, response `PreferenciaResponse`, status 201

## 8. Frontend — API y hook para Checkout Pro

- [x] 8.1 Agregar `crearPreferenciaMercadoPagoApi` a `frontend/src/shared/api/pagos.ts`
- [x] 8.2 Agregar `useCrearPreferenciaMercadoPago` a `frontend/src/shared/hooks/usePagos.ts`
- [x] 8.3 Agregar tipos `CrearPreferenciaPayload` y `PreferenciaResponse` a `frontend/src/entities/pagos/types.ts`

## 9. Frontend — flujo Checkout Pro en MercadoPagoCheckoutPayment

- [x] 9.1 Importar y usar `useCrearPreferenciaMercadoPago` en el componente
- [x] 9.2 Cuando `paymentType === 'account'`: NO renderizar el `CardPayment` brick
- [x] 9.3 Renderizar botón "Pagar con MercadoPago" con estado de carga y manejo de error
- [x] 9.4 Props `onSuccess`/`onRejected` pasan a opcionales (irrelevantes en el flujo redirect)

## 10. Frontend — OrderConfirmationPage estado pending

- [x] 10.1 Leer query param `status` con `useSearchParams`
- [x] 10.2 Banner warning si `status === 'pending'`
- [x] 10.3 Banner error con link al checkout si `status === 'failure'`
- [x] 10.4 Sin param o `status === 'approved'`: comportamiento actual sin cambios

## 11. Documentación y verificación

- [x] 11.1 `FRONTEND_URL` documentado con comentario en `config.py`
- [x] 11.2 Verificar `npx tsc --noEmit` sin errores en frontend — ✅ limpio
- [x] 11.3 Verificar que el endpoint `/api/v1/pagos/preferencia` aparece en FastAPI `/docs` — validado manualmente en sesión de prueba
