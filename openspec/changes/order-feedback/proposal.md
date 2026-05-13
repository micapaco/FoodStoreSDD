# Proposal — order-feedback

## Qué

Pantalla de confirmación de pedido creado (US-071). Cuando un cliente completa el checkout exitosamente, el sistema lo redirige a una URL propia (`/pedidos/:id/confirmacion`) donde ve el resumen completo del pedido antes de pagar.

## Por qué

El checkout actual muestra una confirmación mínima inline dentro del mismo `CheckoutPage` — solo id, estado, envío y total. No cumple con US-071: falta resumen de ítems, dirección, botón para ver el detalle y redirección automática a una URL propia.

## Alcance

Frontend únicamente. No requiere cambios en el backend — el endpoint `GET /pedidos/:id` ya devuelve `PedidoDetailRead` con items, direccionSnapshot y formaPagoCodigo.

## Historias cubiertas

- US-071: Confirmación de pedido creado

## Dependencias satisfechas

- `order-creation` ✅ archivado
- `offline-payment-order-flow` ✅ archivado
- `pickup-fulfillment-flow` ✅ archivado
