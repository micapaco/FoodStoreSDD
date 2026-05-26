## 1. Backend — Seed y estructura del módulo

- [x] 1.1 Agregar `Rol(codigo='COCINA', nombre='Cocinero')` al seed idempotente en `backend/app/db/seed.py` con `ON CONFLICT DO NOTHING`
- [x] 1.2 Crear directorio `backend/app/modules/cocina/` con `__init__.py`, `router.py`, `schemas.py`, `manager.py`
- [x] 1.3 Crear `PedidoCocinaRead` en `schemas.py`: `id`, `estado_codigo`, `notas`, `timestamp_entrada_cocina`, lista de ítems con `nombre_snapshot`, `cantidad`, `personalizacion`

## 2. Backend — Gestor de conexiones WebSocket

- [x] 2.1 Implementar `ConnectionManager` en `manager.py`: set de WebSockets activos, `connect(ws)`, `disconnect(ws)`, `broadcast(message: dict)` con manejo de conexiones cerradas y `asyncio.Lock`
- [x] 2.2 Exponer instancia singleton de `ConnectionManager` importable desde otros módulos del paquete

## 3. Backend — Endpoints de cocina

- [x] 3.1 Implementar `WS /api/v1/cocina/ws?token=<JWT>` en `router.py`: validar JWT del query param al handshake, rechazar con código 4001 si inválido, registrar en `ConnectionManager`, mantener conexión abierta con `await websocket.receive_text()` en loop
- [x] 3.2 Implementar `GET /api/v1/cocina/pedidos` en `router.py`: filtrar pedidos con `estado_codigo IN ('CONFIRMADO', 'EN_PREP')`, ordenar por `timestamp_entrada_cocina` ascendente, responder con lista de `PedidoCocinaRead`; proteger con `require_role(["COCINA", "PEDIDOS", "ADMIN"])`
- [x] 3.3 Registrar el router de cocina en `backend/app/main.py` con prefijo `/api/v1/cocina`

## 4. Backend — Modificación del servicio FSM

- [x] 4.1 En el servicio FSM de pedidos (`pedidos/service.py`), agregar validación de rol para transiciones de cocina: si el usuario tiene rol `COCINA` y la transición solicitada NO es `CONFIRMADO → EN_PREP` ni `EN_PREP → EN_CAMINO`, lanzar `HTTPException(403)`
- [x] 4.2 Actualizar `require_role` del endpoint `PATCH /api/v1/pedidos/{id}/estado` para incluir `"COCINA"` en la lista de roles permitidos
- [x] 4.3 Agregar emisión de evento al `ConnectionManager` en el servicio FSM tras commitear cada transición: `PENDIENTE → CONFIRMADO` emite `PEDIDO_CONFIRMADO`, `CONFIRMADO → EN_PREP` emite `PEDIDO_EN_PREPARACION`, `EN_PREP → EN_CAMINO` emite `PEDIDO_EN_CAMINO`, cualquier `→ CANCELADO` desde fase de cocina emite `PEDIDO_CANCELADO`

## 5. Frontend — Tipos y API client

- [x] 5.1 Crear tipos en `src/entities/cocina/types.ts`: `PedidoCocinaRead`, `KDSEvent` (union type con los 4 tipos de evento y sus payloads)
- [x] 5.2 Crear `src/shared/api/cocina.ts` con función `getCocinaOrdersActive(): Promise<PedidoCocinaRead[]>` usando el cliente Axios existente

## 6. Frontend — Hook useKDS

- [x] 6.1 Crear `src/features/cocina/hooks/useKDS.ts`: estado local de pedidos (`Map<id, PedidoCocinaRead>` separado por columna), abrir WebSocket al montar, manejar eventos `KDSEvent` actualizando el mapa de pedidos, cerrar al desmontar
- [x] 6.2 Implementar lógica de reconexión en `useKDS`: al detectar cierre del WebSocket, activar polling con `setInterval(30s)` a `getCocinaOrdersActive()`, reintentar conexión WebSocket, al reconectar cancelar polling y hacer fetch completo del estado actual
- [x] 6.3 Exponer desde el hook: `porPreparar: PedidoCocinaRead[]`, `enPreparacion: PedidoCocinaRead[]`, `wsConnected: boolean`, `advanceOrder(id, newState)`

## 7. Frontend — Componentes KDS

- [x] 7.1 Crear `src/features/cocina/components/KDSCard.tsx`: muestra número de pedido, ítems (nombre × cantidad), exclusiones de personalización, notas del cliente, timer de urgencia y botón de acción ("Iniciar preparación" / "Listo")
- [x] 7.2 Implementar timer de urgencia en `KDSCard`: calcular minutos desde `timestamp_entrada_cocina`, aplicar clase de color según umbrales (normal < 10 min / advertencia naranja 10–20 min / urgente rojo > 20 min), recalcular con `setInterval(15000)`
- [x] 7.3 Crear `src/features/cocina/components/KDSColumn.tsx`: título de columna, lista de `KDSCard`, estado vacío
- [x] 7.4 Crear `src/features/cocina/components/SoundToggle.tsx`: botón ON/OFF que persiste en `localStorage`, activa audio mediante interacción del usuario (evitar restricción de autoplay)

## 8. Frontend — Alerta sonora

- [x] 8.1 Implementar `src/features/cocina/lib/kdsSound.ts`: función `playBeep()` usando Web Audio API (`AudioContext`, oscilador breve), sin archivos externos; exportar función de activación que requiere interacción previa del usuario

## 9. Frontend — Página CocinaPage

- [x] 9.1 Crear `src/pages/cocina/CocinaPage.tsx`: layout de dos columnas ("Por preparar" / "En preparación"), integra `useKDS`, muestra `KDSColumn` para cada estado, muestra indicador de conexión WebSocket (badge verde/rojo), incluye `SoundToggle`
- [x] 9.2 Al recibir `PEDIDO_CONFIRMADO` con sonido activado, llamar `playBeep()` y aplicar flash visual breve en la columna "Por preparar"

## 10. Frontend — Rutas y navegación

- [x] 10.1 Agregar ruta `/cocina` en `src/app/router.tsx` con guard `RoleRoute` que permita `COCINA`, `PEDIDOS` y `ADMIN`
- [x] 10.2 Agregar link a `/cocina` en `AdminSidebar.tsx` y `RoleNav.tsx` condicionado a roles `COCINA`, `PEDIDOS` y `ADMIN`
- [x] 10.3 Excluir la ruta `/cocina` del mecanismo de auto-logout por inactividad (si existe en el proyecto)

## 11. Verificación

- [ ] 11.1 Verificar que el seed incluye el rol `COCINA` correctamente (idempotente en re-ejecución)
- [ ] 11.2 Verificar que un usuario con rol `COCINA` puede autenticarse y recibir token con `roles: ["COCINA"]`
- [ ] 11.3 Verificar flujo completo: pago aprobado → tarjeta aparece en KDS → cocinero toma pedido → se mueve a "En preparación" → cocinero marca listo → tarjeta desaparece
- [ ] 11.4 Verificar que un usuario `COCINA` recibe 403 al intentar `ENTREGADO` o cualquier transición fuera de su alcance
- [ ] 11.5 Verificar resiliencia: desconectar manualmente el WebSocket y confirmar que el KDS activa polling y muestra el indicador de "sin conexión"
- [ ] 11.6 Verificar guard de ruta: un usuario `CLIENT` no puede acceder a `/cocina`
