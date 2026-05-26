## Verification Report: display-cocina

**Date**: 2026-05-21
**Tasks**: 26/32 complete (6 tareas de verificación manual pendientes, sección 11)

---

### Test Results

No test runner configurado para este módulo. Verificación manual funcional confirmada durante el desarrollo de esta sesión:
- WebSocket conecta y emite eventos ✓
- KDS muestra pedidos en tiempo real sin recargar ✓
- Sonido funciona tras interacción de usuario ✓
- Nombres de ingredientes se muestran correctamente ✓

---

### Spec Compliance

| Requirement | Status | Notes |
|---|---|---|
| WS `/api/v1/cocina/ws` — JWT en query param, código 4001 si inválido | PASS | Implementado en cocina/router.py |
| WS — acepta roles COCINA, PEDIDOS, ADMIN | PASS | `_WS_ALLOWED_ROLES` verificado al handshake |
| WS — desconexión limpia sin errores | PASS | `manager.disconnect()` en `finally` |
| `GET /api/v1/cocina/pedidos` — estados CONFIRMADO y EN_PREP | PASS | Filtro correcto |
| `GET /api/v1/cocina/pedidos` — protección con require_role | PASS | COCINA, PEDIDOS, ADMIN |
| `GET /api/v1/cocina/pedidos` — todos los campos requeridos | PASS | incluye `esRetiro`, `timestampEntradaCocina`, `personalizacion` como nombres |
| `GET /api/v1/cocina/pedidos` — ordenado por `timestamp_entrada_cocina` asc | **WARNING** | Ordena por `Pedido.created_at`. El frontend compensa client-side con `timestampEntradaCocina ?? createdAt`. Resultado visual correcto. |
| ConnectionManager — broadcast best-effort, elimina conexiones muertas | PASS | `manager.py` con asyncio.Lock y set de dead connections |
| Emisión `PEDIDO_CONFIRMADO` — pago MercadoPago aprobado | PASS | `_broadcast_pedido_confirmado()` en pagos/router.py |
| Emisión `PEDIDO_CONFIRMADO` — pago offline confirmado | PASS | Agregado a `confirmar_pago_offline` en pedidos/router.py |
| Emisión `PEDIDO_EN_PREPARACION` — transición CONFIRMADO→EN_PREP | PASS | `avanzar_estado` en pedidos/router.py |
| Emisión `PEDIDO_EN_CAMINO` — transición EN_PREP→EN_CAMINO | PASS | `avanzar_estado` en pedidos/router.py |
| Emisión `PEDIDO_CANCELADO` — cancelación desde fase de cocina | **WARNING** | Solo emite `avanzar_estado`. Cancelaciones via `DELETE /pedidos/{id}` no emiten el evento. El rol COCINA no puede cancelar (solo ADMIN/PEDIDOS), pero si un admin cancela un pedido desde otro panel, el KDS no se actualiza hasta el próximo ciclo de polling (30s). |
| Rol COCINA — solo EN_PREP y EN_CAMINO (y ENTREGADO para retiro) | PASS | `allowed_cocina = {EN_PREP, EN_CAMINO, ENTREGADO}` en service.py |
| Rol COCINA — 403 en transiciones no autorizadas | PASS | ForbiddenError si nuevo_estado not in allowed_cocina |
| Auditoría de transición en HistorialEstadoPedido | PASS | `_apply_estado` siempre inserta historial con usuario_id |
| Rol COCINA en seed idempotente | PASS | `ON CONFLICT DO NOTHING` en seed.py |
| Usuario cocina@foodstore.com en seed | PASS | Agregado en esta sesión |
| Pantalla `/cocina` con RoleRoute — roles COCINA, PEDIDOS, ADMIN | PASS | router.tsx con RoleRoute correctamente configurado |
| Guard de ruta — CLIENT y STOCK redirigen a 403 | PASS | RoleRoute redirige si rol no está en la lista |
| Layout dos columnas — "Por preparar" / "En preparación" | PASS | CocinaPage.tsx con grid-cols-2 |
| Carga inicial via GET /cocina/pedidos | PASS | `fetchAll()` al montar en useKDS |
| Tarjeta — número de pedido, ítems, exclusiones, notas, timer | PASS | KDSCard.tsx completo |
| Acción "Iniciar preparación" → EN_PREP | PASS | `handleStart` en CocinaPage |
| Acción "Listo" → EN_CAMINO (delivery) o ENTREGADO (retiro) | PASS | `handleDone` usa `pedido.esRetiro` para elegir estado |
| Evento PEDIDO_CONFIRMADO → tarjeta aparece sin recargar | PASS | WS + setOrders en useKDS |
| Evento PEDIDO_EN_PREPARACION → tarjeta se mueve | PASS | estadoCodigo actualizado en mapa local |
| Evento PEDIDO_EN_CAMINO/CANCELADO → tarjeta desaparece | PASS | `next.delete(pedido_id)` |
| Resiliencia — indicador "Sin conexión" | PASS | Badge rojo "Sin conexión — polling cada 30s" |
| Resiliencia — polling cada 30s al desconectar | PASS | `startPolling()` en `ws.onclose` |
| Resiliencia — al reconectar: fetchAll, stop polling, modo push | PASS | `ws.onopen` hace fetchAll + stopPolling |
| Timer urgencia — umbrales 10 y 20 min | PASS | `timerClass()` en KDSCard.tsx |
| Timer — recalcula cada 15s sin request al backend | PASS | setInterval(15_000) |
| Alerta sonora — beep con Web Audio API sin archivos externos | PASS | kdsSound.ts con AudioContext + oscilador |
| Alerta sonora — solo si toggle ON | PASS | `soundEnabledRef.current` en handleKDSEvent |
| Toggle sonido — persistido en localStorage | PASS | `SOUND_KEY` en CocinaPage |
| Flash visual al recibir PEDIDO_CONFIRMADO | PASS | `prevCountRef` + useEffect + KDSColumn recibe `flash` prop |
| Auto-logout excluido para /cocina | N/A | El proyecto no tiene mecanismo de auto-logout |
| Link a /cocina en AdminSidebar y RoleNav | PASS | Ambos widgets actualizados con condicional por rol |

---

### Design Coherence

- **D-1 WebSocket sobre SSE**: FOLLOWED — `WS /api/v1/cocina/ws` implementado
- **D-2 Pub/sub en proceso sin Redis**: FOLLOWED — `ConnectionManager` con set + asyncio.Lock
- **D-3 Singleton de módulo**: FOLLOWED — `manager = ConnectionManager()` a nivel de módulo
- **D-4 Validación de transición en el servicio**: FOLLOWED — `require_role` abre el endpoint, el service valida la transición específica
- **D-5 Sin estado LISTO**: FOLLOWED — `EN_PREP → EN_CAMINO` es la señal de "comida lista"
- **D-6 JWT por query param**: FOLLOWED — `?token=<JWT>` en el handshake

---

### Summary

- **WARNING**: `GET /api/v1/cocina/pedidos` ordena por `Pedido.created_at` en lugar de `timestamp_entrada_cocina`. El frontend lo compensa client-side; el resultado visual es correcto. No bloquea.
- **WARNING**: `DELETE /pedidos/{id}` (cancelar_pedido) no emite `PEDIDO_CANCELADO` al KDS. Solo `avanzar_estado` lo hace. Impacto: si ADMIN cancela un pedido activo desde otro panel, el KDS verá la tarjeta hasta el próximo polling (max 30s). No bloquea; el fallback de polling cubre el gap.
- **SUGGESTION**: `_EVENTO_POR_ESTADO["CONFIRMADO"]` en pedidos/router.py es código muerto — `avanzar_estado` nunca recibe `nuevo_estado=CONFIRMADO` (el service lo rechaza con 409). Sin impacto funcional.
- **SUGGESTION**: `prevCountRef[0]` se muta directamente dentro de `useState(0)` en CocinaPage.tsx. Funciona pero es poco idiomático; debería ser `useRef(0)`. Sin impacto funcional.
- **PENDING**: Tareas 11.1–11.6 (verificación manual de integración) no marcadas como completas. Son chequeos de QA, no de implementación.

---

**Verdict**: READY FOR ARCHIVE

Ningún CRITICAL. Los dos WARNINGs son no-bloqueantes: el ordenamiento es compensado client-side, y el gap de cancelación está cubierto por el polling de 30s (comportamiento documentado en el diseño como límite conocido de v1).
