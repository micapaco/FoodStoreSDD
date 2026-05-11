# Proposal: Checkout Validation

## Summary
Implementar validaciones de stock y precios en el flujo de checkout, asegurando que el carrito del cliente sea consistente con el estado actual del backend justo antes de la creacion del pedido.

## User Stories
- **US-069**: Validar disponibilidad al hacer checkout.
- **US-070**: Verificar precios actualizados al hacer checkout.

## Scope
- **Backend**: Agregar `POST /api/v1/pedidos/validar` para verificar stock vigente, disponibilidad y precios vigentes.
- **Frontend**: Antes de proceder a la creacion de pedido, realizar una llamada de validacion del carrito. Si hay discrepancias, notificar al usuario (precio cambiado, stock insuficiente, producto eliminado/desactivado).

## Out of Scope
- Crear el pedido.
- Descontar stock.
- Iniciar pagos.
- Registrar historial de estado.

## Acceptance Criteria
- [x] GIVEN items en el carrito, WHEN el cliente inicia el checkout, THEN se verifica stock y precio vigentes.
- [x] GIVEN stock insuficiente o cambio de precio, WHEN detectado, THEN el sistema informa al usuario para que corrija su pedido.
- [x] La validacion previene avanzar con un carrito inconsistente antes de la creacion del pedido.
