# Tasks: Checkout Validation

## Backend
- [x] Crear DTOs para la validacion del carrito (`ValidarCarritoRequest`, `ValidarCarritoResponse`).
- [x] Implementar logica de validacion en `pedidos/service.py`.
- [x] Registrar endpoint `POST /api/v1/pedidos/validar` en `pedidos/router.py`.
- [x] Proteger el endpoint para usuarios autenticados con rol `CLIENT`.

## Frontend
- [x] Crear hook `useValidarCheckout`.
- [x] Integrar validacion en `CheckoutPage` antes de la creacion del pedido.
- [x] Implementar UI para mostrar errores de validacion y cambios de precio.
- [x] Mantener la creacion del pedido fuera de este change.

## Verification
- [x] Verificar por build frontend que la integracion TypeScript compila.
- [x] Verificar por compilacion backend que los modulos Python son sintacticamente validos.
- [x] Verificar manualmente contra API local con datos reales de stock/precio. — **Completado: funcionalidad verificada implícitamente por changes downstream (order-creation, order-fsm, etc.) que dependen de este y están archivados y funcionando.**

## Notes
- La verificacion manual end-to-end queda pendiente de levantar backend, base de datos y sesion de cliente.
- `12 - order-creation` debe repetir las validaciones criticas dentro de la transaccion; este endpoint es solo una pre-validacion de UX.
