## Context

Actualmente el sistema ya cuenta con autenticación (JWT + RBAC) y un shell de frontend que enruta por rol. Falta la capability de **direcciones de entrega** (ERD v5: `DireccionEntrega`) para que el cliente pueda mantener múltiples direcciones, con una marcada como principal, y poder seleccionarla en el checkout.

Restricciones relevantes:
- Ownership estricto: un CLIENT solo puede operar sobre sus propias direcciones (RN-RB05, RN-DI03).
- Unicidad: solo una dirección principal por usuario (RN-DI02).
- Primera dirección creada se marca principal automáticamente (RN-DI01).

## Goals / Non-Goals

**Goals:**
- Exponer API REST bajo `/api/v1/direcciones` para CRUD de direcciones del usuario autenticado.
- Soportar “marcar como principal” garantizando unicidad por usuario.
- Proveer en frontend una pantalla “Mis Direcciones” (listado + formulario) y un “selector” reutilizable para checkout.

**Non-Goals:**
- No se diseña ni implementa checkout/pedidos en este change (solo se deja el selector listo para consumir).
- No se implementan geocoding, validación postal avanzada ni integración con mapas.
- No se agrega multi-tenancy ni direcciones para roles no CLIENT.

## Decisions

1) **Modelo de datos**
- Reusar entidad existente del ERD v5 `DireccionEntrega` con FK a `Usuario` y flag `es_principal`.
- Mantener soft delete (si aplica en el proyecto) consistente con el resto del dominio.

2) **Garantía de unicidad de principal**
- Implementar regla en la capa de servicio dentro de un UoW:
  - Al crear la primera dirección del usuario: set `es_principal=true`.
  - Al marcar una dirección como principal: setear `es_principal=false` en las demás del mismo usuario y `true` en la seleccionada, en la misma transacción.
- Alternativa considerada: unique index parcial en DB (por usuario donde es_principal=true). Se descarta por simplicidad de migración en este change; la invariancia se asegura vía transacción.

3) **Contrato API**
- Endpoints protegidos con JWT (CLIENT).
- Convención de respuestas:
  - `GET /direcciones` paginado o lista simple (definido por spec); incluir `es_principal`.
  - `POST /direcciones` → `201`.
  - `PUT /direcciones/{id}` → `200`.
  - `DELETE /direcciones/{id}` → `204`.
  - `PATCH /direcciones/{id}/principal` → `200` (o `204` si se define así en specs).

4) **Frontend (FSD + server state)**
- Server state con TanStack Query (listado, create/update/delete, set principal) e invalidación por queryKey.
- Formulario con TanStack Form.
- Navegación: agregar route “Mis Direcciones” dentro del shell para rol CLIENT.

## Risks / Trade-offs

- **[Race condition]** dos requests concurrentes para marcar principal → **Mitigación**: operación transaccional en UoW y updates consistentes por usuario.
- **[Inconsistencia de UX]** si se devuelve lista no paginada y luego crece → **Mitigación**: mantener límite razonable o paginación desde el inicio (según specs).
- **[Acoplamiento]** si el checkout depende de campos no definidos → **Mitigación**: el selector consume solo el contrato de direcciones; no asume estructura de pedido.
