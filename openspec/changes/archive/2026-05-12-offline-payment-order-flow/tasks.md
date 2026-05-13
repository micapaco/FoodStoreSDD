## 1. Contract And Documentation

- [x] 1.1 Validar la propuesta `offline-payment-order-flow` y resolver observaciones de OpenSpec.
- [x] 1.2 Confirmar nombre final del endpoint dedicado de confirmacion offline.
- [x] 1.3 Actualizar documentacion de dominio y roadmap si la aprobacion del change requiere precisiones adicionales.

## 2. Backend Offline Payment Flow

- [x] 2.1 Definir schema request/response para confirmacion de pago offline.
- [x] 2.2 Implementar servicio transaccional que valide rol, estado `PENDIENTE` y forma de pago offline.
- [x] 2.3 Reutilizar de forma segura la logica de confirmacion `PENDIENTE -> CONFIRMADO`, descuento de stock e historial append-only.
- [x] 2.4 Exponer endpoint dedicado en `pedidos` y mantener bloqueada la confirmacion manual generica por FSM.
- [x] 2.5 Agregar tests backend de autorizacion, metodos admitidos, idempotencia por estado y efectos sobre stock/historial.

## 3. Frontend Operational UX

- [x] 3.1 Extender tipos, API client y hooks TanStack Query para la mutacion offline.
- [x] 3.2 Agregar accion de confirmacion offline en `/admin/pedidos` solo para pedidos elegibles.
- [x] 3.3 Mostrar feedback de exito/error y refrescar listado/detalle luego de la mutacion.
- [x] 3.4 Ajustar mensajes visibles de estado para diferenciar MercadoPago pendiente de pago offline pendiente de validacion.

## 4. Verification

- [x] 4.1 Ejecutar tests backend y build frontend.
- [x] 4.2 Validar OpenSpec del change en modo estricto.
- [x] 4.3 Verificar manualmente los flujos `EFECTIVO`, `TRANSFERENCIA` y `MERCADOPAGO` en el panel operativo.
