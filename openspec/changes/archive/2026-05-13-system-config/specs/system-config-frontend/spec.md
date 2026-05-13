## ADDED Requirements

### Requirement: Panel de configuración del sistema
The system SHALL provide a `SystemConfigPage` accessible to ADMIN users at the `/admin/configuracion` route.
The page SHALL display all configuration parameters returned by `GET /admin/configuracion` as an editable form.
Each parameter SHALL render an appropriate input control based on its type: number input for `costo_envio_base`, toggle/checkbox for `pedidos_habilitados`, text input for `mensaje_sistema`.

#### Scenario: Admin ve la página de configuración
- **WHEN** an ADMIN navigates to `/admin/configuracion`
- **THEN** the page displays a form with all three parameters pre-filled with their current values

#### Scenario: Estado de carga
- **WHEN** the `GET /admin/configuracion` request is in flight
- **THEN** the page shows skeleton loaders in place of the form fields

#### Scenario: Error al cargar
- **WHEN** the API returns an error on load
- **THEN** the page shows an inline error message

---

### Requirement: Editar y guardar un parámetro
The system SHALL allow ADMIN users to edit a parameter value and save it individually via `PUT /admin/configuracion/{clave}`.
On success: the field updates in place and a success toast is shown.
On error: an inline error message appears next to the field.

#### Scenario: Guardar costo de envío
- **WHEN** an ADMIN changes the value of `costo_envio_base` and clicks "Guardar"
- **THEN** the system calls `PUT /admin/configuracion/costo_envio_base` and shows a success toast on 200

#### Scenario: Error de validación
- **WHEN** an ADMIN enters a non-numeric value for `costo_envio_base` and clicks "Guardar"
- **THEN** the field shows an inline error and no API call is made

---

### Requirement: Indicador de pedidos desactivados
When `pedidos_habilitados` is `false`, the `SystemConfigPage` SHALL display a prominent warning banner indicating that order creation is currently disabled.

#### Scenario: Banner visible cuando pedidos desactivados
- **WHEN** `pedidos_habilitados` is `false`
- **THEN** the page shows a visible warning banner "El local está cerrado — los clientes no pueden realizar pedidos"
