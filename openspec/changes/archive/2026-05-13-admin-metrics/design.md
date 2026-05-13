## Context

El backend tiene tablas `pedido`, `detalle_pedido`, `producto` y `usuario` con todos los datos necesarios para métricas analíticas. No se requieren cambios de schema. El frontend tiene `recharts` instalado y un `AdminDashboardPage` placeholder. El patrón de módulo ya está establecido por `usuarios/` — router + service + schemas bajo `app/modules/<nombre>/`.

## Goals / Non-Goals

**Goals:**
- 4 endpoints de solo lectura bajo `/admin/metricas/` con autorización `ADMIN`
- Filtro temporal `desde`/`hasta` en todos los endpoints
- Granularidad `dia | semana | mes` en el endpoint de ventas
- AdminDashboardPage con KPI cards + LineChart + BarChart + PieChart

**Non-Goals:**
- Caching / materialización de resultados
- Exportación a CSV
- Métricas en tiempo real (websockets)
- Métricas por rol PEDIDOS o STOCK

## Decisions

### D1 — Módulo `metricas` separado de `admin`

El Integrador menciona `app/modules/admin/` como módulo genérico, pero el patrón real implementado en el proyecto es feature-first: cada capacidad tiene su propio módulo (usuarios, pedidos, pagos). Se crea `app/modules/metricas/` para mantener consistencia arquitectónica y no mezclar métricas con otras responsabilidades futuras de un eventual módulo admin.

### D2 — Queries SQL con `func.` de SQLAlchemy, sin SQL raw

Las agregaciones (`SUM`, `COUNT`, `GROUP BY`, `DATE_TRUNC`) se escriben con el DSL de SQLAlchemy (`func.sum`, `func.count`, `func.date_trunc`) sobre modelos SQLModel. Alternativa descartada: SQL raw con `text()` — funcional pero rompe type safety y dificulta composición de filtros.

### D3 — Parámetros `desde` / `hasta` como `date` en FastAPI

FastAPI convierte automáticamente `?desde=2025-01-01` a `datetime.date` con `Query(default=None)`. El servicio lo convierte a `datetime` para comparación con `created_at` (TIMESTAMPTZ). Si se omiten, el endpoint retorna los últimos 30 días por defecto.

### D4 — Granularidad con `DATE_TRUNC` en PostgreSQL

El endpoint de ventas acepta `granularidad: Literal["dia", "semana", "mes"]`. El servicio mapea los valores a los literales de `DATE_TRUNC` (`'day'`, `'week'`, `'month'`) y agrupa con `GROUP BY`. Alternativa descartada: procesamiento en Python — peor performance y más complejo.

### D5 — Frontend: un hook por endpoint, sin store dedicado

Cada endpoint tiene su propio hook TanStack Query (`useMetricasResumen`, `useMetricasVentas`, etc.). El estado del filtro de fechas vive en el componente `AdminDashboardPage` con `useState`. No se crea un store Zustand — las métricas son estado del servidor, no del cliente.

## Risks / Trade-offs

- **Queries lentas sin índices de fecha** → Aceptable para escala académica. En producción real se agregaría `CREATE INDEX idx_pedido_created_at ON pedido(created_at)`.
- **DATE_TRUNC es PostgreSQL-specific** → El proyecto ya está acoplado a PostgreSQL por otras queries; no es regresión.
- **`recharts` no tiene tipado perfecto con datos dinámicos** → Se tiparán los datos antes de pasarlos al componente para evitar `any`.

## Migration Plan

1. Crear `app/modules/metricas/` (schemas, service, router)
2. Registrar router en `api/v1/__init__.py`
3. Implementar `AdminDashboardPage` reemplazando el placeholder
4. Verificar manualmente que los 4 endpoints retornan datos correctos con la BD local
