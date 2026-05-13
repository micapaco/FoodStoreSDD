# admin-metricas-frontend Specification

## Purpose
TBD - created by archiving change admin-metrics. Update Purpose after archive.
## Requirements
### Requirement: KPI cards en el dashboard
The system SHALL display a row of KPI cards at the top of AdminDashboardPage showing: total ventas del período, cantidad de pedidos, ticket promedio y usuarios registrados.
Data comes from `GET /admin/metricas/resumen`.
The page SHALL show a loading skeleton while data is fetching and an error message if the request fails.

#### Scenario: Cards visibles con datos
- **WHEN** an ADMIN navigates to the dashboard and the API responds successfully
- **THEN** the page displays 4 KPI cards with numeric values formatted appropriately (currency for sales, integer for counts)

#### Scenario: Estado de carga
- **WHEN** the API request is in flight
- **THEN** the page displays skeleton loaders in place of the KPI cards

#### Scenario: Error de API
- **WHEN** the API returns an error
- **THEN** the page displays an inline error message instead of the cards

---

### Requirement: Gráfico de evolución de ventas
The system SHALL render a `<LineChart>` (recharts) in AdminDashboardPage showing sales amount and order count over time.
Data comes from `GET /admin/metricas/ventas`.
The page SHALL provide a granularity selector (día / semana / mes) and a date range picker or preset buttons (7d, 30d, 90d).

#### Scenario: LineChart con datos
- **WHEN** the ventas API responds with time-series data
- **THEN** the chart renders one line for `total_ventas` and one line for `cantidad_pedidos` over the x-axis of dates

#### Scenario: Cambio de granularidad
- **WHEN** the user selects a different granularity (e.g., "Mes")
- **THEN** TanStack Query re-fetches with the new `granularidad` param and the chart updates

#### Scenario: Sin datos en el período
- **WHEN** the API returns `puntos: []`
- **THEN** the chart displays an empty state message instead of an empty axis

---

### Requirement: Gráfico de top productos
The system SHALL render a `<BarChart>` (recharts) in AdminDashboardPage showing the top 10 best-selling products.
Data comes from `GET /admin/metricas/productos-top`.
Each bar represents one product; x-axis shows product name, y-axis shows `cantidad_vendida`.

#### Scenario: BarChart con datos
- **WHEN** the productos-top API responds
- **THEN** the chart renders up to 10 horizontal bars ordered by units sold descending, showing product name and quantity

#### Scenario: Sin datos
- **WHEN** no products have been sold in the period
- **THEN** the chart area shows an empty state message

---

### Requirement: Gráfico de distribución por estado
The system SHALL render a `<PieChart>` (recharts) in AdminDashboardPage showing the count of orders per state.
Data comes from `GET /admin/metricas/pedidos-por-estado`.
Each slice represents one `estado_codigo`; hovering shows the exact count.

#### Scenario: PieChart con datos
- **WHEN** the pedidos-por-estado API responds with multiple states
- **THEN** the chart renders one slice per state with a legend showing the state code and count

#### Scenario: Sin pedidos
- **WHEN** the API returns `estados: []`
- **THEN** the chart area shows an empty state message

---

### Requirement: Filtro de período global
The dashboard SHALL provide preset period buttons (Hoy, 7d, 30d, 90d) that update all charts simultaneously by adjusting the `desde` / `hasta` params on all API requests.

#### Scenario: Selección de preset
- **WHEN** the user clicks the "30d" preset
- **THEN** all 4 TanStack Query hooks re-fetch with the corresponding date range and all charts update

