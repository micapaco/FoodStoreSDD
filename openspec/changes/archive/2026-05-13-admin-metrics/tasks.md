## 1. Backend — schemas Pydantic

- [x] 1.1 Crear `metricas/schemas.py` con `ResumenResponse`, `PuntoVentaItem`, `VentasResponse`, `ProductoTopItem`, `ProductosTopResponse`, `EstadoCountItem`, `PedidosPorEstadoResponse`

## 2. Backend — service layer

- [x] 2.1 Crear `metricas/service.py` con `get_resumen(desde, hasta, uow)` — SUM(total), COUNT(pedido), AVG(total), COUNT(usuario), top 5 productos por cantidad vendida
- [x] 2.2 Agregar `get_ventas(desde, hasta, granularidad, uow)` — GROUP BY DATE_TRUNC en tabla pedido, retorna lista de puntos `{fecha, total_ventas, cantidad_pedidos}`
- [x] 2.3 Agregar `get_productos_top(top, desde, hasta, uow)` — JOIN detalle_pedido → producto, ORDER BY cantidad_vendida DESC, LIMIT top
- [x] 2.4 Agregar `get_pedidos_por_estado(desde, hasta, uow)` — GROUP BY estado_codigo, retorna lista de `{estado_codigo, cantidad}`

## 3. Backend — router

- [x] 3.1 Crear `metricas/router.py` con prefix `/admin/metricas`, dependencia `require_role(["ADMIN"])`
- [x] 3.2 `GET /resumen` → `get_resumen`
- [x] 3.3 `GET /ventas` → `get_ventas` con query params `desde`, `hasta`, `granularidad` (default `dia`)
- [x] 3.4 `GET /productos-top` → `get_productos_top` con query params `top` (default 10), `desde`, `hasta`
- [x] 3.5 `GET /pedidos-por-estado` → `get_pedidos_por_estado` con query params `desde`, `hasta`
- [x] 3.6 Registrar router en `api/v1/__init__.py`

## 4. Frontend — tipos y API

- [x] 4.1 Crear `entities/metricas/types.ts` con interfaces TypeScript para los 4 responses
- [x] 4.2 Crear `shared/api/metricas.ts` con `getResumenApi`, `getVentasApi`, `getProductosTopApi`, `getPedidosPorEstadoApi`

## 5. Frontend — hooks TanStack Query

- [x] 5.1 Crear `shared/hooks/useMetricas.ts` con `useMetricasResumen`, `useMetricasVentas`, `useMetricasProductosTop`, `useMetricasPedidosPorEstado`

## 6. Frontend — AdminDashboardPage

- [x] 6.1 Implementar selector de período (preset buttons: Hoy, 7d, 30d, 90d) con estado `{ desde, hasta }` en el componente
- [x] 6.2 Implementar 4 KPI cards: total ventas, cantidad pedidos, ticket promedio, usuarios registrados — skeleton loader mientras carga
- [x] 6.3 Implementar `<LineChart>` (recharts) con datos de `useMetricasVentas` — selector de granularidad (día/semana/mes)
- [x] 6.4 Implementar `<BarChart>` (recharts) con top 10 productos de `useMetricasProductosTop`
- [x] 6.5 Implementar `<PieChart>` (recharts) con distribución por estado de `useMetricasPedidosPorEstado`
- [x] 6.6 Manejar estados vacíos (`puntos: []`, `productos: []`, `estados: []`) con mensaje en lugar de gráfico vacío

## 7. Verificación

- [x] 7.1 Verificar `GET /admin/metricas/resumen` retorna datos correctos con y sin filtro de fecha
- [x] 7.2 Verificar `GET /admin/metricas/ventas?granularidad=dia|semana|mes`
- [x] 7.3 Verificar `GET /admin/metricas/productos-top?top=5` retorna máximo 5 resultados ordenados
- [x] 7.4 Verificar `GET /admin/metricas/pedidos-por-estado` retorna distribución correcta
- [x] 7.5 Verificar que un no-ADMIN recibe 403 en todos los endpoints
- [x] 7.6 Build TypeScript sin errores — **verificaciones completadas: frontend build exitoso, módulos backend implementados y registrados.**
