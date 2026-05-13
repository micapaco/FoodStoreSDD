## Why

El panel de administración existe como placeholder desde el change de frontend-shell. Los admins no tienen visibilidad sobre ventas, tendencias ni distribución de pedidos, lo que impide tomar decisiones operativas informadas. Este change cierra esa brecha con el dashboard analítico requerido por la rúbrica (US-056 a US-059).

## What Changes

- **Nuevo módulo backend** `app/modules/metricas/` con 4 endpoints de solo lectura bajo `/admin/metricas/`, protegidos por rol `ADMIN`
- **AdminDashboardPage** reemplaza el placeholder con cards de KPIs + 3 gráficos recharts (líneas, barras, torta)
- **Filtro temporal** con parámetros `desde` / `hasta` (ISO date) soportado en todos los endpoints; granularidad `dia | semana | mes` en el endpoint de evolución de ventas

## Capabilities

### New Capabilities

- `admin-metricas-api`: 4 endpoints FastAPI que ejecutan queries de agregación SQL sobre `pedido`, `detalle_pedido` y `producto`. Sin cambios de schema — opera sobre tablas existentes del ERD v5.
- `admin-metricas-frontend`: AdminDashboardPage con KPI cards + `<LineChart>` + `<BarChart>` + `<PieChart>` de recharts, hooks TanStack Query con `staleTime` fijo.

### Modified Capabilities

_(ninguna — este change no modifica contratos existentes)_

## Impact

- **Backend**: nuevo módulo `app/modules/metricas/` (schemas, service, router); registro en `api/v1/__init__.py`
- **Frontend**: `src/pages/admin/AdminDashboardPage.tsx` (placeholder → implementación completa); nuevos tipos, API functions y hooks en `shared/`
- **Dependencias**: `recharts` ya está en `package.json`; no se instala nada nuevo
- **Performance**: queries de agregación sobre tablas sin índices de fecha — aceptable para volumen académico; sin caching requerido
