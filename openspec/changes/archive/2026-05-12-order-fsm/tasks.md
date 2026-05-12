# Tasks: Order FSM

## Preparation
- [x] Verificar estado del change `order-fsm`.
- [x] Leer `docs/` y reglas backend.
- [x] Verificar que `order-creation` y `payment-integration` estan archivados.
- [x] Buscar skills para FastAPI, SQLModel/PostgreSQL, Alembic, pytest y FSM/service layer.
- [x] Decidir no instalar skills externas nuevas por ya existir cobertura local o baja confianza de resultados.
- [x] Crear artefactos iniciales de propuesta.

## OpenSpec
- [x] Validar propuesta con `npx openspec validate order-fsm --strict`.
- [x] Ajustar specs si OpenSpec reporta inconsistencias.

## Backend
- [x] Revisar el seed y constantes de estados contra `EN_PREP`.
- [x] Agregar migracion Alembic para `historial_estado_pedido.motivo`.
- [x] Agregar schemas `AvanzarEstadoRequest`, `CancelarPedidoRequest` e `HistorialEstadoRead`.
- [x] Implementar mapa FSM y helpers de validacion en `PedidosService`.
- [x] Implementar `PedidosService.confirmar_por_pago()` idempotente.
- [x] Refactorizar `PagosService` para delegar confirmacion en `PedidosService`.
- [x] Implementar `PedidosService.avanzar_estado()` para roles `ADMIN`/`PEDIDOS`.
- [x] Implementar `PedidosService.cancelar_pedido()` para cliente propietario y roles operativos.
- [x] Restaurar stock atomicamente en cancelaciones desde estados con stock descontado.
- [x] Asegurar que cancelacion requiere motivo no vacio.
- [x] Asegurar que estados terminales rechazan toda transicion.
- [x] Agregar query de historial cronologico en `PedidoRepository`.
- [x] Agregar endpoint `PATCH /api/v1/pedidos/{pedido_id}/estado`.
- [x] Agregar endpoint de cancelacion propia de pedido.
- [x] Agregar endpoint `GET /api/v1/pedidos/{pedido_id}/historial`.
- [x] Mantener routers thin, sin logica de negocio.

## Tests / Verification
- [x] Agregar tests de FSM para transiciones validas.
- [x] Agregar tests de transiciones invalidas, saltos, retrocesos y terminales.
- [x] Agregar tests de cancelacion con motivo obligatorio.
- [x] Agregar tests de descuento/restauracion de stock e idempotencia.
- [x] Agregar tests de ownership/RBAC para cancelacion e historial.
- [x] Ejecutar compilacion backend.
- [x] Verificar importacion del backend.
- [x] Ejecutar tests backend disponibles con `python -m unittest discover -s tests`.

## Notes
- No implementar UI de gestion de pedidos en este change.
- No modificar el contrato publico de pagos salvo refactor interno de servicio.
- No agregar UPDATE/DELETE sobre `HistorialEstadoPedido`.
