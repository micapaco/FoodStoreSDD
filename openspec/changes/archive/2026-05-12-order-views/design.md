## Context

`order-creation`, `payment-integration` y `order-fsm` ya estan archivados. Hoy el backend puede crear pedidos, registrar pagos, avanzar estados y exponer historial, pero todavia no ofrece endpoints de lectura completos para cliente ni panel operativo. En frontend, las rutas `/pedidos`, `/pedidos/:id` y `/admin/pedidos` ya existen por `frontend-shell`, aunque siguen siendo placeholders.

Este change es cross-domain coordinado desde el contrato backend. La decision central es definir primero las lecturas de pedidos en `openspec`, luego implementar backend y finalmente consumirlo desde frontend sin inventar payloads.

## Goals / Non-Goals

**Goals:**

- Definir y luego implementar lecturas de pedidos propias para `CLIENT`.
- Definir y luego implementar lecturas administrativas para `ADMIN` y `PEDIDOS`.
- Reutilizar historial, pago y snapshots ya existentes sin alterar su semantica.
- Reemplazar placeholders frontend por experiencias de lista, detalle y gestion operativa.
- Mantener separacion clara entre contrato backend, queries de TanStack Query y presentacion UI.

**Non-Goals:**

- No reabrir el flujo de creacion de pedidos.
- No cambiar la FSM ni las reglas de cancelacion ya archivadas.
- No redisenar pagos ni MercadoPago.
- No implementar metricas, dashboard ni administracion de usuarios.
- No crear una nueva capability de admin general fuera del dominio de pedidos.

## Decisions

### 1. Separar endpoints de cliente y endpoints operativos
Se adoptan rutas diferenciadas:

- `GET /api/v1/pedidos`
- `GET /api/v1/pedidos/{pedido_id}`
- `GET /api/v1/admin/pedidos`
- `GET /api/v1/admin/pedidos/{pedido_id}`

**Rationale:** las historias de usuario del proyecto distinguen lectura propia de lectura operativa. Separar rutas evita que `GET /pedidos` cambie semantica segun el rol y mantiene ownership, filtros y response models mas claros.

**Alternative considered:** usar un unico `GET /api/v1/pedidos` que liste propios para `CLIENT` y todos para `ADMIN`/`PEDIDOS`. Se descarta por ambiguedad contractual y porque mezcla dos superficies de lectura con necesidades distintas.

### 2. Reutilizar el modulo `pedidos`
Las consultas se implementaran dentro de `backend/app/modules/pedidos/`, manteniendo router, service y repository del dominio actual. Los endpoints administrativos pueden declararse en el mismo router o en una subdivision del dominio pedidos, pero no deben introducir un modulo `admin` artificial en este change.

**Rationale:** `order-views` pertenece al dominio pedidos, no al futuro change de metricas ni al de usuarios.

### 3. Responses separadas para resumen y detalle
El backend debera distinguir como minimo:

- resumen paginado para listas de cliente;
- resumen operativo para lista administrativa;
- detalle cliente;
- detalle operativo.

**Rationale:** evita sobreexponer datos en vistas simples y mantiene responses alineadas con cada caso de uso.

### 4. Frontend basado en TanStack Query y rutas ya existentes
Las rutas declaradas por el shell se reutilizan. La UI reemplaza placeholders y consume hooks de query dedicados a listas y detalle.

**Rationale:** respeta FSD, aprovecha cache e invalidacion consistente, y evita meter fetching directo en pages.

### 5. Historial y pago se leen como subdatos, no se recalculan
El detalle debe componer informacion ya persistida:

- historial append-only;
- intentos/estado de pago visibles;
- snapshots de items y direccion.

**Rationale:** el objetivo del change es visualizacion, no recomputar dominio ni reconstruir informacion desde tablas vivas.

## Risks / Trade-offs

- **[Risk]** Las historias e `Integrador.txt` no expresan de forma totalmente uniforme las rutas de lectura administrativa.  
  **Mitigation:** el change fija explicitamente la decision en `openspec` y prioriza la separacion cliente/admin descrita en historias.

- **[Risk]** El detalle operativo puede crecer demasiado si se serializa sin foco.  
  **Mitigation:** definir schemas especificos por caso de uso y mantener solo campos necesarios para operar y auditar.

- **[Risk]** Duplicar queries entre detalle propio y detalle admin.  
  **Mitigation:** compartir helpers de repository/service cuando la consulta base sea comun y especializar solo permisos/shape final.

- **[Risk]** La UI administrativa intente cubrir acciones de FSM dentro del mismo change.  
  **Mitigation:** este change se limita a visualizacion y acceso al detalle operativo; acciones de cambio de estado solo se conectaran si el alcance aprobado lo requiere explicitamente en apply, sin ampliar specs por accidente.

## Migration Plan

1. Mantener placeholders actuales hasta que el backend de lectura y los hooks frontend esten listos.
2. Implementar primero contratos backend y schemas.
3. Conectar frontend de cliente a los endpoints propios.
4. Conectar panel operativo a endpoints admin.
5. Verificar navegacion protegida, paginacion, filtros y errores.
6. Si el apply necesita rollback, se pueden revertir las nuevas rutas de lectura sin afectar creacion, pagos ni FSM existentes.

## Open Questions

- Confirmar en apply si el detalle operativo vivira dentro de `/admin/pedidos` como modal/panel o como futura ruta dedicada, siempre que el contrato backend quede estable.
- Confirmar si el listado de cliente mostrara el ultimo estado de pago directamente o solo lo resolvera en detalle, segun el response final que definan los schemas backend.

