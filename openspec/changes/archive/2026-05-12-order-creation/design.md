# Design: Order Creation

## Architectural Approach
Este change es cross-domain pero el contrato lo define backend. El flujo mantiene la arquitectura del proyecto: `Router -> Service -> UnitOfWork -> Repository -> Model`. El router solo valida request, abre el UoW y delega; el servicio concentra reglas de negocio; los repositorios encapsulan consultas y bloqueos transaccionales.

La creacion debe repetir las validaciones criticas aunque exista `POST /api/v1/pedidos/validar`, porque la prevalidacion del checkout es solo una ayuda de UX y no protege contra cambios concurrentes.

## API Contract

### `POST /api/v1/pedidos`
Protegido para usuarios autenticados con rol `CLIENT`.

**Request Body:**
```json
{
  "items": [
    {
      "productoId": 1,
      "cantidad": 2,
      "personalizacion": [3, 4]
    }
  ],
  "formaPagoCodigo": "MERCADOPAGO",
  "direccionId": 10,
  "notas": "Tocar timbre"
}
```

`direccionId` puede ser `null` para retiro en local. Si se informa, la direccion debe existir, estar activa y pertenecer al usuario autenticado.

**Response Body (201 Created):**
```json
{
  "id": 123,
  "estadoCodigo": "PENDIENTE",
  "total": "2450.00",
  "costoEnvio": "50.00",
  "createdAt": "2026-05-11T20:30:00Z"
}
```

### Error Semantics
- `422 Unprocessable Entity`: carrito vacio, stock insuficiente, producto no disponible, forma de pago invalida o personalizacion invalida.
- `401 Unauthorized`: usuario no autenticado.
- `403 Forbidden`: usuario sin rol `CLIENT` o direccion que no pertenece al usuario.
- `404 Not Found`: direccion inexistente cuando corresponde revelar ausencia.

## Backend Details

### Schemas
- `ItemPedidoRequest`: `producto_id`, `cantidad >= 1`, `personalizacion: list[int] | None`.
- `CrearPedidoRequest`: lista no vacia de items, `forma_pago_codigo`, `direccion_id | None`, `notas | None`.
- `PedidoRead`: `id`, `estado_codigo`, `total`, `costo_envio`, `created_at`.

Los schemas usan aliases camelCase para contrato JSON y `BaseSchema` del proyecto.

### Persistence
El modelo actual tiene `Pedido.direccion_id`, pero no `direccion_snapshot`. Para cumplir RN-PE03/RN-DA06 este change debe agregar:
- `pedido.direccion_snapshot JSONB NULL`.
- `pedido.notas TEXT NULL`.
- Snapshot `NULL` cuando `direccion_id IS NULL` (retiro en local).
- Snapshot completo cuando hay envio, con datos suficientes para reconstruir la direccion historica.

### Transaction Flow
1. Router valida `CrearPedidoRequest` y abre `async with UnitOfWork()`.
2. Service valida que el usuario sea cliente activo segun dependencia de auth.
3. Service valida `forma_pago_codigo` contra catalogo `forma_pago`.
4. Service valida direccion propia si `direccion_id` no es `None` y construye `direccion_snapshot`.
5. Service obtiene productos de los items con bloqueo transaccional para prevenir carreras de stock.
6. Service valida existencia, `disponible=true`, `deleted_at IS NULL`, cantidad y stock suficiente.
7. Service calcula subtotal con `precio_snapshot = producto.precio_base`.
8. Service crea `Pedido` con `estado_codigo="PENDIENTE"`, `costo_envio`, `total`, forma de pago, notas y direccion snapshot.
9. Service crea `DetallePedido` por item con snapshots de nombre/precio y personalizacion `INTEGER[]`.
10. Service crea `HistorialEstadoPedido` con `estado_desde=None`, `estado_hasta="PENDIENTE"`, `cambiado_por_id=usuario_id`.
11. UoW hace commit automatico; ante excepcion, rollback completo.

### Stock Policy
La creacion valida stock dentro de la transaccion, pero no descuenta stock. El descuento pertenece al flujo de pago/FSM cuando el pedido pasa de `PENDIENTE` a `CONFIRMADO` segun RN-FS03.

## Frontend Details
1. Agregar cliente API `crearPedidoApi()`.
2. Agregar hook `useCrearPedido()` con TanStack Query `useMutation`.
3. `CheckoutPage` arma el request desde `cartStore`, direccion seleccionada y forma de pago.
4. En exito, limpiar carrito y navegar a `/pedidos/{id}` o mostrar confirmacion si la ruta de detalle aun no esta implementada.
5. En error, mostrar mensaje accionable sin modificar el carrito.

## Verification Strategy
- Backend: compilar Python, ejecutar tests de servicio/router si existen o agregar tests enfocados al flujo transaccional.
- Frontend: `npm run lint` y `npm run build`.
- Manual: crear pedido con DB seed, verificar `pedido`, `detalle_pedido`, `historial_estado_pedido` y `direccion_snapshot`.
