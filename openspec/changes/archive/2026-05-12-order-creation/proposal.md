# Proposal: Order Creation

## Summary
Implementar la creación atomica de pedidos desde el carrito para usuarios `CLIENT`, preservando snapshots de precios y direccion, registrando el estado inicial `PENDIENTE` y preparando el flujo para pagos posteriores.

## User Stories
- **US-035**: Crear pedido desde el carrito.
- **US-036**: Validar stock suficiente dentro de la transaccion.
- **US-037**: Preservar snapshot de precio por item.
- **US-038**: Preservar snapshot de direccion de entrega.

## Scope
- **Backend**: Agregar `POST /api/v1/pedidos` protegido para `CLIENT`.
- **Backend**: Crear repositorios y servicio de pedidos con Unit of Work atomico.
- **Backend**: Validar producto, stock, forma de pago y ownership de direccion.
- **Backend**: Crear `Pedido`, `DetallePedido` e historial inicial en una sola transaccion.
- **Backend**: Agregar persistencia para `direccion_snapshot` en `pedido` porque RN-PE03/RN-DA06 lo requieren y el modelo actual no lo posee.
- **Backend**: Persistir `notas` opcionales del request en `pedido`.
- **Frontend**: Consumir el contrato acordado desde `CheckoutPage`, mostrar errores de creacion, limpiar carrito y navegar al pedido creado al finalizar.

## Out of Scope
- Integracion con MercadoPago.
- Descuento de stock por pago confirmado.
- Avance manual de estados del pedido.
- Listado y detalle completos de pedidos, salvo lo minimo necesario para redirigir o mostrar confirmacion.
- Panel administrativo de pedidos.

## Acceptance Criteria
- [x] GIVEN un cliente autenticado con carrito valido, WHEN envia `POST /api/v1/pedidos`, THEN se crea un pedido `PENDIENTE` con detalles e historial inicial.
- [x] GIVEN un item sin stock suficiente, WHEN se intenta crear el pedido, THEN la transaccion completa se revierte y no queda ningun registro parcial.
- [x] GIVEN productos con precios actuales, WHEN se crea el pedido, THEN cada detalle conserva `nombre_snapshot` y `precio_snapshot`.
- [x] GIVEN una direccion de entrega, WHEN se crea el pedido, THEN se guarda `direccion_snapshot` independiente de cambios futuros en la direccion original.
- [x] GIVEN direccion ajena o inexistente, WHEN un cliente intenta usarla, THEN el backend responde error de autorizacion/validacion sin crear pedido.
- [x] GIVEN creacion exitosa desde frontend, WHEN el backend devuelve `201`, THEN el carrito local se limpia y el usuario recibe confirmacion/navegacion al pedido.
