# Design: Order FSM

## Architectural Approach
Este change es backend/domain. El contrato API lo define backend y se conserva el flujo `Router -> Service -> UnitOfWork -> Repository -> Model`. La FSM vive en la capa de servicio del modulo `pedidos`; los routers solo validan HTTP, roles y abren el `UnitOfWork`.

El change anterior `payment-integration` ya implemento una confirmacion automatica `PENDIENTE -> CONFIRMADO` dentro de `PagosService`. Este change debe consolidar esa logica para que pagos invoque el mismo caso de uso FSM que usaran las transiciones operativas. Asi se evita duplicar reglas de stock, historial e idempotencia.

## Current Baseline
- `POST /api/v1/pedidos` crea pedidos `PENDIENTE` con historial inicial.
- `PagosService._confirmar_pedido_por_pago()` descuenta stock, cambia el estado a `CONFIRMADO` e inserta historial con `cambiado_por_id=None`.
- `PedidoRepository` ya tiene helpers para `get_productos_for_update()`, `get_detalles_by_pedido_id()`, `save_productos()` y `create_historial()`.
- No existe todavia endpoint de avance manual, schema `AvanzarEstadoRequest`, lectura de historial ni servicio FSM compartido.

## FSM Rules
Mapa de transiciones:

```text
PENDIENTE  -> CONFIRMADO  automatico por pago aprobado
PENDIENTE  -> CANCELADO   cliente propietario, ADMIN o PEDIDOS
CONFIRMADO -> EN_PREP     ADMIN o PEDIDOS
CONFIRMADO -> CANCELADO   ADMIN o PEDIDOS
EN_PREP    -> EN_CAMINO   ADMIN o PEDIDOS
EN_PREP    -> CANCELADO   ADMIN o PEDIDOS
EN_CAMINO  -> ENTREGADO   ADMIN o PEDIDOS
ENTREGADO  -> terminal
CANCELADO  -> terminal
```

Reglas obligatorias:
- `PENDIENTE -> CONFIRMADO` no se acepta por endpoint manual.
- `motivo` es obligatorio cuando `nuevo_estado=CANCELADO`.
- `ENTREGADO` y `CANCELADO` no admiten transiciones salientes.
- Toda transicion crea un nuevo `HistorialEstadoPedido`.
- `HistorialEstadoPedido` sigue siendo append-only: no se agrega ningun UPDATE/DELETE.

## API Contract

### `PATCH /api/v1/pedidos/{pedido_id}/estado`
Protegido para `ADMIN` o `PEDIDOS`.

**Request Body:**
```json
{
  "nuevoEstado": "EN_PREP",
  "motivo": null
}
```

`nuevoEstado` admite `EN_PREP`, `EN_CAMINO`, `ENTREGADO` o `CANCELADO`. La confirmacion `CONFIRMADO` queda reservada al flujo automatico de pagos.

**Response Body (200 OK):**
```json
{
  "id": 123,
  "estadoCodigo": "EN_PREP",
  "total": "2450.00",
  "costoEnvio": "50.00",
  "createdAt": "2026-05-12T03:30:00Z"
}
```

### `DELETE /api/v1/pedidos/{pedido_id}`
Protegido para `CLIENT` propietario. Cancela pedidos propios cuando la FSM lo permite.

**Request Body:**
```json
{
  "motivo": "No voy a poder recibir el pedido"
}
```

**Response Body (200 OK):**
```json
{
  "id": 123,
  "estadoCodigo": "CANCELADO",
  "total": "2450.00",
  "costoEnvio": "50.00",
  "createdAt": "2026-05-12T03:30:00Z"
}
```

### `GET /api/v1/pedidos/{pedido_id}/historial`
Protegido para propietario, `ADMIN` o `PEDIDOS`.

**Response Body (200 OK):**
```json
[
  {
    "id": 1,
    "pedidoId": 123,
    "estadoDesde": null,
    "estadoHasta": "PENDIENTE",
    "cambiadoPorId": 7,
    "createdAt": "2026-05-12T03:30:00Z"
  },
  {
    "id": 2,
    "pedidoId": 123,
    "estadoDesde": "PENDIENTE",
    "estadoHasta": "CONFIRMADO",
    "cambiadoPorId": null,
    "createdAt": "2026-05-12T03:32:00Z"
  }
]
```

## Backend Details

### Schemas
Agregar en `backend/app/modules/pedidos/schemas.py`:
- `AvanzarEstadoRequest`: `nuevo_estado`, `motivo`.
- `CancelarPedidoRequest`: `motivo`.
- `HistorialEstadoRead`: campos publicos del historial.

Normalizar `nuevo_estado` a uppercase. Rechazar payloads vacios o motivos en blanco cuando sean obligatorios.

### Service
Agregar un caso de uso FSM en `PedidosService`, por ejemplo:
- `confirmar_por_pago(uow, pedido_id)`: sistema, automatico, idempotente si ya esta `CONFIRMADO`.
- `avanzar_estado(uow, pedido_id, request, current_user)`: manual `ADMIN`/`PEDIDOS`.
- `cancelar_pedido(uow, pedido_id, request, current_user)`: propietario o roles operativos segun regla.
- `obtener_historial(uow, pedido_id, current_user)`.

El service valida:
- existencia y soft delete de pedido;
- ownership o rol segun caso;
- terminalidad;
- mapa de transiciones;
- obligatoriedad de motivo para cancelaciones;
- restauracion/descuento de stock con productos bloqueados via `SELECT FOR UPDATE`.

### Stock Semantics
- La confirmacion `PENDIENTE -> CONFIRMADO` descuenta stock.
- La cancelacion desde `PENDIENTE` no restaura stock porque aun no se desconto.
- La cancelacion desde `CONFIRMADO` o `EN_PREP` restaura stock una sola vez.
- Para evitar doble restauracion, se valida que el estado actual no sea terminal antes de tocar stock.

### Repository
Extender `PedidoRepository` con:
- `list_historial_by_pedido_id(pedido_id)`.
- Si resulta necesario para tests/claridad, helpers semanticos para historial ordenado.

No agregar metodos que actualicen o eliminen `HistorialEstadoPedido`.

### Persistence
Agregar `motivo TEXT NULL` a `historial_estado_pedido` mediante migracion Alembic.
El campo es opcional porque el historial inicial y las transiciones operativas normales no requieren motivo, pero toda transicion a `CANCELADO` debe persistirlo.

### Integration With Pagos
Reemplazar la logica privada `PagosService._confirmar_pedido_por_pago()` por una llamada al metodo FSM de `PedidosService`. `PagosService` conserva la responsabilidad de pagos y delega la transicion de pedido al dominio de pedidos.

## Error Semantics
- `401 Unauthorized`: usuario sin token.
- `403 Forbidden`: usuario autenticado sin rol/ownership requerido.
- `404 Not Found`: pedido inexistente o soft-deleted.
- `409 Conflict`: transicion invalida, estado terminal, confirmacion manual, stock insuficiente al confirmar.
- `422 Unprocessable Entity`: schema invalido o motivo de cancelacion faltante.

## Verification Strategy
- Backend: compilar Python con `python -m compileall app`.
- Backend: agregar tests de service si existe harness o crear los minimos del modulo para FSM.
- Tests objetivo:
  - `PENDIENTE -> CONFIRMADO` por pago aprobado descuenta stock y es idempotente.
  - `CONFIRMADO -> EN_PREP -> EN_CAMINO -> ENTREGADO` funciona y registra historial.
  - saltos, retrocesos y terminales fallan sin efectos colaterales.
  - cancelacion sin motivo falla.
  - historial de cancelacion conserva `motivo`.
  - cancelacion desde `CONFIRMADO` restaura stock.
  - cliente no cancela pedido ajeno.
- Manual: crear pedido, simular pago aprobado, avanzar estados y consultar historial.

## Risks
- El nombre canonico del estado en seed es `EN_PREP`; algunas historias usan `EN_PREPARACION`. El contrato de este proyecto debe conservar `EN_PREP`, que es lo definido en `docs/Integrador.txt`, seed y specs vigentes.
- Si no existe harness de tests backend, el apply debe priorizar tests de servicio pequenos y aislados o documentar la limitacion con verificacion de compilacion.
- Cualquier cambio en pagos debe ser una refactorizacion interna hacia la FSM, sin modificar el contrato publico de `pagos-api`.
