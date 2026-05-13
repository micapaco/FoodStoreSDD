# Tasks — order-feedback

## 1. Página de confirmación

- [x] 1.1 Crear `frontend/src/pages/OrderConfirmationPage.tsx` con loading y error states
- [x] 1.2 Mostrar número de pedido, estado "PENDIENTE — Esperando pago"
- [x] 1.3 Mostrar resumen de ítems (nombreSnapshot, cantidad, subtotal por ítem)
- [x] 1.4 Mostrar costo de envío y total
- [x] 1.5 Mostrar dirección snapshot o "Retiro en local" si `direccionSnapshot === null`
- [x] 1.6 Botón "Ver detalle del pedido" → `/pedidos/:id`
- [x] 1.7 Botón "Mis pedidos" → `/pedidos`
- [x] 1.8 Renderizar `MercadoPagoCardPayment` si `formaPagoCodigo === 'MERCADOPAGO'`

## 2. Routing

- [x] 2.1 Agregar ruta `/pedidos/:id/confirmacion` en `router.tsx` bajo bloque CLIENT

## 3. CheckoutPage

- [x] 3.1 Eliminar estado `pedidoCreado` y bloque `if (pedidoCreado)` del render
- [x] 3.2 Agregar `useNavigate` y navegar a `/pedidos/:id/confirmacion` post-creación

## 4. Verificación

- [x] 4.1 Crear pedido desde checkout → verificar redirección automática a `/pedidos/:id/confirmacion`
- [x] 4.2 Verificar que muestra ítems, total, dirección correctamente
- [x] 4.3 Verificar botones de acción funcionan
- [x] 4.4 Verificar flujo pickup (dirección null → "Retiro en local")
- [x] 4.5 Build frontend sin errores de TypeScript
