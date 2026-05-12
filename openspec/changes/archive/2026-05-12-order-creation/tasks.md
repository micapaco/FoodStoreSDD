# Tasks: Order Creation

## Backend
- [x] Crear migracion `0008_add_pedido_direccion_snapshot.py`.
- [x] Actualizar modelo `Pedido` con `direccion_snapshot`.
- [x] Crear repositorios de pedidos/detalles/historial y consultas necesarias.
- [x] Registrar repositorios de pedidos en `UnitOfWork`.
- [x] Crear DTOs `CrearPedidoRequest`, `ItemPedidoRequest` y `PedidoRead`.
- [x] Implementar `PedidosService.crear_pedido()`.
- [x] Validar forma de pago existente y direccion propia del cliente.
- [x] Validar productos disponibles con stock suficiente dentro de la transaccion.
- [x] Crear `Pedido`, `DetallePedido` e historial inicial en una sola unidad atomica.
- [x] Registrar endpoint `POST /api/v1/pedidos` protegido para rol `CLIENT`.
- [x] Revisar cobertura de tests backend del flujo exitoso, stock insuficiente y rollback.

## Frontend
- [x] Crear tipos TypeScript para request/response de creacion de pedido.
- [x] Crear `crearPedidoApi()`.
- [x] Crear hook `useCrearPedido()`.
- [x] Integrar submit real en `CheckoutPage`.
- [x] Mostrar estados de carga/error/exito.
- [x] Limpiar carrito local solo cuando la creacion responde `201`.
- [x] Navegar a confirmacion o detalle de pedido usando el `id` devuelto.

## Verification
- [x] Ejecutar compilacion backend.
- [x] Verificar tests backend relevantes.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Verificar manualmente contra API local con usuario `CLIENT`, direccion y productos de seed.

## Notes
- No iniciar pagos en este change.
- No descontar stock en este change; queda para el flujo de pago/FSM.
- Si el detalle `/pedidos/{id}` no esta implementado, la UI debe mostrar confirmacion simple sin inventar un contrato de detalle.
- No se agregaron tests backend porque el repositorio no tiene harness de tests propio todavia; queda deuda tecnica para cuando se incorpore pytest.
- La verificacion manual positiva fue realizada desde la web: se creo un pedido correctamente.
