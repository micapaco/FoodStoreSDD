# admin-metricas-api Specification

## Purpose
TBD - created by archiving change admin-metrics. Update Purpose after archive.
## Requirements
### Requirement: Resumen de KPIs
The system SHALL expose `GET /api/v1/admin/metricas/resumen` to return general business KPIs.
Access requires role `ADMIN`.
Optional query params: `desde` (date, ISO), `hasta` (date, ISO). If omitted, defaults to the last 30 days.
Response: `{ total_ventas: number, cantidad_pedidos: number, ticket_promedio: number, usuarios_registrados: number, productos_top: [{producto_id, nombre, cantidad_vendida, ingreso_total}] }`.

#### Scenario: Resumen con rango explícito
- **WHEN** an ADMIN sends `GET /admin/metricas/resumen?desde=2025-01-01&hasta=2025-01-31`
- **THEN** the system returns HTTP 200 with aggregated totals filtered to that date range

#### Scenario: Resumen sin parámetros
- **WHEN** an ADMIN sends `GET /admin/metricas/resumen` with no query params
- **THEN** the system returns HTTP 200 with data from the last 30 days

#### Scenario: Acceso sin rol ADMIN
- **WHEN** a non-ADMIN user calls the endpoint
- **THEN** the system returns HTTP 403

---

### Requirement: Evolución de ventas
The system SHALL expose `GET /api/v1/admin/metricas/ventas` to return time-series sales data.
Access requires role `ADMIN`.
Query params: `desde` (date), `hasta` (date), `granularidad` (`dia` | `semana` | `mes`, default `dia`).
Response: `{ puntos: [{fecha: string, total_ventas: number, cantidad_pedidos: number}] }`.
Aggregation uses `DATE_TRUNC` in PostgreSQL grouped by the chosen granularity.

#### Scenario: Evolución diaria
- **WHEN** an ADMIN sends `GET /admin/metricas/ventas?desde=2025-01-01&hasta=2025-01-07&granularidad=dia`
- **THEN** the system returns HTTP 200 with one data point per day showing total sales and order count

#### Scenario: Evolución mensual
- **WHEN** an ADMIN sends `GET /admin/metricas/ventas?granularidad=mes`
- **THEN** the system returns HTTP 200 with one data point per month, grouped by month start date

#### Scenario: Granularidad inválida
- **WHEN** an ADMIN sends `granularidad=hora`
- **THEN** the system returns HTTP 422

---

### Requirement: Top productos más vendidos
The system SHALL expose `GET /api/v1/admin/metricas/productos-top` to return the ranking of best-selling products.
Access requires role `ADMIN`.
Query params: `top` (int, default 10, max 50), `desde` (date), `hasta` (date).
Response: `{ productos: [{producto_id, nombre, cantidad_vendida, ingreso_total}] }`.
Ordered by `cantidad_vendida` descending.

#### Scenario: Top 10 por defecto
- **WHEN** an ADMIN sends `GET /admin/metricas/productos-top`
- **THEN** the system returns HTTP 200 with up to 10 products ordered by units sold descending

#### Scenario: Top N personalizado
- **WHEN** an ADMIN sends `?top=5`
- **THEN** the system returns at most 5 products

#### Scenario: Top con filtro de fecha
- **WHEN** an ADMIN sends `?desde=2025-01-01&hasta=2025-01-31`
- **THEN** only orders created in that range are counted

---

### Requirement: Distribución de pedidos por estado
The system SHALL expose `GET /api/v1/admin/metricas/pedidos-por-estado` to return the count of orders grouped by state.
Access requires role `ADMIN`.
Query params: `desde` (date), `hasta` (date).
Response: `{ estados: [{estado_codigo: string, cantidad: number}] }`.

#### Scenario: Distribución completa
- **WHEN** an ADMIN sends `GET /admin/metricas/pedidos-por-estado`
- **THEN** the system returns HTTP 200 with one entry per state that has at least one order

#### Scenario: Sin pedidos en rango
- **WHEN** no orders exist in the requested date range
- **THEN** the system returns HTTP 200 with `estados: []`

