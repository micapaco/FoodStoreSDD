## Context

Food Store corre en FastAPI + PostgreSQL con arquitectura REST pura — no tiene WebSockets ni pub/sub. El FSM de pedidos ya existe (`PATCH /api/v1/pedidos/{id}/estado`), así como el historial append-only (`HistorialEstadoPedido`). El rol COCINA no existe en el catálogo: la operación de cocina la absorbe actualmente `PEDIDOS`. No hay tablas nuevas que agregar — toda la información que necesita el KDS ya existe en el modelo actual.

## Goals / Non-Goals

**Goals:**
- Agregar el rol `COCINA` al RBAC y al seed idempotente
- Exponer un endpoint WebSocket (`WS /api/v1/cocina/ws`) con autenticación JWT en el handshake
- Exponer un endpoint REST de respaldo (`GET /api/v1/cocina/pedidos`) para carga inicial y polling
- Emitir eventos desde el servicio FSM hacia las conexiones de cocina activas al commitear transiciones
- Autorizar al rol `COCINA` para ejecutar `CONFIRMADO → EN_PREP` y `EN_PREP → EN_CAMINO` en el servicio del FSM
- Implementar la pantalla KDS en `/cocina` con actualización en tiempo real y resiliencia

**Non-Goals:**
- Redis, multi-instancia, bus externo de eventos — fuera de scope v1 (documentado como límite conocido)
- Server-Sent Events — se eligió WebSocket (ver Decisiones)
- Estados nuevos en el FSM (no se agrega `LISTO` entre `EN_PREP` y `EN_CAMINO`)
- Estaciones de cocina, multi-sucursal, mesas, roles WAITER

## Decisions

### D-1: WebSocket sobre SSE
**Elegido:** WebSocket (`WS /api/v1/cocina/ws`)  
**Alternativa descartada:** Server-Sent Events  
**Razón:** WebSocket es bidireccional — permite que el frontend envíe reconocimientos o heartbeats sin polling adicional, y FastAPI lo soporta nativamente con `WebSocket`. SSE es unidireccional y suficiente para v1, pero WebSocket no agrega complejidad significativa y evita rediseñar si se necesita bidireccionalidad en el futuro.

### D-2: Pub/sub en proceso (asyncio), sin Redis
**Elegido:** Gestor de conexiones como set de WebSockets activos, manejado con `asyncio.Lock` para seguridad de concurrencia.  
**Alternativa descartada:** Redis Pub/Sub  
**Razón:** Food Store corre en una sola instancia. Redis agrega infraestructura innecesaria para v1. El límite conocido queda documentado: si se escala a múltiples instancias, el pub/sub en proceso no propaga eventos entre nodos — ahí se necesita Redis.

### D-3: Gestor de conexiones como singleton de módulo
El `ConnectionManager` vive en `backend/app/modules/cocina/manager.py` como instancia singleton a nivel de módulo (importada donde se necesite). No se usa el contenedor de inyección de FastAPI para esto porque el estado de las conexiones activas es global y no debe crearse por request.

### D-4: Validación de transición por rol en el servicio, no en require_role
`require_role(["COCINA", "PEDIDOS", "ADMIN"])` abre el endpoint de avance de estado. La validación de **qué transición** puede ejecutar cada rol vive en el servicio FSM (`pedidos/service.py`). Un cocinero que intente `EN_CAMINO → ENTREGADO` recibe **403** aunque pase el `require_role`. Esto mantiene la lógica de autorización fina centralizada en el dominio.

### D-5: Sin estado FSM nuevo (`LISTO`)
La señal de "cocina terminó" es `EN_PREP → EN_CAMINO`. Esto mezcla "comida lista" con "salió a reparto" en un solo evento — aceptable para v1 delivery donde el despacho es inmediato. Se deja como pregunta abierta PA-CO-01 para v2.

### D-6: Autenticación WebSocket por query param
El JWT se pasa como `?token=<JWT>` en el handshake WebSocket. Las cabeceras HTTP estándar no están disponibles en el handshake en todos los clientes de browser. Se valida el JWT al conectar; si falla, se cierra la conexión con código 4001.

## Risks / Trade-offs

- **Multi-instancia (crítico):** El pub/sub en proceso no funciona con múltiples instancias del backend. Si se escala horizontalmente, los eventos de cocina solo llegan a las conexiones del mismo proceso. → Mitigación v1: documentar el límite en README del módulo. Mitigación futura: reemplazar `ConnectionManager` con un adaptador Redis Pub/Sub.

- **Eventos perdidos durante desconexión:** La v1 no persiste eventos. Si el WebSocket del KDS se desconecta y reconecta, los eventos intermedios se pierden. → Mitigación: al reconectar, el KDS hace un `GET /api/v1/cocina/pedidos` para obtener el estado completo actual.

- **Política de autoplay del navegador:** La alerta sonora requiere una interacción previa del usuario en la página. Sin esa interacción, el navegador bloquea el audio. → Mitigación: mostrar un botón "Activar sonido" al cargar la página; el toggle de sonido solo funciona después de esa interacción.

- **Latencia bajo carga:** El gestor de conexiones itera sobre el set de conexiones activas para broadcast. Con muchas conexiones simultáneas y alta frecuencia de eventos, esto puede introducir latencia. → Para v1 (pocos cocineros simultáneos) es despreciable.

## Migration Plan

1. Agregar `Rol(codigo='COCINA', nombre='Cocinero')` al seed idempotente (`ON CONFLICT DO NOTHING`) — sin migración de schema.
2. Agregar el router de cocina a `main.py` (`/api/v1/cocina`).
3. Modificar el servicio FSM de pedidos para emitir eventos al `ConnectionManager` después de cada transición exitosa.
4. Deploy: las pantallas de cocina se conectan al WS; si no hay ninguna, los eventos se descartan sin error.
5. Rollback: retirar el router de cocina de `main.py` y el `require_role` en el servicio FSM. Sin datos que revertir (sin tablas nuevas).

## Open Questions

- **PA-CO-01:** ¿Agregar estado `LISTO` entre `EN_PREP` y `EN_CAMINO` para separar "comida lista" de "salió a reparto"? Descartado para v1; evaluar en v2 si el negocio lo requiere.
- **US-COCINA-07 (opcional):** ¿La cocina puede marcar productos como no disponibles? Reutiliza `PATCH /api/v1/productos/{id}/disponibilidad` con permiso para `COCINA`. Puede implementarse como extensión mínima sin cambio de schema.
